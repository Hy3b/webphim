package team.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.api.entity.Order;
import team.api.repository.OrderRepository;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduledTaskService {

    private final OrderRepository orderRepository;

    /**
     * Quét mỗi 60 giây, tìm các order pending đã hết hạn và cập nhật status sang expired.
     * Redis đã tự giải phóng ghế (LOCKED → null) sau 10 phút nhờ TTL trong RMapCache.
     * Scheduler này chỉ đồng bộ trạng thái phía DB.
     */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void expireStaleOrders() {
        List<Order> expiredOrders = orderRepository.findByStatusAndExpiredAtBefore(
                Order.Status.pending,
                LocalDateTime.now()
        );

        if (expiredOrders.isEmpty()) {
            return;
        }

        for (Order order : expiredOrders) {
            order.setStatus(Order.Status.expired);
        }

        orderRepository.saveAll(expiredOrders);
        log.info("⏰ Scheduler: đã expire {} order(s) quá hạn thanh toán.", expiredOrders.size());
    }
}
