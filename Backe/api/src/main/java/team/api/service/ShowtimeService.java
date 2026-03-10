package team.api.service;

import lombok.RequiredArgsConstructor;
import org.redisson.api.RMap;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;
import team.api.dto.response.SeatStatusResponse;
import team.api.dto.response.ShowtimeDetailResponse;
import team.api.entity.Seat;
import team.api.entity.Showtime;
import team.api.repository.SeatRepository;
import team.api.repository.ShowtimeRepository;

import java.util.List;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShowtimeService {

    private final ShowtimeRepository showtimeRepository;
    private final SeatRepository seatRepository;
    private final RedissonClient redissonClient;

    public List<SeatStatusResponse> getSeatStatuses(Integer showtimeId) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new RuntimeException("Showtime not found"));

        // Get all seats for the room
        List<Seat> allSeats = seatRepository.findByRoomIdWithSeatType(showtime.getRoom().getRoomId());

        // Fetch seat statuses from Redis Hash: showtime:{id}:seats
        String redisKey = "showtime:" + showtimeId + ":seats";
        RMap<String, String> seatStatuses = redissonClient.getMap(redisKey);

        return allSeats.stream().map(seat -> {
            String seatKey = seat.getRowName() + seat.getSeatNumber();
            // Default to AVAILABLE if not found in Redis
            String status = seatStatuses.getOrDefault(seatKey, "AVAILABLE");

            return SeatStatusResponse.builder()
                    .seatId(seat.getSeatId())
                    .rowName(seat.getRowName())
                    .seatNumber(seat.getSeatNumber())
                    .status(status)
                    .seatTypeName(seat.getSeatType().getName())
                    .build();
        }).collect(Collectors.toList());
    }

    public ShowtimeDetailResponse getShowtimeDetail(Integer showtimeId) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new RuntimeException("Showtime not found"));

        return ShowtimeDetailResponse.builder()
                .showtimeId(showtime.getShowtimeId())
                .movieId(showtime.getMovie().getId())
                .movieTitle(showtime.getMovie().getName())
                .poster(showtime.getMovie().getPoster())
                .roomName(showtime.getRoom().getName())
                .startTime(showtime.getStartTime())
                .basePrice(showtime.getBasePrice())
                .duration(showtime.getMovie().getDuration())
                .genre(showtime.getMovie().getGenre())
                .ageRating(showtime.getMovie().getAgeRating())
                .build();
    }

    public List<ShowtimeDetailResponse> getShowtimesByMovie(Long movieId) {
        return showtimeRepository.findByMovie_Id(movieId).stream()
                .map(this::mapToShowtimeDetailResponse)
                .collect(Collectors.toList());
    }

    public List<ShowtimeDetailResponse> getAllShowtimes() {
        return showtimeRepository.findAll().stream()
                .map(this::mapToShowtimeDetailResponse)
                .collect(Collectors.toList());
    }

    private ShowtimeDetailResponse mapToShowtimeDetailResponse(Showtime showtime) {
        return ShowtimeDetailResponse.builder()
                .showtimeId(showtime.getShowtimeId())
                .movieId(showtime.getMovie().getId())
                .movieTitle(showtime.getMovie().getName())
                .poster(showtime.getMovie().getPoster())
                .roomName(showtime.getRoom().getName())
                .startTime(showtime.getStartTime())
                .basePrice(showtime.getBasePrice())
                .duration(showtime.getMovie().getDuration())
                .genre(showtime.getMovie().getGenre())
                .ageRating(showtime.getMovie().getAgeRating())
                .build();
    }
}
