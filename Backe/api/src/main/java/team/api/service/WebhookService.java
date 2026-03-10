package team.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RMap;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.api.dto.request.SePayWebhookRequest;
import team.api.entity.Booking;
import team.api.entity.BookingSeat;
import team.api.entity.Order;
import team.api.entity.Seat;
import team.api.repository.BookingRepository;
import team.api.repository.BookingSeatRepository;
import team.api.repository.OrderRepository;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {

    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final OrderRepository orderRepository;
    private final RedissonClient redissonClient;

    private static final Pattern ORDER_CODE_PATTERN = Pattern.compile("(?i)(DH\\d+)");

    @Transactional(rollbackFor = Exception.class)
    public void processPaymentWebhook(SePayWebhookRequest request) {
        
        String orderCode = extractOrderCode(request.getContent());

        if (orderCode == null) {
            log.warn("[MOCK] Không tìm thấy order_code (mã DH) trong nội dung: '{}'", request.getContent());
            return;
        }

        // 2. Fetch Order
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderCode));

        if (!Order.Status.pending.equals(order.getStatus())) {
            log.info("[MOCK] Webhook ignored. Order is already processed with status: " + order.getStatus());
            return;
        }

        List<Booking> bookings = bookingRepository.findByOrder_OrderId(order.getOrderId());

        if (bookings.isEmpty()) {
            throw new RuntimeException("No bookings associated with this order.");
        }

        Integer showtimeId = bookings.get(0).getShowtime().getShowtimeId();
        String redisHashKey = "showtime:" + showtimeId + ":seats";

        // Dùng cùng RMap như BookingService
        RMap<String, String> seatStatuses = redissonClient.getMap(redisHashKey);

        // Giả lập luồng 1: Nếu số tiền gửi >= yêu cầu -> SUCCESS
        int compareResult = request.getTransferAmount() != null ? 
            request.getTransferAmount().compareTo(order.getFinalAmount()) : -1;

        if (compareResult < 0) {
            log.warn("[MOCK] Payment FAILED/INSUFFICIENT. (Need: {}, Got: {})", order.getFinalAmount(), request.getTransferAmount());
            return;
        }

        // 4. Handle Payment SUCCESS
        try {
            order.setStatus(Order.Status.paid);
            orderRepository.save(order);

            for (Booking booking : bookings) {
                List<BookingSeat> bookingSeats = bookingSeatRepository.findByBooking_BookingId(booking.getBookingId());

                for (BookingSeat bs : bookingSeats) {
                    Seat seat = bs.getSeat();
                    String seatKey = seat.getRowName() + seat.getSeatNumber();
                    // Overwrite LOCKED → SOLD vĩnh viễn (put không có TTL = không expire)
                    seatStatuses.put(seatKey, "SOLD");
                    log.info("[MOCK] 🪑 Ghế {} đã SOLD vĩnh viễn (orderId={})", seatKey, order.getOrderId());
                }
            }

            log.info("[MOCK] Payment SUCCESS. Tickets generated. Seats marked as SOLD.");

        } catch (Exception e) {
            log.error("[MOCK] Error processing successful payment webhook for orderId: {}", order.getOrderId(), e);
            throw new RuntimeException("Atomic update failed. System reverted to safe point.", e);
        }
    }

    private String extractOrderCode(String transferContent) {
        if (transferContent == null || transferContent.isBlank()) {
            return null;
        }
        Matcher matcher = ORDER_CODE_PATTERN.matcher(transferContent);
        if (matcher.find()) {
            return matcher.group(1).toUpperCase();
        }
        return null;
    }
}
