package team.api.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateBookingRequest {
    private Integer userId;
    private Integer showtimeId;
    private BigDecimal totalAmount;
    private List<String> seatIds; // VD: ["A1", "A2"]
}
