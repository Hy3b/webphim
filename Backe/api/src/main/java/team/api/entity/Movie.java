package team.api.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "movies")
public class Movie {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "movie_id")
    private Long id;

    @Column(name = "title", length = 200, nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String plot;

    @Column(name = "duration_minutes")
    private Integer duration;

    @Column(name = "poster_url", length = 255)
    private String poster;

    // Các trường tự do lưu tạm dạng nullable để frontend xài đủ data
    private String banner;
    private String genre = "Chưa cập nhật";
    private String releaseDate = "Chưa cập nhật";
    private String director;
    private String castMembers;
    private String ageRating = "P";
    private Double rating = 0.0;

    @Column(length = 50)
    private String status = "showing"; // 'showing' hoặc 'coming'

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPlot() { return plot; }
    public void setPlot(String plot) { this.plot = plot; }

    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }

    public String getPoster() { return poster; }
    public void setPoster(String poster) { this.poster = poster; }

    public String getBanner() { return banner; }
    public void setBanner(String banner) { this.banner = banner; }

    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }

    public String getReleaseDate() { return releaseDate; }
    public void setReleaseDate(String releaseDate) { this.releaseDate = releaseDate; }

    public String getDirector() { return director; }
    public void setDirector(String director) { this.director = director; }

    public String getCastMembers() { return castMembers; }
    public void setCastMembers(String castMembers) { this.castMembers = castMembers; }

    public String getAgeRating() { return ageRating; }
    public void setAgeRating(String ageRating) { this.ageRating = ageRating; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
