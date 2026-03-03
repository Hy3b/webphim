package team.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import team.api.dto.response.SeatStatusResponse;
import team.api.service.ShowtimeService;

import java.util.List;

@RestController
@RequestMapping("/api/showtimes")
@RequiredArgsConstructor
public class ShowtimeController {

    private final ShowtimeService showtimeService;
    private final team.api.service.ShowtimeGeneratorService showtimeGeneratorService;

    @GetMapping("/{id}/seats")
    public ResponseEntity<List<SeatStatusResponse>> getSeatStatuses(@PathVariable("id") Integer showtimeId) {
        List<SeatStatusResponse> seatStatuses = showtimeService.getSeatStatuses(showtimeId);
        return ResponseEntity.ok(seatStatuses);
    }

    @org.springframework.web.bind.annotation.PostMapping("/generate")
    public ResponseEntity<?> generateShowtimes(
            @org.springframework.web.bind.annotation.RequestBody team.api.dto.request.ShowtimeGenerateRequest request) {
        try {
            List<team.api.entity.Showtime> results = showtimeGeneratorService.generateShowtimes(request);
            // Trả về DTO hoặc đơn giản là message thành công để tránh lỗi Lazy Loading của
            // Hibernate khi parse Entities
            return ResponseEntity.ok(java.util.Collections.singletonMap("message",
                    results.size() + " suất chiếu đã được tạo thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("error", e.getMessage()));
        }
    }
}
