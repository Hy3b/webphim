package team.api.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RMap;
import org.redisson.api.RedissonClient;
import team.api.entity.*;
import team.api.repository.BookingSeatRepository;
import team.api.repository.OrderRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScheduledTaskServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private BookingSeatRepository bookingSeatRepository;
    @Mock private RedissonClient redissonClient;
    @Mock private RMap<String, String> seatStatusMap;

    @InjectMocks
    private ScheduledTaskService scheduledTaskService;

    private Order expiredOrder;
    private Showtime showtime;
    private Seat seat;
    private Booking booking;
    private BookingSeat bookingSeat;

    @BeforeEach
    void setUp() {
        User user = User.builder().userId(1).username("testuser").build();
        Room room = Room.builder().roomId(1).name("Room 1").build();
        Movie movie = Movie.builder().id(1L).name("Test Movie").build();
        SeatType seatType = SeatType.builder().seatTypeId(1).name("Standard").surcharge(BigDecimal.ZERO).build();

        expiredOrder = Order.builder()
                .orderId(1)
                .orderCode("DH1")
                .user(user)
                .totalAmount(new BigDecimal("85000"))
                .finalAmount(new BigDecimal("85000"))
                .status(Order.Status.pending)
                .expiredAt(LocalDateTime.now().minusMinutes(5)) // already expired
                .build();

        showtime = Showtime.builder()
                .showtimeId(1)
                .movie(movie)
                .room(room)
                .basePrice(new BigDecimal("85000"))
                .build();

        seat = Seat.builder()
                .seatId(1)
                .room(room)
                .seatType(seatType)
                .rowName("A")
                .seatNumber(1)
                .build();

        booking = Booking.builder()
                .bookingId(1)
                .order(expiredOrder)
                .showtime(showtime)
                .build();

        bookingSeat = BookingSeat.builder()
                .id(1)
                .booking(booking)
                .showtime(showtime)
                .seat(seat)
                .price(new BigDecimal("85000"))
                .build();
    }

    // ==================== EXPIRE STALE ORDERS ====================

    @Test
    @DisplayName("expireStaleOrders - Huy don qua han, cap nhat status sang expired")
    void expireStaleOrders_expiresAndCleansUp() {
        // Arrange
        when(orderRepository.findByStatusAndExpiredAtBefore(eq(Order.Status.pending), any(LocalDateTime.class)))
                .thenReturn(List.of(expiredOrder));
        when(bookingSeatRepository.findByBooking_Order(expiredOrder)).thenReturn(List.of(bookingSeat));
        when(redissonClient.<String, String>getMap("showtime:1:seats")).thenReturn(seatStatusMap);

        // Act
        scheduledTaskService.expireStaleOrders();

        // Assert
        assertEquals(Order.Status.expired, expiredOrder.getStatus());
        verify(orderRepository).saveAll(List.of(expiredOrder));
        verify(bookingSeatRepository).deleteAll(List.of(bookingSeat));
    }

    @Test
    @DisplayName("expireStaleOrders - Khong co don qua han thi khong lam gi")
    void expireStaleOrders_noExpiredOrders_doesNothing() {
        // Arrange
        when(orderRepository.findByStatusAndExpiredAtBefore(eq(Order.Status.pending), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        // Act
        scheduledTaskService.expireStaleOrders();

        // Assert
        verify(orderRepository, never()).saveAll(any());
        verify(bookingSeatRepository, never()).deleteAll(anyList());
    }

    @Test
    @DisplayName("expireStaleOrders - Xoa ghe khoi Redis khi huy don")
    void expireStaleOrders_removesSeatsFromRedis() {
        // Arrange
        when(orderRepository.findByStatusAndExpiredAtBefore(eq(Order.Status.pending), any(LocalDateTime.class)))
                .thenReturn(List.of(expiredOrder));
        when(bookingSeatRepository.findByBooking_Order(expiredOrder)).thenReturn(List.of(bookingSeat));
        when(redissonClient.<String, String>getMap("showtime:1:seats")).thenReturn(seatStatusMap);

        // Act
        scheduledTaskService.expireStaleOrders();

        // Assert
        verify(seatStatusMap).remove("A1");
    }

    // ==================== CLEANUP EXISTING EXPIRED ====================

    @Test
    @DisplayName("cleanupExistingExpiredBookingSeats - Xoa BookingSeat con sot lai cua don da expired")
    void cleanupExistingExpiredBookingSeats_deletesOrphanedSeats() {
        // Arrange
        expiredOrder.setStatus(Order.Status.expired);
        when(orderRepository.findByStatus(Order.Status.expired)).thenReturn(List.of(expiredOrder));
        when(bookingSeatRepository.findByBooking_Order(expiredOrder)).thenReturn(List.of(bookingSeat));

        // Act
        scheduledTaskService.cleanupExistingExpiredBookingSeats();

        // Assert
        verify(bookingSeatRepository).deleteAll(List.of(bookingSeat));
    }

    @Test
    @DisplayName("cleanupExistingExpiredBookingSeats - Khong co du lieu can cleanup thi khong lam gi")
    void cleanupExistingExpiredBookingSeats_noOrphanedSeats_doesNothing() {
        // Arrange
        when(orderRepository.findByStatus(Order.Status.expired)).thenReturn(Collections.emptyList());

        // Act
        scheduledTaskService.cleanupExistingExpiredBookingSeats();

        // Assert
        verify(bookingSeatRepository, never()).deleteAll(anyList());
    }
}
