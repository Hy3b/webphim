package team.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.api.entity.Order;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    Optional<Order> findByOrderCode(String orderCode);

    List<Order> findByStatusAndExpiredAtBefore(Order.Status status, LocalDateTime dateTime);

    List<Order> findByStatus(Order.Status status);
}
