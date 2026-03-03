package team.api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "showtimes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Showtime {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "showtime_id")
    private Integer showtimeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false, foreignKey = @ForeignKey(name = "fk_show_movie"))
    private Movie movie;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false, foreignKey = @ForeignKey(name = "fk_show_room"))
    private Room room;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "base_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "buffer_time_minutes")
    @Builder.Default
    private Integer bufferTimeMinutes = 15;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(columnDefinition = "enum('active', 'cancelled', 'completed') default 'active'")
    private Status status = Status.active;

    @Column(name = "batch_id", length = 100)
    private String batchId;

    public enum Status {
        active, cancelled, completed
    }
}
