package team.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RMap;
import org.redisson.api.RedissonClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.api.entity.BookingSeat;
import team.api.entity.Order;
import team.api.repository.BookingSeatRepository;
import team.api.repository.OrderRepository;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduledTaskService {

    private final OrderRepository orderRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final RedissonClient redissonClient;

    /**
     * Quét mỗi 60 giây, tìm các order pending đã hết hạn và cập nhật status sang
     * expired.
     * Giải phóng ghế (LOCKED → xóa khỏi Redis RMap) thủ công.
     */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void expireStaleOrders() {
        List<Order> expiredOrders = orderRepository.findByStatusAndExpiredAtBefore(
                Order.Status.pending,
                LocalDateTime.now());

        if (expiredOrders.isEmpty()) {
            return;
        }

        for (Order order : expiredOrders) {
            order.setStatus(Order.Status.expired);

            // Fetch seats for this expired order to remove them from Redis RMap
            List<BookingSeat> bookingSeats = bookingSeatRepository.findByBooking_Order(order);
            for (BookingSeat bs : bookingSeats) {
                String redisHashKey = "showtime:" + bs.getShowtime().getShowtimeId() + ":seats";
                RMap<String, String> seatStatuses = redissonClient.getMap(redisHashKey);

                String seatKey = bs.getSeat().getRowName() + bs.getSeat().getSeatNumber();
                seatStatuses.remove(seatKey);
            }
            // Delete the BookingSeat records from DB to release the unique constraint
            bookingSeatRepository.deleteAll(bookingSeats);
        }

        orderRepository.saveAll(expiredOrders);
        log.info("Scheduler: đã expire {} order(s) quá hạn thanh toán và giải phóng ghế.", expiredOrders.size());
    }

    @PostConstruct
    @Transactional
    public void cleanupExistingExpiredBookingSeats() {
        List<Order> expiredOrders = orderRepository.findByStatus(Order.Status.expired);
        int totalDeleted = 0;
        for (Order order : expiredOrders) {
            List<BookingSeat> seats = bookingSeatRepository.findByBooking_Order(order);
            if (!seats.isEmpty()) {
                bookingSeatRepository.deleteAll(seats);
                totalDeleted += seats.size();
            }
        }
        if (totalDeleted > 0) {
            log.info(" Dọn dẹp thành công {} BookingSeat(s) từ các order đã expired cũ ở DB.", totalDeleted);
        }
    }
}
