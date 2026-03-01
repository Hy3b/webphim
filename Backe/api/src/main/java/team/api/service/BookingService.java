package team.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RMap;
import org.redisson.api.RMapCache;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.api.dto.request.BookingRequest;
import team.api.dto.response.CreateBookingResponse;
import team.api.entity.*;
import team.api.repository.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final RedissonClient redissonClient;
    private final ShowtimeRepository showtimeRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;

    @Transactional
    public CreateBookingResponse bookSeats(BookingRequest request) {
        // 1. Validate basic info
        Showtime showtime = showtimeRepository.findById(request.getShowtimeId())
                .orElseThrow(() -> new RuntimeException("Showtime not found"));
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Seat> seatsToBook = seatRepository.findByRoomIdAndSeatKeyIn(showtime.getRoom().getRoomId(),
                request.getSeatIds());
        if (seatsToBook.size() != request.getSeatIds().size()) {
            throw new RuntimeException("Some seats are invalid");
        }

        // 2. Try to acquire Redisson Locks for all requested seats to prevent Race
        // Condition
        List<RLock> acquiredLocks = new ArrayList<>();
        String redisHashKey = "showtime:" + showtime.getShowtimeId() + ":seats";

        try {
            for (Seat seat : seatsToBook) {
                String lockKey = "seat_lock:" + showtime.getShowtimeId() + "_" + seat.getSeatId();
                RLock lock = redissonClient.getLock(lockKey);

                // Try to wait for max 1 second to acquire lock, then lock it for 10 seconds
                // automatically
                boolean isLocked = lock.tryLock(1, 10, TimeUnit.SECONDS);
                if (!isLocked) {
                    throw new RuntimeException("Seat " + seat.getRowName() + seat.getSeatNumber()
                            + " is currently being booked by someone else.");
                }
                acquiredLocks.add(lock);

                // Double check if seat was already sold/locked in Redis Hash before this lock
                RMap<String, String> seatStatuses = redissonClient.getMap(redisHashKey);
                String seatKey = seat.getRowName() + seat.getSeatNumber();
                String currentStatus = seatStatuses.get(seatKey);

                if ("LOCKED".equals(currentStatus) || "SOLD".equals(currentStatus)) {
                    throw new RuntimeException(
                            "Seat " + seat.getRowName() + seat.getSeatNumber() + " is already " + currentStatus);
                }
            }

            // 3. All locks acquired successfully. Create Booking in DB.
            BigDecimal totalAmount = BigDecimal.ZERO;
            for (Seat seat : seatsToBook) {
                totalAmount = totalAmount.add(showtime.getBasePrice()).add(seat.getSeatType().getSurcharge());
            }

            Booking booking = Booking.builder()
                    .user(user)
                    .showtime(showtime)
                    .totalAmount(totalAmount)
                    .status(Booking.Status.pending)
                    .build();
            booking = bookingRepository.save(booking);

            List<BookingSeat> bookingSeats = new ArrayList<>();
            RMap<String, String> seatStatuses = redissonClient.getMap(redisHashKey);

            // Map cache to store TTL for release if payment isn't done in 10 minutes
            String ttlMapKey = "showtime:" + showtime.getShowtimeId() + ":ttl_seats";
            RMapCache<String, Integer> ttlSeats = redissonClient.getMapCache(ttlMapKey);

            for (Seat seat : seatsToBook) {
                BigDecimal seatPrice = showtime.getBasePrice().add(seat.getSeatType().getSurcharge());
                BookingSeat bookingSeat = BookingSeat.builder()
                        .booking(booking)
                        .showtime(showtime)
                        .seat(seat)
                        .price(seatPrice)
                        .build();
                bookingSeats.add(bookingSeat);

                // Update Redis Hash: mark as LOCKED
                String seatKey = seat.getRowName() + seat.getSeatNumber();
                seatStatuses.put(seatKey, "LOCKED");

                // Add to TTL Cache: automatically evict after 10 minutes
                // (In a real app, you would listen to eviction events or have a cron job
                // checking expired bookings to release the seat from the main hash)
                ttlSeats.put(seatKey, booking.getBookingId(), 10, TimeUnit.MINUTES);
            }
            bookingSeatRepository.saveAll(bookingSeats);

            String orderCode = "DH" + booking.getBookingId();
            log.info("✅ Tạo booking mới qua Redisson: bookingId={}, orderCode={}, amount={}",
                    booking.getBookingId(), orderCode, booking.getTotalAmount());

            return CreateBookingResponse.builder()
                    .bookingId(booking.getBookingId())
                    .orderCode(orderCode)
                    .status(booking.getStatus().name())
                    .build();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Booking interrupted", e);
        } finally {
            // 4. Always release the temporary acquisition locks so others can try
            for (RLock lock : acquiredLocks) {
                if (lock.isHeldByCurrentThread()) {
                    lock.unlock();
                }
            }
        }
    }
}
