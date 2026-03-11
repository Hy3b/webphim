package team.api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import team.api.dto.request.ShowtimeGenerateRequest;
import team.api.entity.Showtime;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShowtimeGeneratorService {

    public List<Showtime> generateShowtimes(ShowtimeGenerateRequest request) {
        // TODO: Implement the actual algorithm to generate showtimes
        // Based on: movieIds, roomIds, startDate, endDate, openingTime, closingTime,
        // bufferTimeMinutes
        List<Showtime> generatedShowtimes = new ArrayList<>();

        return generatedShowtimes;
    }
}
