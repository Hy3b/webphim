package team.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RMapCache;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.api.dto.request.BookingRequest;
import team.api.dto.response.CreateBookingResponse;
import team.api.entity.*;
import team.api.repository.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private static final int BOOKING_TTL_MINUTES = 10;

    private final RedissonClient redissonClient;
    private final ShowtimeRepository showtimeRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public CreateBookingResponse bookSeats(BookingRequest request) {
        // 1. Validate basic info
        Showtime showtime = showtimeRepository.findById(request.getShowtimeId())
                .orElseThrow(() -> new RuntimeException("Showtime not found"));
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Seat> seatsToBook = seatRepository.findByRoomIdAndSeatKeyIn(showtime.getRoom().getRoomId(),
                request.getSeatIds());
        if (seatsToBook.size() != request.getSeatIds().size()) {
            throw new RuntimeException("Some seats are invalid");
        }

        // Additional Check: Ensure the seat is not already booked in the Database
        List<Integer> seatIdsToBook = seatsToBook.stream()
                .map(Seat::getSeatId)
                .collect(Collectors.toList());

        boolean isAlreadyBookedDb = bookingSeatRepository.existsByShowtime_ShowtimeIdAndSeat_SeatIdIn(
                showtime.getShowtimeId(),
                seatIdsToBook
        );
        if (isAlreadyBookedDb) {
            throw new RuntimeException("Some of the requested seats are already booked");
        }

        // 2. Try to acquire Redisson Locks for all requested seats to prevent Race Condition
        List<RLock> acquiredLocks = new ArrayList<>();
        // Dùng RMapCache duy nhất: entry LOCKED có TTL tự expire, SOLD không có TTL
        String redisHashKey = "showtime:" + showtime.getShowtimeId() + ":seats";
        RMapCache<String, String> seatStatuses = redissonClient.getMapCache(redisHashKey);

        try {
            for (Seat seat : seatsToBook) {
                String lockKey = "seat_lock:" + showtime.getShowtimeId() + "_" + seat.getSeatId();
                RLock lock = redissonClient.getLock(lockKey);

                // Chờ tối đa 1 giây để lấy lock, giữ lock 10 giây để tránh deadlock kỹ thuật
                boolean isLocked = lock.tryLock(1, 10, TimeUnit.SECONDS);
                if (!isLocked) {
                    throw new RuntimeException("Seat " + seat.getRowName() + seat.getSeatNumber()
                            + " is currently being booked by someone else.");
                }
                acquiredLocks.add(lock);

                // Double-check trạng thái ghế trong Redis trước khi giữ
                String seatKey = seat.getRowName() + seat.getSeatNumber();
                String currentStatus = seatStatuses.get(seatKey);
                if ("LOCKED".equals(currentStatus) || "SOLD".equals(currentStatus)) {
                    throw new RuntimeException(
                            "Seat " + seat.getRowName() + seat.getSeatNumber() + " is already " + currentStatus);
                }
            }

            // 3. All locks acquired successfully. Create Order and Booking in DB.
            BigDecimal totalAmount = BigDecimal.ZERO;
            for (Seat seat : seatsToBook) {
                totalAmount = totalAmount.add(showtime.getBasePrice()).add(seat.getSeatType().getSurcharge());
            }

            Order order = Order.builder()
                    .user(user)
                    .orderCode("DH_TEMP")
                    .totalAmount(totalAmount)
                    .finalAmount(totalAmount)
                    .expiredAt(LocalDateTime.now().plusMinutes(BOOKING_TTL_MINUTES))
                    .status(Order.Status.pending)
                    .build();
            order = orderRepository.save(order);

            order.setOrderCode("DH" + order.getOrderId());
            orderRepository.save(order);

            Booking booking = Booking.builder()
                    .order(order)
                    .showtime(showtime)
                    .build();
            booking = bookingRepository.save(booking);

            List<BookingSeat> bookingSeats = new ArrayList<>();
            for (Seat seat : seatsToBook) {
                BigDecimal seatPrice = showtime.getBasePrice().add(seat.getSeatType().getSurcharge());
                BookingSeat bookingSeat = BookingSeat.builder()
                        .booking(booking)
                        .showtime(showtime)
                        .seat(seat)
                        .price(seatPrice)
                        .build();
                bookingSeats.add(bookingSeat);

                // Đánh dấu LOCKED với TTL = 10 phút.
                // Sau 10 phút nếu không có webhook SUCCESS, Redis tự xóa entry này
                // → ghế trở về AVAILABLE tự động.
                String seatKey = seat.getRowName() + seat.getSeatNumber();
                seatStatuses.put(seatKey, "LOCKED", BOOKING_TTL_MINUTES, TimeUnit.MINUTES);
            }
            bookingSeatRepository.saveAll(bookingSeats);

            log.info("✅ Tạo order: orderId={}, orderCode={}, amount={}, expiredAt={}",
                    order.getOrderId(), order.getOrderCode(), order.getTotalAmount(), order.getExpiredAt());

            return CreateBookingResponse.builder()
                    .bookingId(booking.getBookingId())
                    .orderCode(order.getOrderCode())
                    .status(order.getStatus().name())
                    .build();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Booking interrupted", e);
        } finally {
            // 4. Luôn giải phóng lock kỹ thuật sau khi xử lý xong
            for (RLock lock : acquiredLocks) {
                if (lock.isHeldByCurrentThread()) {
                    lock.unlock();
                }
            }
        }
    }
}
