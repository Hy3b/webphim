package team.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.api.entity.BookingSeat;

import java.util.List;

@Repository
public interface BookingSeatRepository extends JpaRepository<BookingSeat, Integer> {
    
    boolean existsByShowtime_ShowtimeIdAndSeat_SeatIdIn(Integer showtimeId, List<Integer> seatIds);

    List<BookingSeat> findByBooking_Order(team.api.entity.Order order);
    
    List<BookingSeat> findByBooking_BookingId(Integer bookingId);
}
