package team.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.api.entity.Showtime;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, Integer> {
}
