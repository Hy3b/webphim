package team.api.dto.request.admin;

import lombok.Data;
import java.util.List;

@Data
public class AdminBookingRequest {
    private Integer userId; // Optional, defaults to GUEST if null
    private Integer showtimeId;
    private List<String> seatIds; // VD: ["A1", "A2"]
    private String paymentMethod; // "CASH" or "QR"
}
