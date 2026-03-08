package team.api.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.api.dto.SePayWebhookRequest;
import team.api.service.PaymentService;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;

/**
 * Controller nhận thông báo thanh toán từ SePay qua cơ chế Webhook.
 *
 * SePay sẽ gửi HTTP POST đến endpoint này mỗi khi có giao dịch mới
 * khớp với tài khoản ngân hàng bạn đã cấu hình trên dashboard SePay.
 *
 * Cấu hình trên SePay Dashboard:
 * Webhook URL → https://your-domain.com/api/payment/sepay-webhook
 * Secret Token → Đã bật xác thực qua Authorization header (sepay.secret-key)
 */
@Slf4j
@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private final PaymentService paymentService;
    private final String sepaySecretKey;

    public PaymentController(PaymentService paymentService,
            @Value("${sepay.secret-key:}") String sepaySecretKey) {
        this.paymentService = paymentService;
        this.sepaySecretKey = sepaySecretKey;
    }

    /**
     * Nhận webhook từ SePay và xử lý đối soát thanh toán.
     *
     * SePay yêu cầu response trả về {"success": true} với HTTP 200
     * nếu webhook được nhận thành công.
     *
     * @param authorization Header dùng để xác thực SePay request
     * @param request       payload JSON từ SePay
     * @return {"success": true} với HTTP 200 – bắt buộc theo chuẩn SePay
     */
    // SePay verify URL bằng GET request trước khi lưu webhook
    @GetMapping("/sepay-webhook")
    public ResponseEntity<Map<String, Boolean>> verifyWebhook() {
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/sepay-webhook")
    public ResponseEntity<Map<String, Boolean>> handleSePayWebhook(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody SePayWebhookRequest request) {

        // 1. Kiểm tra tính hợp lệ của Secret Key
        // TODO: Bật lại khi deploy production
        if (sepaySecretKey != null && !sepaySecretKey.isEmpty()) {
            if (authorization == null || !authorization.contains(sepaySecretKey)) {
                log.warn("Cảnh báo: Webhook nhận được Secret Key không hợp lệ!");
                return ResponseEntity.status(403).build();
            }
        }

        log.info("📩 Nhận webhook từ SePay - referenceCode: {}", request.getReferenceCode());

        // 2. Xử lý webhook update database
        try {
            paymentService.processWebhook(request);
        } catch (Exception e) {
            // Vẫn trả về 200 để SePay không retry liên tục.
            // Log lỗi để debug, nhưng không để lộ stack trace ra ngoài.
            log.error("Lỗi xử lý webhook SePay: {}", e.getMessage(), e);
        }

        // SePay bắt buộc nhận {"success": true} để xác nhận đã nhận thông báo
        return ResponseEntity.ok(Map.of("success", true));
    }

    /**
     * API để frontend polling (kiểm tra liên tục) xem booking đã được thanh toán
     * chưa.
     */
    @GetMapping("/status/{orderCode}")
    public ResponseEntity<team.api.dto.response.BookingStatusResponse> checkPaymentStatus(
            @PathVariable String orderCode) {
        team.api.dto.response.BookingStatusResponse status = paymentService.getBookingStatus(orderCode);
        return ResponseEntity.ok(status);
    }
}
