package team.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RMapCache;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.api.dto.request.WebhookRequest;
import team.api.entity.Booking;
import team.api.entity.BookingSeat;
import team.api.entity.Order;
import team.api.entity.Seat;
import team.api.repository.BookingRepository;
import team.api.repository.BookingSeatRepository;
import team.api.repository.OrderRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {

    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final OrderRepository orderRepository;
    private final RedissonClient redissonClient;

    @Transactional(rollbackFor = Exception.class)
    public String processPaymentWebhook(WebhookRequest request) {
        // 1. Verify Signature (Mock)
        if (!"valid_secret_hash_signature".equals(request.getSignature())) {
            throw new RuntimeException("Invalid Webhook Signature!");
        }

        // 2. Fetch Order
        Order order = orderRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Order not found."));

        if (!Order.Status.pending.equals(order.getStatus())) {
            return "Webhook ignored. Order is already processed with status: " + order.getStatus();
        }

        List<Booking> bookings = bookingRepository.findAll()
                .stream()
                .filter(b -> b.getOrder().getOrderId().equals(order.getOrderId()))
                .toList();

        if (bookings.isEmpty()) {
            throw new RuntimeException("No bookings associated with this order.");
        }

        Integer showtimeId = bookings.get(0).getShowtime().getShowtimeId();
        String redisHashKey = "showtime:" + showtimeId + ":seats";

        // Dùng cùng RMapCache như BookingService (không dùng RMap thường)
        RMapCache<String, String> seatStatuses = redissonClient.getMapCache(redisHashKey);

        // 3. Handle Payment Failed/Cancelled
        if (!"SUCCESS".equals(request.getStatus())) {
            order.setStatus(Order.Status.cancelled);
            orderRepository.save(order);

            for (Booking booking : bookings) {
                List<BookingSeat> bookingSeats = bookingSeatRepository.findAll()
                        .stream()
                        .filter(bs -> bs.getBooking().getBookingId().equals(booking.getBookingId()))
                        .toList();

                for (BookingSeat bs : bookingSeats) {
                    Seat seat = bs.getSeat();
                    String seatKey = seat.getRowName() + seat.getSeatNumber();
                    // Xóa entry khỏi RMapCache → ghế trở về AVAILABLE ngay lập tức
                    seatStatuses.remove(seatKey);
                    log.info("🔓 Giải phóng ghế {} (payment failed/cancelled, orderId={})",
                            seatKey, order.getOrderId());
                }
            }
            return "Payment FAILED. Seats have been unlocked.";
        }

        // 4. Handle Payment SUCCESS
        try {
            order.setStatus(Order.Status.paid);
            orderRepository.save(order);

            for (Booking booking : bookings) {
                List<BookingSeat> bookingSeats = bookingSeatRepository.findAll()
                        .stream()
                        .filter(bs -> bs.getBooking().getBookingId().equals(booking.getBookingId()))
                        .toList();

                for (BookingSeat bs : bookingSeats) {
                    Seat seat = bs.getSeat();
                    String seatKey = seat.getRowName() + seat.getSeatNumber();
                    // Overwrite LOCKED → SOLD vĩnh viễn (put không có TTL = không expire)
                    seatStatuses.put(seatKey, "SOLD");
                    log.info("🪑 Ghế {} đã SOLD vĩnh viễn (orderId={})", seatKey, order.getOrderId());
                }
            }

            return "Payment SUCCESS. Tickets generated. Seats marked as SOLD.";

        } catch (Exception e) {
            log.error("Error processing successful payment webhook for orderId: {}", order.getOrderId(), e);
            throw new RuntimeException("Atomic update failed. System reverted to safe point.", e);
        }
    }
}
