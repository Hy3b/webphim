package team.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import team.api.dto.response.SeatStatusResponse;
import team.api.dto.response.ShowtimeDetailResponse;
import team.api.service.ShowtimeService;

import java.util.List;

@RestController
@RequestMapping("/api/showtimes")
@RequiredArgsConstructor
public class ShowtimeController {

    private final ShowtimeService showtimeService;

    @GetMapping("/{id}/seats")
    public ResponseEntity<List<SeatStatusResponse>> getSeatStatuses(@PathVariable("id") Integer showtimeId) {
        List<SeatStatusResponse> seatStatuses = showtimeService.getSeatStatuses(showtimeId);
        return ResponseEntity.ok(seatStatuses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShowtimeDetailResponse> getShowtimeDetail(@PathVariable("id") Integer showtimeId) {
        return ResponseEntity.ok(showtimeService.getShowtimeDetail(showtimeId));
    }

    @GetMapping("/movie/{movieId}")
    public ResponseEntity<List<ShowtimeDetailResponse>> getShowtimesByMovie(@PathVariable("movieId") Long movieId) {
        return ResponseEntity.ok(showtimeService.getShowtimesByMovie(movieId));
    }

    @GetMapping
    public ResponseEntity<List<ShowtimeDetailResponse>> getAllShowtimes() {
        return ResponseEntity.ok(showtimeService.getAllShowtimes());
    }
}
