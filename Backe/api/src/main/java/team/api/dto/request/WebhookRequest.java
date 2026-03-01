package team.api.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebhookRequest {
    private Integer bookingId;
    private String transactionId;
    private String status; // "SUCCESS" or "FAILED"
    private String signature; // Security hash (e.g HMAC SHA256)
}
