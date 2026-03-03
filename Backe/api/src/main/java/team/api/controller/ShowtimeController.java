package team.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.api.dto.request.ShowtimeGenerateRequest;
import team.api.dto.response.SeatStatusResponse;
import team.api.entity.Showtime;
import team.api.service.ShowtimeGeneratorService;
import team.api.service.ShowtimeService;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/showtimes")
@RequiredArgsConstructor
public class ShowtimeController {

    private final ShowtimeService showtimeService;
    private final ShowtimeGeneratorService showtimeGeneratorService;

    @GetMapping("/{id}/seats")
    public ResponseEntity<List<SeatStatusResponse>> getSeatStatuses(@PathVariable("id") Integer showtimeId) {
        List<SeatStatusResponse> seatStatuses = showtimeService.getSeatStatuses(showtimeId);
        return ResponseEntity.ok(seatStatuses);
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateShowtimes(@RequestBody ShowtimeGenerateRequest request) {
        try {
            List<Showtime> results = showtimeGeneratorService.generateShowtimes(request);
            return ResponseEntity.ok(Collections.singletonMap("message",
                    results.size() + " suất chiếu đã được tạo thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }
}
