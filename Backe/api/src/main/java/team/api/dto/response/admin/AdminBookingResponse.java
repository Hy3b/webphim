package team.api.dto.response.admin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminBookingResponse {
    private Integer bookingId;
    private String orderCode;
    private String status;
    private String paymentMethod;
}
