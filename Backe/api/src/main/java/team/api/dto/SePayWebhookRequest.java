package team.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO ánh xạ payload JSON mà SePay bắn về endpoint webhook.
 *
 * Tài liệu tham khảo: https://sepay.vn/docs/webhook
 *
 * Ví dụ payload thực tế từ SePay:
 * {
 * "id": 1,
 * "gateway": "VCB",
 * "transactionDate": "2024-01-15 10:30:00",
 * "accountNumber": "1234567890",
 * "subAccount": null,
 * "amount": 500000,
 * "transferType": "in",
 * "transferContent": "THANH TOAN DONHANG123",
 * "referenceCode": "FT24015123456",
 * "description": "",
 * "accumulated": 500000
 * }
 */
@Data
public class SePayWebhookRequest {

    /** ID giao dịch nội bộ của SePay */
    private Long id;

    /** Tên ngân hàng / cổng thanh toán (VCB, TCB, MB, ...) */
    private String gateway;

    /** Thời điểm giao dịch xảy ra, format: "yyyy-MM-dd HH:mm:ss" */
    @JsonProperty("transactionDate")
    private String transactionDate;

    /** Số tài khoản nhận tiền */
    @JsonProperty("accountNumber")
    private String accountNumber;

    /** Số tiền giao dịch (VNĐ) */
    @JsonProperty("transferAmount")
    private BigDecimal transferAmount;

    /**
     * Nội dung chuyển khoản – đây là trường quan trọng nhất.
     * Khách hàng sẽ ghi mã đơn hàng vào đây để hệ thống đối soát.
     * Ví dụ: "DH19"
     */
    @JsonProperty("content")
    private String content;

    /** Mã tham chiếu giao dịch từ phía ngân hàng */
    @JsonProperty("referenceCode")
    private String referenceCode;
}
