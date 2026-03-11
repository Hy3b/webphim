package team.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatStatusResponse {
    private Integer seatId;
    private String rowName;
    private Integer seatNumber;
    private String status; // AVAILABLE, LOCKED, SOLD
    private String seatTypeName;
    private BigDecimal price;
}
