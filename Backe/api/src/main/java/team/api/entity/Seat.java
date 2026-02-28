package team.api.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "seats", uniqueConstraints = {
        @UniqueConstraint(name = "uq_room_seat", columnNames = { "room_id", "row_name", "seat_number" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seat_id")
    private Integer seatId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false, foreignKey = @ForeignKey(name = "fk_seat_room"))
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_type_id", nullable = false, foreignKey = @ForeignKey(name = "fk_seat_type"))
    private SeatType seatType;

    @Column(name = "row_name", nullable = false, columnDefinition = "char(2)")
    private String rowName;

    @Column(name = "seat_number", nullable = false)
    private Integer seatNumber;
}
