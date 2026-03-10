package team.api.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Integer roomId;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "total_seats")
    private Integer totalSeats;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "enum('active', 'maintenance') default 'active'")
    @Builder.Default
    private Status status = Status.active;

    public enum Status {
        active, maintenance
    }
}
