package team.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import team.api.entity.Seat;

import java.util.List;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Integer> {

    @Query("SELECT s FROM Seat s JOIN FETCH s.seatType WHERE s.room.roomId = :roomId")
    List<Seat> findByRoomIdWithSeatType(@Param("roomId") Integer roomId);

    @Query("SELECT s FROM Seat s WHERE s.room.roomId = :roomId AND CONCAT(s.rowName, s.seatNumber) IN :seatKeys")
    List<Seat> findByRoomIdAndSeatKeyIn(@Param("roomId") Integer roomId, @Param("seatKeys") List<String> seatKeys);
}
