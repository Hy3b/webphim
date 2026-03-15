package team.api.controller.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import team.api.dto.request.admin.AdminBookingRequest;
import team.api.dto.response.admin.AdminBookingResponse;
import team.api.service.admin.AdminBookingService;

@Slf4j
@RestController
@RequestMapping("/api/admin/bookings")
@RequiredArgsConstructor
public class AdminBookingController {

    private final AdminBookingService adminBookingService;

    @PostMapping
    public ResponseEntity<AdminBookingResponse> bookTicketsAtCounter(
            @RequestBody AdminBookingRequest request) {
        log.info("Nhận request tạo vé tại quầy từ Admin/Staff: {}", request);
        AdminBookingResponse response = adminBookingService.bookTicketsAtCounter(request);
        return ResponseEntity.ok(response);
    }
}
