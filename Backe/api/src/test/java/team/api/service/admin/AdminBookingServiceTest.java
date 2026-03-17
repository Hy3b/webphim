package team.api.service.admin;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RLock;
import org.redisson.api.RMap;
import org.redisson.api.RedissonClient;
import team.api.dto.request.admin.AdminBookingRequest;
import team.api.dto.response.admin.AdminBookingResponse;
import team.api.entity.*;
import team.api.repository.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminBookingServiceTest {

    @Mock
    private RedissonClient redissonClient;
    @Mock
    private ShowtimeRepository showtimeRepository;
    @Mock
    private SeatRepository seatRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private BookingSeatRepository bookingSeatRepository;
    @Mock
    private OrderRepository orderRepository;

    @Mock
    private RMap<String, String> seatStatuses;
    @Mock
    private RLock mockLock;

    @InjectMocks
    private AdminBookingService adminBookingService;

    private User guestUser;
    private Showtime showtime;
    private Seat seat;

    @BeforeEach
    void setUp() {
        guestUser = User.builder()
                .userId(1)
                .username("GUEST")
                .email("guest@webphim.local")
                .build();

        Room room = Room.builder().roomId(1).build();

        showtime = Showtime.builder()
                .showtimeId(1)
                .room(room)
                .basePrice(BigDecimal.valueOf(50000))
                .build();

        SeatType seatType = SeatType.builder()
                .surcharge(BigDecimal.valueOf(10000))
                .build();

        seat = Seat.builder()
                .seatId(1)
                .rowName("A")
                .seatNumber(1)
                .seatType(seatType)
                .build();
    }

    @Test
    void bookTicketsAtCounter_CashPayment_Success() throws InterruptedException {
        // Arrange
        AdminBookingRequest request = new AdminBookingRequest();
        request.setShowtimeId(1);
        request.setSeatIds(List.of("A1"));
        request.setPaymentMethod("CASH");
        
        when(userRepository.findByUsername("GUEST")).thenReturn(Optional.of(guestUser));
        when(showtimeRepository.findById(1)).thenReturn(Optional.of(showtime));
        when(seatRepository.findByRoomIdAndSeatKeyIn(anyInt(), anyList())).thenReturn(List.of(seat));
        when(bookingSeatRepository.existsByShowtime_ShowtimeIdAndSeat_SeatIdIn(anyInt(), anyList())).thenReturn(false);
        
        when(redissonClient.<String, String>getMap(anyString())).thenReturn(seatStatuses);
        when(redissonClient.getLock(anyString())).thenReturn(mockLock);
        when(mockLock.tryLock(anyLong(), anyLong(), eq(TimeUnit.SECONDS))).thenReturn(true);
        when(mockLock.isHeldByCurrentThread()).thenReturn(true);
        when(seatStatuses.get("A1")).thenReturn(null);
        
        Order savedOrder = Order.builder().orderId(100).status(Order.Status.paid).orderCode("DH100").build();
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);
        
        Booking savedBooking = Booking.builder().bookingId(200).build();
        when(bookingRepository.save(any(Booking.class))).thenReturn(savedBooking);
        
        // Act
        AdminBookingResponse response = adminBookingService.bookTicketsAtCounter(request);
        
        // Assert
        assertNotNull(response);
        assertEquals(200, response.getBookingId());
        assertEquals("DH100", response.getOrderCode());
        assertEquals("paid", response.getStatus()); // Enum matches name
        
        verify(seatStatuses).put("A1", "SOLD");
        verify(mockLock).unlock();
    }

    @Test
    void bookTicketsAtCounter_QRPayment_Success() throws InterruptedException {
        // Arrange
        AdminBookingRequest request = new AdminBookingRequest();
        request.setShowtimeId(1);
        request.setSeatIds(List.of("A1"));
        request.setPaymentMethod("QR");
        
        when(userRepository.findByUsername("GUEST")).thenReturn(Optional.of(guestUser));
        when(showtimeRepository.findById(1)).thenReturn(Optional.of(showtime));
        when(seatRepository.findByRoomIdAndSeatKeyIn(anyInt(), anyList())).thenReturn(List.of(seat));
        when(bookingSeatRepository.existsByShowtime_ShowtimeIdAndSeat_SeatIdIn(anyInt(), anyList())).thenReturn(false);
        
        when(redissonClient.<String, String>getMap(anyString())).thenReturn(seatStatuses);
        when(redissonClient.getLock(anyString())).thenReturn(mockLock);
        when(mockLock.tryLock(anyLong(), anyLong(), eq(TimeUnit.SECONDS))).thenReturn(true);
        when(mockLock.isHeldByCurrentThread()).thenReturn(true);
        when(seatStatuses.get("A1")).thenReturn(null);
        
        Order savedOrder = Order.builder().orderId(101).status(Order.Status.pending).orderCode("DH101").build();
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);
        
        Booking savedBooking = Booking.builder().bookingId(201).build();
        when(bookingRepository.save(any(Booking.class))).thenReturn(savedBooking);
        
        // Act
        AdminBookingResponse response = adminBookingService.bookTicketsAtCounter(request);
        
        // Assert
        assertNotNull(response);
        assertEquals(201, response.getBookingId());
        assertEquals("DH101", response.getOrderCode());
        assertEquals("pending", response.getStatus()); 
        
        verify(seatStatuses).put("A1", "LOCKED");
        verify(mockLock).unlock();
    }
}
