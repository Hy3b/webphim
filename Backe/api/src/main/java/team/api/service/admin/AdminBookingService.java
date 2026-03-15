package team.api.service.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RMap;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import team.api.dto.request.admin.AdminBookingRequest;
import team.api.dto.response.admin.AdminBookingResponse;
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
public class AdminBookingService {

    private static final int BOOKING_TTL_MINUTES = 10;
    private static final int LOCK_WAIT_SECONDS = 1;
    private static final int LOCK_HOLD_SECONDS = 2;
    private static final String GUEST_USERNAME = "GUEST";
    private static final String GUEST_EMAIL = "guest@webphim.local";

    private final RedissonClient redissonClient;
    private final ShowtimeRepository showtimeRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public AdminBookingResponse bookTicketsAtCounter(AdminBookingRequest request) {
        log.info("Bắt đầu booking tại quầy: showtimeId={}, seatIds={}, paymentMethod={}", 
            request.getShowtimeId(), request.getSeatIds(), request.getPaymentMethod());

        // 1. Get or create GUEST user if userId is null
        User user = null;
        if (request.getUserId() == null) {
            user = userRepository.findByUsername(GUEST_USERNAME).orElseGet(() -> {
                log.info("Chưa có user GUEST, tiến hành tạo mới.");
                User newUser = User.builder()
                        .username(GUEST_USERNAME)
                        .passwordHash("N/A") // Or a random hash since they cannot login
                        .email(GUEST_EMAIL)
                        .fullName("Khách vãng lai")
                        .role(User.Role.customer)
                        .build();
                return userRepository.save(newUser);
            });
        } else {
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found: " + request.getUserId()));
        }

        // 2. Validate Showtime and Seats
        Showtime showtime = showtimeRepository.findById(request.getShowtimeId())
                .orElseThrow(() -> new RuntimeException("Showtime not found"));

        List<Seat> seatsToBook = seatRepository.findByRoomIdAndSeatKeyIn(
                showtime.getRoom().getRoomId(),
                request.getSeatIds());

        if (seatsToBook.size() != request.getSeatIds().size()) {
            throw new RuntimeException("Some seats are invalid");
        }

        List<Integer> seatIdsToBook = seatsToBook.stream()
                .map(Seat::getSeatId)
                .collect(Collectors.toList());

        boolean isAlreadyBookedDb = bookingSeatRepository.existsByShowtime_ShowtimeIdAndSeat_SeatIdIn(
                showtime.getShowtimeId(),
                seatIdsToBook);

        if (isAlreadyBookedDb) {
            throw new RuntimeException("Some of the requested seats are already booked in DB");
        }

        // 3. Lock seats with Redisson
        List<RLock> acquiredLocks = new ArrayList<>();
        String redisHashKey = "showtime:" + showtime.getShowtimeId() + ":seats";
        RMap<String, String> seatStatuses = redissonClient.getMap(redisHashKey);

        try {
            for (Seat seat : seatsToBook) {
                String lockKey = "seat_lock:" + showtime.getShowtimeId() + "_" + seat.getSeatId();
                RLock lock = redissonClient.getLock(lockKey);

                boolean isLocked = lock.tryLock(LOCK_WAIT_SECONDS, LOCK_HOLD_SECONDS, TimeUnit.SECONDS);
                if (!isLocked) {
                    throw new RuntimeException("Seat " + seat.getRowName() + seat.getSeatNumber() + " is currently being booked by someone else.");
                }
                acquiredLocks.add(lock);
            }

            // 4. Double check Redis Status
            for (Seat seat : seatsToBook) {
                String seatKey = seat.getRowName() + seat.getSeatNumber();
                String currentStatus = seatStatuses.get(seatKey);
                if ("LOCKED".equals(currentStatus) || "SOLD".equals(currentStatus)) {
                    throw new RuntimeException("Seat " + seatKey + " is already " + currentStatus + " in Redis");
                }
            }

            // 5. Calculate total amount
            BigDecimal totalAmount = BigDecimal.ZERO;
            for (Seat seat : seatsToBook) {
                totalAmount = totalAmount.add(showtime.getBasePrice()).add(seat.getSeatType().getSurcharge());
            }

            // 6. Create Order based on Payment Method
            boolean isCash = "CASH".equalsIgnoreCase(request.getPaymentMethod());
            Order.Status initialStatus = isCash ? Order.Status.paid : Order.Status.pending;

            Order order = Order.builder()
                    .user(user)
                    .orderCode("DH_TEMP_" + System.currentTimeMillis())
                    .totalAmount(totalAmount)
                    .finalAmount(totalAmount)
                    .expiredAt(LocalDateTime.now().plusMinutes(BOOKING_TTL_MINUTES))
                    .status(initialStatus)
                    .paymentMethod(request.getPaymentMethod())
                    .build();
            order = orderRepository.save(order);
            
            order.setOrderCode("DH" + order.getOrderId());

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
            }
            bookingSeatRepository.saveAll(bookingSeats);

            // Flush DB
            bookingSeatRepository.flush();
            orderRepository.flush();
            bookingRepository.flush();

            // 7. Update Redis seat statuses
            String targetStatus = isCash ? "SOLD" : "LOCKED";
            for (Seat seat : seatsToBook) {
                String seatKey = seat.getRowName() + seat.getSeatNumber();
                seatStatuses.put(seatKey, targetStatus);
                log.debug("Ghế {} marked {} in Redis", seatKey, targetStatus);
            }

            log.info("Booking tại quầy hoàn tất: bookingId={}, orderCode={}, payment={}, finalStatus={}",
                    booking.getBookingId(), order.getOrderCode(), request.getPaymentMethod(), targetStatus);

            return AdminBookingResponse.builder()
                    .bookingId(booking.getBookingId())
                    .orderCode(order.getOrderCode())
                    .status(order.getStatus().name())
                    .paymentMethod(request.getPaymentMethod())
                    .build();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Booking interrupted", e);
        } finally {
            // Release locks
            for (RLock lock : acquiredLocks) {
                try {
                    if (lock.isHeldByCurrentThread()) {
                        lock.unlock();
                    }
                } catch (Exception e) {
                    log.warn("Lỗi khi unlock: {}", e.getMessage());
                }
            }
        }
    }
}
