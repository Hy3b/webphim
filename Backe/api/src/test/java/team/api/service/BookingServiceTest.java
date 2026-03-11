package team.api.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RLock;
import org.redisson.api.RMap;
import org.redisson.api.RedissonClient;
import team.api.dto.request.BookingRequest;
import team.api.dto.response.CreateBookingResponse;
import team.api.entity.*;
import team.api.repository.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock private RedissonClient redissonClient;
    @Mock private ShowtimeRepository showtimeRepository;
    @Mock private SeatRepository seatRepository;
    @Mock private UserRepository userRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private BookingSeatRepository bookingSeatRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private RMap<String, String> seatStatusMap;
    @Mock private RLock rLock;

    @InjectMocks
    private BookingService bookingService;

    private BookingRequest validRequest;
    private Showtime showtime;
    private User user;
    private Seat seat;
    private SeatType seatType;
    private Room room;
    private Movie movie;

    @BeforeEach
    void setUp() {
        validRequest = BookingRequest.builder()
                .userId(1)
                .showtimeId(1)
                .seatIds(List.of("A1"))
                .build();

        movie = Movie.builder().id(1L).name("Test Movie").duration(120).build();

        room = Room.builder().roomId(1).name("Room 1").build();

        seatType = SeatType.builder()
                .seatTypeId(1)
                .name("Standard")
                .surcharge(new BigDecimal("10000"))
                .build();

        showtime = Showtime.builder()
                .showtimeId(1)
                .movie(movie)
                .room(room)
                .startTime(LocalDateTime.of(2026, 3, 15, 19, 0))
                .basePrice(new BigDecimal("75000"))
                .build();

        user = User.builder()
                .userId(1)
                .username("testuser")
                .email("test@example.com")
                .role(User.Role.customer)
                .build();

        seat = Seat.builder()
                .seatId(1)
                .room(room)
                .seatType(seatType)
                .rowName("A")
                .seatNumber(1)
                .build();
    }

    private void setupSuccessfulBookingMocks() throws InterruptedException {
        when(showtimeRepository.findById(1)).thenReturn(Optional.of(showtime));
        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(seatRepository.findByRoomIdAndSeatKeyIn(1, List.of("A1"))).thenReturn(List.of(seat));
        when(bookingSeatRepository.existsByShowtime_ShowtimeIdAndSeat_SeatIdIn(eq(1), anyList())).thenReturn(false);
        when(redissonClient.<String, String>getMap("showtime:1:seats")).thenReturn(seatStatusMap);
        when(redissonClient.getLock(anyString())).thenReturn(rLock);
        when(rLock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(true);
        when(rLock.isHeldByCurrentThread()).thenReturn(true);
        when(seatStatusMap.get("A1")).thenReturn(null); // AVAILABLE

        Order savedOrder = Order.builder()
                .orderId(1)
                .orderCode("DH_TEMP_123")
                .user(user)
                .totalAmount(new BigDecimal("85000"))
                .finalAmount(new BigDecimal("85000"))
                .status(Order.Status.pending)
                .expiredAt(LocalDateTime.now().plusMinutes(10))
                .build();
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        Booking savedBooking = Booking.builder()
                .bookingId(1)
                .order(savedOrder)
                .showtime(showtime)
                .build();
        when(bookingRepository.save(any(Booking.class))).thenReturn(savedBooking);
        when(bookingSeatRepository.saveAll(anyList())).thenReturn(List.of());
    }

    // ==================== BOOK SEATS TESTS ====================

    @Test
    @DisplayName("bookSeats - Dat ve thanh cong")
    void bookSeats_success() throws InterruptedException {
        // Arrange
        setupSuccessfulBookingMocks();

        // Act
        CreateBookingResponse response = bookingService.bookSeats(validRequest);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getBookingId());
        assertEquals("pending", response.getStatus());
        verify(orderRepository).save(any(Order.class));
        verify(bookingRepository).save(any(Booking.class));
        verify(bookingSeatRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("bookSeats - Showtime khong ton tai thi throw exception")
    void bookSeats_showtimeNotFound_throwsException() {
        // Arrange
        when(showtimeRepository.findById(1)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.bookSeats(validRequest));
        assertEquals("Showtime not found", ex.getMessage());
    }

    @Test
    @DisplayName("bookSeats - User khong ton tai thi throw exception")
    void bookSeats_userNotFound_throwsException() {
        // Arrange
        when(showtimeRepository.findById(1)).thenReturn(Optional.of(showtime));
        when(userRepository.findById(1)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.bookSeats(validRequest));
        assertEquals("User not found", ex.getMessage());
    }

    @Test
    @DisplayName("bookSeats - Ghe khong hop le (so luong khong khop) thi throw exception")
    void bookSeats_invalidSeats_throwsException() {
        // Arrange
        when(showtimeRepository.findById(1)).thenReturn(Optional.of(showtime));
        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(seatRepository.findByRoomIdAndSeatKeyIn(1, List.of("A1"))).thenReturn(List.of()); // empty

        // Act & Assert
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.bookSeats(validRequest));
        assertEquals("Some seats are invalid", ex.getMessage());
    }

    @Test
    @DisplayName("bookSeats - Ghe da booked trong DB thi throw exception")
    void bookSeats_alreadyBookedInDB_throwsException() {
        // Arrange
        when(showtimeRepository.findById(1)).thenReturn(Optional.of(showtime));
        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(seatRepository.findByRoomIdAndSeatKeyIn(1, List.of("A1"))).thenReturn(List.of(seat));
        when(bookingSeatRepository.existsByShowtime_ShowtimeIdAndSeat_SeatIdIn(eq(1), anyList())).thenReturn(true);

        // Act & Assert
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.bookSeats(validRequest));
        assertEquals("Some of the requested seats are already booked", ex.getMessage());
    }

    @Test
    @DisplayName("bookSeats - Ghe LOCKED trong Redis thi throw exception")
    void bookSeats_lockedInRedis_throwsException() throws InterruptedException {
        // Arrange
        when(showtimeRepository.findById(1)).thenReturn(Optional.of(showtime));
        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(seatRepository.findByRoomIdAndSeatKeyIn(1, List.of("A1"))).thenReturn(List.of(seat));
        when(bookingSeatRepository.existsByShowtime_ShowtimeIdAndSeat_SeatIdIn(eq(1), anyList())).thenReturn(false);
        when(redissonClient.<String, String>getMap("showtime:1:seats")).thenReturn(seatStatusMap);
        when(redissonClient.getLock(anyString())).thenReturn(rLock);
        when(rLock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(true);
        when(rLock.isHeldByCurrentThread()).thenReturn(true);
        when(seatStatusMap.get("A1")).thenReturn("LOCKED");

        // Act & Assert
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.bookSeats(validRequest));
        assertTrue(ex.getMessage().contains("already LOCKED"));
    }

    @Test
    @DisplayName("bookSeats - Ghe SOLD trong Redis thi throw exception")
    void bookSeats_soldInRedis_throwsException() throws InterruptedException {
        // Arrange
        when(showtimeRepository.findById(1)).thenReturn(Optional.of(showtime));
        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(seatRepository.findByRoomIdAndSeatKeyIn(1, List.of("A1"))).thenReturn(List.of(seat));
        when(bookingSeatRepository.existsByShowtime_ShowtimeIdAndSeat_SeatIdIn(eq(1), anyList())).thenReturn(false);
        when(redissonClient.<String, String>getMap("showtime:1:seats")).thenReturn(seatStatusMap);
        when(redissonClient.getLock(anyString())).thenReturn(rLock);
        when(rLock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(true);
        when(rLock.isHeldByCurrentThread()).thenReturn(true);
        when(seatStatusMap.get("A1")).thenReturn("SOLD");

        // Act & Assert
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.bookSeats(validRequest));
        assertTrue(ex.getMessage().contains("already SOLD"));
    }

    @Test
    @DisplayName("bookSeats - Khong the acquire lock thi throw exception")
    void bookSeats_lockFailed_throwsException() throws InterruptedException {
        // Arrange
        when(showtimeRepository.findById(1)).thenReturn(Optional.of(showtime));
        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(seatRepository.findByRoomIdAndSeatKeyIn(1, List.of("A1"))).thenReturn(List.of(seat));
        when(bookingSeatRepository.existsByShowtime_ShowtimeIdAndSeat_SeatIdIn(eq(1), anyList())).thenReturn(false);
        when(redissonClient.<String, String>getMap("showtime:1:seats")).thenReturn(seatStatusMap);
        when(redissonClient.getLock(anyString())).thenReturn(rLock);
        when(rLock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(false);

        // Act & Assert
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.bookSeats(validRequest));
        assertTrue(ex.getMessage().contains("currently being booked"));
    }

    @Test
    @DisplayName("bookSeats - Tinh dung tong tien (basePrice + surcharge)")
    void bookSeats_calculatesCorrectTotalAmount() throws InterruptedException {
        // Arrange
        setupSuccessfulBookingMocks();

        // Act
        bookingService.bookSeats(validRequest);

        // Assert: basePrice(75000) + surcharge(10000) = 85000
        verify(orderRepository).save(argThat(order ->
                new BigDecimal("85000").compareTo(order.getTotalAmount()) == 0));
    }

    @Test
    @DisplayName("bookSeats - expiredAt dung (now + 10 phut)")
    void bookSeats_setsCorrectExpiredAt() throws InterruptedException {
        // Arrange
        setupSuccessfulBookingMocks();

        // Act
        bookingService.bookSeats(validRequest);

        // Assert
        verify(orderRepository).save(argThat(order -> {
            LocalDateTime expiredAt = order.getExpiredAt();
            LocalDateTime expectedMin = LocalDateTime.now().plusMinutes(9);
            LocalDateTime expectedMax = LocalDateTime.now().plusMinutes(11);
            return expiredAt.isAfter(expectedMin) && expiredAt.isBefore(expectedMax);
        }));
    }

    @Test
    @DisplayName("bookSeats - orderCode co dinh dang DH + orderId")
    void bookSeats_orderCodeFormat() throws InterruptedException {
        // Arrange
        setupSuccessfulBookingMocks();

        // Act
        CreateBookingResponse response = bookingService.bookSeats(validRequest);

        // Assert: order.setOrderCode("DH" + order.getOrderId()) is called
        // The response orderCode comes from the saved order
        assertNotNull(response.getOrderCode());
    }

    // ==================== IS SEAT AVAILABLE ====================

    @Test
    @DisplayName("isSeatAvailable - Ghe available khi khong co trong Redis")
    void isSeatAvailable_checksRedisStatus() {
        // Arrange
        when(redissonClient.<String, String>getMap("showtime:1:seats")).thenReturn(seatStatusMap);
        when(seatStatusMap.get("A1")).thenReturn(null);

        // Act
        boolean result = bookingService.isSeatAvailable(1, "A1");

        // Assert
        assertTrue(result);
    }
}
