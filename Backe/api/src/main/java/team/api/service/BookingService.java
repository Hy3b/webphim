package team.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RMap;
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
    private static final int LOCK_WAIT_SECONDS = 1;
    private static final int LOCK_HOLD_SECONDS = 2; // ✅ Giảm từ 10 → 2 giây

    private final RedissonClient redissonClient;
    private final ShowtimeRepository showtimeRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public CreateBookingResponse bookSeats(BookingRequest request) {
        log.info("🔍 Bắt đầu booking: userId={}, showtimeId={}, seatIds={}",
                request.getUserId(), request.getShowtimeId(), request.getSeatIds());

        // ═════════════════════════════════════════════════════════════
        // PHASE 1: Validate basic info
        // ═════════════════════════════════════════════════════════════

        Showtime showtime = showtimeRepository.findById(request.getShowtimeId())
                .orElseThrow(() -> {
                    log.error("❌ Showtime không tồn tại: showtimeId={}", request.getShowtimeId());
                    return new RuntimeException("Showtime not found");
                });

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> {
                    log.error("❌ User không tồn tại: userId={}", request.getUserId());
                    return new RuntimeException("User not found");
                });

        List<Seat> seatsToBook = seatRepository.findByRoomIdAndSeatKeyIn(
                showtime.getRoom().getRoomId(),
                request.getSeatIds());

        if (seatsToBook.size() != request.getSeatIds().size()) {
            log.error("❌ Một số ghế không tồn tại: requested={}, found={}",
                    request.getSeatIds().size(), seatsToBook.size());
            throw new RuntimeException("Some seats are invalid");
        }

        // ═════════════════════════════════════════════════════════════
        // PHASE 2: Check database - đảm bảo ghế chưa được booked
        // ═════════════════════════════════════════════════════════════

        List<Integer> seatIdsToBook = seatsToBook.stream()
                .map(Seat::getSeatId)
                .collect(Collectors.toList());

        boolean isAlreadyBookedDb = bookingSeatRepository.existsByShowtime_ShowtimeIdAndSeat_SeatIdIn(
                showtime.getShowtimeId(),
                seatIdsToBook);

        if (isAlreadyBookedDb) {
            log.warn("⚠️ Một số ghế đã được booked trong DB: showtimeId={}, seatIds={}",
                    showtime.getShowtimeId(), seatIdsToBook);
            throw new RuntimeException("Some of the requested seats are already booked");
        }

        // ═════════════════════════════════════════════════════════════
        // PHASE 3: Acquire Redisson Locks - tránh race condition
        // ═════════════════════════════════════════════════════════════

        List<RLock> acquiredLocks = new ArrayList<>();
        String redisHashKey = "showtime:" + showtime.getShowtimeId() + ":seats";
        RMap<String, String> seatStatuses = redissonClient.getMap(redisHashKey);

        try {
            log.debug("🔒 Cố gắng acquire {} lock(s)...", seatsToBook.size());

            for (Seat seat : seatsToBook) {
                String lockKey = "seat_lock:" + showtime.getShowtimeId() + "_" + seat.getSeatId();
                RLock lock = redissonClient.getLock(lockKey);

                // ✅ Chờ tối đa 1 giây để lấy lock, giữ 2 giây (giảm từ 10s)
                boolean isLocked = lock.tryLock(LOCK_WAIT_SECONDS, LOCK_HOLD_SECONDS, TimeUnit.SECONDS);

                if (!isLocked) {
                    log.warn("⚠️ Không thể lock ghế: {} (đang được booked bởi user khác)",
                            seat.getRowName() + seat.getSeatNumber());
                    throw new RuntimeException(
                            "Seat " + seat.getRowName() + seat.getSeatNumber()
                                    + " is currently being booked by someone else.");
                }

                acquiredLocks.add(lock);
                log.debug("✓ Locked ghế: {}", seat.getRowName() + seat.getSeatNumber());
            }

            // ═════════════════════════════════════════════════════════════
            // PHASE 4: Double-check Redis status trước khi xử lý
            // ═════════════════════════════════════════════════════════════

            log.debug("🔍 Double-check Redis status của tất cả ghế...");

            for (Seat seat : seatsToBook) {
                String seatKey = seat.getRowName() + seat.getSeatNumber();
                String currentStatus = seatStatuses.get(seatKey);

                if ("LOCKED".equals(currentStatus) || "SOLD".equals(currentStatus)) {
                    log.warn("⚠️ Ghế {} đã có status: {} (trong Redis)", seatKey, currentStatus);
                    throw new RuntimeException(
                            "Seat " + seatKey + " is already " + currentStatus);
                }
            }

            log.debug("✓ Tất cả ghế available trong Redis");

            // ═════════════════════════════════════════════════════════════
            // PHASE 5: Create Order and Booking in Database
            // ═════════════════════════════════════════════════════════════

            log.debug("💾 Tạo Order và Booking trong DB...");

            BigDecimal totalAmount = BigDecimal.ZERO;
            for (Seat seat : seatsToBook) {
                totalAmount = totalAmount
                        .add(showtime.getBasePrice())
                        .add(seat.getSeatType().getSurcharge());
            }

            // ✅ Tạo Order với temporary code
            Order order = Order.builder()
                    .user(user)
                    .orderCode("DH_TEMP_" + System.currentTimeMillis()) // Tạm thời duy nhất
                    .totalAmount(totalAmount)
                    .finalAmount(totalAmount)
                    .expiredAt(LocalDateTime.now().plusMinutes(BOOKING_TTL_MINUTES))
                    .status(Order.Status.pending)
                    .build();
            order = orderRepository.save(order);

            log.debug("  → Saved Order (temp): orderId={}, amount={}", order.getOrderId(), totalAmount);

            // ✅ Cập nhật orderCode với ID thực - chỉ save 1 lần duy nhất
            order.setOrderCode("DH" + order.getOrderId());
            // @Transactional sẽ tự động flush khi method kết thúc, không cần save lại

            log.debug("  → Updated orderCode: {}", order.getOrderCode());

            // ✅ Tạo Booking
            Booking booking = Booking.builder()
                    .order(order)
                    .showtime(showtime)
                    .build();
            booking = bookingRepository.save(booking);

            log.debug("  → Saved Booking: bookingId={}", booking.getBookingId());

            // ═════════════════════════════════════════════════════════════
            // PHASE 6: Create BookingSeat records
            // ═════════════════════════════════════════════════════════════

            log.debug("📝 Tạo {} BookingSeat records...", seatsToBook.size());

            List<BookingSeat> bookingSeats = new ArrayList<>();
            for (Seat seat : seatsToBook) {
                BigDecimal seatPrice = showtime.getBasePrice()
                        .add(seat.getSeatType().getSurcharge());

                BookingSeat bookingSeat = BookingSeat.builder()
                        .booking(booking)
                        .showtime(showtime)
                        .seat(seat)
                        .price(seatPrice)
                        .build();
                bookingSeats.add(bookingSeat);

                log.debug("  → Prepared: {} = {}",
                        seat.getRowName() + seat.getSeatNumber(), seatPrice);
            }

            bookingSeatRepository.saveAll(bookingSeats);
            log.debug("✓ Saved {} BookingSeat records", bookingSeats.size());

            // ✅ Flush DB changes TRƯỚC KHI update Redis
            // Đảm bảo consistency: nếu DB commit fail, Redis không được update
            bookingSeatRepository.flush();
            orderRepository.flush();
            bookingRepository.flush();

            log.debug("✓ DB transaction flushed");

            // ═════════════════════════════════════════════════════════════
            // PHASE 7: Update Redis - đánh dấu LOCKED
            // ═════════════════════════════════════════════════════════════

            log.debug("📍 Đánh dấu ghế LOCKED trong Redis với Scheduler xử lý timeout...");

            for (Seat seat : seatsToBook) {
                String seatKey = seat.getRowName() + seat.getSeatNumber();

                // ✅ CRITICAL: Thêm trạng thái LOCKED. Scheduler sẽ xử lý nếu hết timeout.
                seatStatuses.put(seatKey, "LOCKED");

                log.debug("  → {} marked LOCKED (Scheduler sẽ expire order sau {}min)", seatKey, BOOKING_TTL_MINUTES);
            }

            log.debug("✓ Tất cả ghế đã được đánh dấu LOCKED trong Redis");

            // ═════════════════════════════════════════════════════════════
            // SUCCESS: Trả về response
            // ═════════════════════════════════════════════════════════════

            log.info("✅ Booking thành công: bookingId={}, orderCode={}, amount={}, expiredAt={}",
                    booking.getBookingId(), order.getOrderCode(), order.getTotalAmount(), order.getExpiredAt());

            return CreateBookingResponse.builder()
                    .bookingId(booking.getBookingId())
                    .orderCode(order.getOrderCode())
                    .status(order.getStatus().name())
                    .build();

        } catch (InterruptedException e) {
            // ✅ Restore interrupt flag
            Thread.currentThread().interrupt();
            log.error("❌ Booking bị interrupt: {}", e.getMessage());
            throw new RuntimeException("Booking interrupted", e);

        } catch (RuntimeException e) {
            // ✅ Log chi tiết lỗi
            log.error("❌ Booking failed: {}", e.getMessage());
            // DB transaction sẽ rollback tự động
            // Redis update chưa chạy → State consistent
            throw e;

        } finally {
            // ═════════════════════════════════════════════════════════════
            // CLEANUP: Luôn giải phóng tất cả locks
            // ═════════════════════════════════════════════════════════════

            if (!acquiredLocks.isEmpty()) {
                log.debug("🔓 Giải phóng {} lock(s)...", acquiredLocks.size());

                for (RLock lock : acquiredLocks) {
                    try {
                        if (lock.isHeldByCurrentThread()) {
                            lock.unlock();
                            log.debug("  → Unlocked");
                        }
                    } catch (Exception e) {
                        // ✅ Không throw exception ở đây, để lock tự expire
                        log.warn("⚠️ Lỗi khi unlock: {}", e.getMessage());
                    }
                }

                log.debug("✓ Tất cả lock đã được giải phóng");
            }
        }
    }

    /**
     * Helper method: Kiểm tra status ghế trong Redis
     * Có thể dùng cho API check available seats
     */
    public boolean isSeatAvailable(int showtimeId, String seatKey) {
        try {
            String redisHashKey = "showtime:" + showtimeId + ":seats";
            RMap<String, String> seatStatuses = redissonClient.getMap(redisHashKey);
            String status = seatStatuses.get(seatKey);

            // null = AVAILABLE, "LOCKED" = temp booking, "SOLD" = paid
            return status == null;
        } catch (Exception e) {
            log.warn("⚠️ Lỗi khi check seat availability: {}", e.getMessage());
            return false; // Fail-safe: coi như ghế không available
        }
    }

    /**
     * Helper method: Lấy tất cả available seats của một showtime
     */
    public List<String> getAvailableSeats(int showtimeId) {
        try {
            String redisHashKey = "showtime:" + showtimeId + ":seats";
            RMap<String, String> seatStatuses = redissonClient.getMap(redisHashKey);

            // Lấy tất cả seat keys từ room
            Showtime showtime = showtimeRepository.findById(showtimeId)
                    .orElseThrow(() -> new RuntimeException("Showtime not found"));

            List<Seat> allSeats = seatRepository.findByRoomId(showtime.getRoom().getRoomId());
            List<String> available = new ArrayList<>();

            for (Seat seat : allSeats) {
                String seatKey = seat.getRowName() + seat.getSeatNumber();
                String status = seatStatuses.get(seatKey);

                // Nếu không có status trong Redis, ghế available
                if (status == null) {
                    available.add(seatKey);
                }
            }

            return available;
        } catch (Exception e) {
            log.error("❌ Lỗi khi lấy available seats: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
}
