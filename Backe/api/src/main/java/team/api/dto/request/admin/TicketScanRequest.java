package team.api.dto.request.admin;

import lombok.Getter;
import jakarta.validation.constraints.NotBlank;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class TicketScanRequest {
    @NotBlank(message = "Order code is required")
    private String orderCode;
}