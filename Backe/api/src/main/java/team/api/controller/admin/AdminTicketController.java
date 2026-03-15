package team.api.controller.admin;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import team.api.service.admin.AdminTicketService;
import team.api.dto.request.admin.TicketScanRequest;

@RestController
@RequestMapping("/api/admin/tickets")
@RequiredArgsConstructor
public class AdminTicketController {
    private final AdminTicketService adminTicketService;

    @PostMapping("/scan")
    public ResponseEntity<?> scanTicket(@RequestBody TicketScanRequest request) {
        var result = adminTicketService.scanTicket(request.getOrderCode());
        return ResponseEntity.ok(result);
    }
}
