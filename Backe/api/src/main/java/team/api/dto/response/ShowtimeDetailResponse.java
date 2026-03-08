package team.api.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ShowtimeDetailResponse {
    private Integer showtimeId;
    private Long movieId;
    private String movieTitle;
    private String poster;
    private String roomName;
    private LocalDateTime startTime;
    private BigDecimal basePrice;
    private Integer duration;
    private String genre;
    private String ageRating;
}
