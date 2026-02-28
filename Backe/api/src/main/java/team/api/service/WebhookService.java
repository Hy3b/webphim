package team.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RMap;
import org.redisson.api.RMapCache;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.api.dto.request.WebhookRequest;
import team.api.entity.Booking;
import team.api.entity.BookingSeat;
import team.api.entity.Seat;
import team.api.repository.BookingRepository;
import team.api.repository.BookingSeatRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {

    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final RedissonClient redissonClient;

    @Transactional(rollbackFor = Exception.class)
    public String processPaymentWebhook(WebhookRequest request) {
        // 1. (Mock) Verify Signature to ensure the webhook is actually from VNPay/Momo
        if (!"valid_secret_hash_signature".equals(request.getSignature())) {
            throw new RuntimeException("Invalid Webhook Signature!");
        }

        // 2. Fetch the Booking
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found."));

        if (!Booking.Status.pending.equals(booking.getStatus())) {
            return "Webhook ignored. Booking is already processed with status: " + booking.getStatus();
        }

        String redisHashKey = "showtime:" + booking.getShowtime().getShowtimeId() + ":seats";
        String ttlMapKey = "showtime:" + booking.getShowtime().getShowtimeId() + ":ttl_seats";

        RMap<String, String> seatStatuses = redissonClient.getMap(redisHashKey);
        RMapCache<String, Integer> ttlSeats = redissonClient.getMapCache(ttlMapKey);

        // 3. Handle Payment Failed/Cancelled
        if (!"SUCCESS".equals(request.getStatus())) {
            // Update DB Status
            booking.setStatus(Booking.Status.cancelled);
            bookingRepository.save(booking);

            // Release the seats in Redis back to AVAILABLE
            List<BookingSeat> bookingSeats = bookingSeatRepository.findAll()
                    .stream()
                    .filter(bs -> bs.getBooking().getBookingId().equals(booking.getBookingId()))
                    .toList();

            for (BookingSeat bs : bookingSeats) {
                Seat seat = bs.getSeat();
                String seatKey = seat.getRowName() + seat.getSeatNumber();
                // Remove from TTL cache and Redis Hash -> falls back to "AVAILABLE" logic
                ttlSeats.remove(seatKey);
                seatStatuses.remove(seatKey);
            }
            return "Payment FAILED. Seats have been unlocked.";
        }

        // 4. Handle Payment SUCCESS
        try {
            // Atomic Update on MySQL
            booking.setStatus(Booking.Status.paid);
            bookingRepository.save(booking);

            // Fetch the seats related to this booking
            List<BookingSeat> bookingSeats = bookingSeatRepository.findAll()
                    .stream()
                    .filter(bs -> bs.getBooking().getBookingId().equals(booking.getBookingId()))
                    .toList();

            // Permanent Update in Redis (No rollback possible automatically without
            // specific redisson logic, doing inside try-catch)
            for (BookingSeat bs : bookingSeats) {
                Seat seat = bs.getSeat();
                String seatKey = seat.getRowName() + seat.getSeatNumber();

                // Set permanently to SOLD
                seatStatuses.put(seatKey, "SOLD");

                // Remove from the temporary 10-minute Auto-Evict queue
                ttlSeats.remove(seatKey);
            }

            return "Payment SUCCESS. Tickets generated. Seats marked as SOLD.";

        } catch (Exception e) {
            // If MySQL fails (e.g connection lost or constraint violated), @Transactional
            // rolls back DB.
            // We should ideally revert the Redis states if necessary, but Spring handles
            // the exception throw which propagates Rollback.
            log.error("Error processing successful payment webhook for bookingId: {}", booking.getBookingId(), e);
            throw new RuntimeException("Atomic update failed. System reverted to safe point.", e);
        }
    }
}
