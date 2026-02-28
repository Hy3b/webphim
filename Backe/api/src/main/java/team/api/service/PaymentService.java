package team.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.api.dto.SePayWebhookRequest;
import team.api.dto.response.BookingStatusResponse;
import team.api.entity.Booking;
import team.api.repository.BookingRepository;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final BookingRepository bookingRepository;

    private static final Pattern BOOKING_ID_PATTERN = Pattern.compile("(?i)DH(\\d+)");

    @Transactional
    public void processWebhook(SePayWebhookRequest request) {
        log.info("=== Nhận webhook SePay: gateway={}, amount={}, content='{}'",
                request.getGateway(), request.getTransferAmount(), request.getContent());

        Integer bookingId = extractBookingId(request.getContent());

        if (bookingId == null) {
            log.warn("Không tìm thấy booking_id (mã DH) trong nội dung: '{}'", request.getContent());
            return;
        }

        log.info("Trích xuất được booking_id: '{}'", bookingId);

        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);

        if (bookingOpt.isEmpty()) {
            log.warn("Không tìm thấy booking với id='{}' trong DB", bookingId);
            return;
        }

        Booking booking = bookingOpt.get();

        if (!"pending".equals(booking.getStatus())) {
            log.info("Booking '{}' đã ở trạng thái '{}', bỏ qua.", bookingId, booking.getStatus());
            return;
        }

        // So sánh số tiền nhận với tổng tiền đơn hàng
        int compareResult = request.getTransferAmount().compareTo(booking.getTotalAmount());

        if (compareResult >= 0) { // If amount is sufficient or overpaid
            booking.setStatus("paid");
            bookingRepository.save(booking);

            if (compareResult == 0) {
                log.info("✅ Booking '{}' đã thanh toán THÀNH CÔNG. Số tiền nhận: {}, Cần: {}",
                        bookingId, request.getTransferAmount(), booking.getTotalAmount());
            } else { // compareResult > 0
                log.info("✅ Booking '{}' thanh toán THÀNH CÔNG (DƯ TIỀN). Số tiền nhận: {}, Cần: {}",
                        bookingId, request.getTransferAmount(), booking.getTotalAmount());
            }
        } else { // compareResult < 0
            log.warn("⚠️ Booking '{}' thiếu tiền. Nhận: {}, Cần: {}",
                    bookingId, request.getTransferAmount(), booking.getTotalAmount());
        }
    }

    private Integer extractBookingId(String transferContent) {
        if (transferContent == null || transferContent.isBlank()) {
            return null;
        }

        Matcher matcher = BOOKING_ID_PATTERN.matcher(transferContent);
        if (matcher.find()) {
            try {
                return Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException e) {
                log.error("Lỗi parse booking id: {}", matcher.group(1));
            }
        }
        return null;
    }

    public BookingStatusResponse getBookingStatus(Integer bookingId) {
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);

        if (bookingOpt.isEmpty()) {
            return BookingStatusResponse.builder()
                    .bookingId(bookingId)
                    .status("not_found")
                    .paid(false)
                    .build();
        }

        Booking booking = bookingOpt.get();
        boolean isPaid = "paid".equalsIgnoreCase(booking.getStatus());

        return BookingStatusResponse.builder()
                .bookingId(bookingId)
                .status(booking.getStatus())
                .paid(isPaid)
                .build();
    }
}
