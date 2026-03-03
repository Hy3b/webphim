package team.api.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "movies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "movie_id")
    private Long id;

    @Column(name = "title", length = 200, nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String plot;

    @Column(name = "duration_minutes", nullable = false)
    private Integer duration;

    @Column(name = "poster_url", length = 255)
    private String poster;

    // Các trường tự do lưu tạm dạng nullable để frontend xài đủ data
    private String banner;

    @Builder.Default
    private String genre = "Chưa cập nhật";

    @Builder.Default
    private String releaseDate = "Chưa cập nhật";

    private String director;

    private String castMembers;

    @Builder.Default
    private String ageRating = "P";

    @Builder.Default
    private Double rating = 0.0;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(columnDefinition = "enum('showing', 'coming') default 'showing'")
    private Status status = Status.showing;

    @Column(name = "trailer_duration_minutes")
    @Builder.Default
    private Integer trailerDurationMinutes = 10;

    public enum Status {
        showing, coming
    }
}
