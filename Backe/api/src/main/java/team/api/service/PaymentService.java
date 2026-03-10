package team.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import team.api.dto.request.SePayWebhookRequest;
import team.api.dto.response.BookingStatusResponse;
import team.api.entity.Order;
import team.api.repository.OrderRepository;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.List;

import org.redisson.api.RMap;
import org.redisson.api.RedissonClient;
import team.api.entity.Booking;
import team.api.entity.BookingSeat;
import team.api.entity.Seat;
import team.api.repository.BookingRepository;
import team.api.repository.BookingSeatRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final OrderRepository orderRepository;
    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final RedissonClient redissonClient;

    private static final Pattern ORDER_CODE_PATTERN = Pattern.compile("(?i)(DH\\d+)");

    @Transactional
    public void processWebhook(SePayWebhookRequest request) {
        log.info("=== Nhận webhook SePay: gateway={}, amount={}, content='{}'",
                request.getGateway(), request.getTransferAmount(), request.getContent());

        String orderCode = extractOrderCode(request.getContent());

        if (orderCode == null) {
            log.warn("Không tìm thấy order_code (mã DH) trong nội dung: '{}'", request.getContent());
            return;
        }

        log.info("Trích xuất được order_code: '{}'", orderCode);

        Optional<Order> orderOpt = orderRepository.findByOrderCode(orderCode);

        if (orderOpt.isEmpty()) {
            log.warn("Không tìm thấy order với orderCode='{}' trong DB", orderCode);
            return;
        }

        Order order = orderOpt.get();

        if (!Order.Status.pending.equals(order.getStatus())) {
            log.info("Order '{}' đã ở trạng thái '{}', bỏ qua.", orderCode, order.getStatus());
            return;
        }

        // So sánh số tiền nhận với tổng tiền đơn hàng
        int compareResult = request.getTransferAmount().compareTo(order.getFinalAmount());

        if (compareResult >= 0) { // If amount is sufficient or overpaid
            order.setStatus(Order.Status.paid);
            orderRepository.save(order);

            if (compareResult == 0) {
                log.info("✅ Order '{}' đã thanh toán THÀNH CÔNG. Số tiền nhận: {}, Cần: {}",
                        orderCode, request.getTransferAmount(), order.getFinalAmount());
            } else { // compareResult > 0
                log.info("✅ Order '{}' thanh toán THÀNH CÔNG (DƯ TIỀN). Số tiền nhận: {}, Cần: {}",
                        orderCode, request.getTransferAmount(), order.getFinalAmount());
            }

            // Xử lý chốt ghế vĩnh viễn trên Redis (SOLD)
            try {
                processSeatsOnPaymentSuccess(order);
            } catch (Exception e) {
                log.error("Lỗi khi xử lý chốt ghế cho đơn hàng: {}", orderCode, e);
            }

        } else { // compareResult < 0
            log.warn("⚠️ Order '{}' thiếu tiền. Nhận: {}, Cần: {}",
                    orderCode, request.getTransferAmount(), order.getFinalAmount());
        }
    }

    private void processSeatsOnPaymentSuccess(Order order) {
        List<Booking> bookings = bookingRepository.findByOrder_OrderId(order.getOrderId());

        if (bookings.isEmpty()) {
            log.warn("Không tìm thấy booking nào cho orderId: {}", order.getOrderId());
            return;
        }

        Integer showtimeId = bookings.get(0).getShowtime().getShowtimeId();
        String redisHashKey = "showtime:" + showtimeId + ":seats";
        RMap<String, String> seatStatuses = redissonClient.getMap(redisHashKey);

        for (Booking booking : bookings) {
            List<BookingSeat> bookingSeats = bookingSeatRepository.findByBooking_BookingId(booking.getBookingId());

            for (BookingSeat bs : bookingSeats) {
                Seat seat = bs.getSeat();
                String seatKey = seat.getRowName() + seat.getSeatNumber();
                // Overwrite LOCKED → SOLD vĩnh viễn (put không có TTL = không expire)
                seatStatuses.put(seatKey, "SOLD");
                log.info("🪑 Ghế {} đã SOLD vĩnh viễn (orderId={})", seatKey, order.getOrderId());
            }
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

    public BookingStatusResponse getBookingStatus(String orderCode) {
        Optional<Order> orderOpt = orderRepository.findByOrderCode(orderCode);

        if (orderOpt.isEmpty()) {
            return BookingStatusResponse.builder()
                    // If frontend expects bookingId as int, but we provide orderCode (DH...).
                    // Assuming frontend adjusts.
                    // .bookingId(null)
                    .status("not_found")
                    .paid(false)
                    .build();
        }

        Order order = orderOpt.get();
        boolean isPaid = Order.Status.paid.equals(order.getStatus());

        return BookingStatusResponse.builder()
                .bookingId(order.getOrderId())
                .status(order.getStatus().name())
                .paid(isPaid)
                .build();
    }
}
