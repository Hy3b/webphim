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
import team.api.dto.request.SePayWebhookRequest;
import team.api.dto.response.BookingStatusResponse;
import team.api.entity.*;
import team.api.repository.BookingRepository;
import team.api.repository.BookingSeatRepository;
import team.api.repository.OrderRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private BookingSeatRepository bookingSeatRepository;
    @Mock private RedissonClient redissonClient;
    @Mock private RMap<String, String> seatStatusMap;

    @InjectMocks
    private PaymentService paymentService;

    private Order pendingOrder;
    private SePayWebhookRequest validWebhookRequest;
    private User user;
    private Room room;
    private SeatType seatType;
    private Showtime showtime;

    @BeforeEach
    void setUp() {
        user = User.builder().userId(1).username("testuser").build();

        pendingOrder = Order.builder()
                .orderId(1)
                .orderCode("DH1")
                .user(user)
                .totalAmount(new BigDecimal("85000"))
                .finalAmount(new BigDecimal("85000"))
                .status(Order.Status.pending)
                .expiredAt(LocalDateTime.now().plusMinutes(10))
                .build();

        validWebhookRequest = new SePayWebhookRequest();
        validWebhookRequest.setId(1L);
        validWebhookRequest.setGateway("MB");
        validWebhookRequest.setTransferAmount(new BigDecimal("85000"));
        validWebhookRequest.setContent("THANH TOAN DH1");
        validWebhookRequest.setReferenceCode("FT123456");

        room = Room.builder().roomId(1).name("Room 1").build();
        seatType = SeatType.builder().seatTypeId(1).name("Standard").surcharge(BigDecimal.ZERO).build();

        Movie movie = Movie.builder().id(1L).name("Test Movie").build();

        showtime = Showtime.builder()
                .showtimeId(1)
                .movie(movie)
                .room(room)
                .basePrice(new BigDecimal("85000"))
                .build();
    }

    // ==================== PROCESS WEBHOOK ====================

    @Test
    @DisplayName("processWebhook - Thanh toan thanh cong, cap nhat order sang PAID")
    void processWebhook_success_updatesOrderToPaid() {
        // Arrange
        when(orderRepository.findByOrderCode("DH1")).thenReturn(Optional.of(pendingOrder));

        Booking booking = Booking.builder().bookingId(1).order(pendingOrder).showtime(showtime).build();
        when(bookingRepository.findByOrder_OrderId(1)).thenReturn(List.of(booking));

        Seat seat = Seat.builder().seatId(1).room(room).seatType(seatType).rowName("A").seatNumber(1).build();
        BookingSeat bs = BookingSeat.builder().id(1).booking(booking).showtime(showtime).seat(seat).price(new BigDecimal("85000")).build();
        when(bookingSeatRepository.findByBooking_BookingId(1)).thenReturn(List.of(bs));
        when(redissonClient.<String, String>getMap("showtime:1:seats")).thenReturn(seatStatusMap);

        // Act
        paymentService.processWebhook(validWebhookRequest);

        // Assert
        assertEquals(Order.Status.paid, pendingOrder.getStatus());
        verify(orderRepository).save(pendingOrder);
    }

    @Test
    @DisplayName("processWebhook - Thanh toan thanh cong, ghe chuyen sang SOLD trong Redis")
    void processWebhook_success_marksSeatsSoldInRedis() {
        // Arrange
        when(orderRepository.findByOrderCode("DH1")).thenReturn(Optional.of(pendingOrder));

        Booking booking = Booking.builder().bookingId(1).order(pendingOrder).showtime(showtime).build();
        when(bookingRepository.findByOrder_OrderId(1)).thenReturn(List.of(booking));

        Seat seat = Seat.builder().seatId(1).room(room).seatType(seatType).rowName("A").seatNumber(1).build();
        BookingSeat bs = BookingSeat.builder().id(1).booking(booking).showtime(showtime).seat(seat).price(new BigDecimal("85000")).build();
        when(bookingSeatRepository.findByBooking_BookingId(1)).thenReturn(List.of(bs));
        when(redissonClient.<String, String>getMap("showtime:1:seats")).thenReturn(seatStatusMap);

        // Act
        paymentService.processWebhook(validWebhookRequest);

        // Assert
        verify(seatStatusMap).put("A1", "SOLD");
    }

    @Test
    @DisplayName("processWebhook - Khong co ma don hang trong noi dung thi bo qua")
    void processWebhook_noOrderCodeInContent_ignored() {
        // Arrange
        validWebhookRequest.setContent("CHUYEN TIEN RANDOM");

        // Act
        paymentService.processWebhook(validWebhookRequest);

        // Assert
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("processWebhook - Don hang khong ton tai trong DB thi bo qua")
    void processWebhook_orderNotFound_ignored() {
        // Arrange
        when(orderRepository.findByOrderCode("DH1")).thenReturn(Optional.empty());

        // Act
        paymentService.processWebhook(validWebhookRequest);

        // Assert
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("processWebhook - Don hang khong o trang thai pending thi bo qua")
    void processWebhook_orderNotPending_ignored() {
        // Arrange
        pendingOrder.setStatus(Order.Status.paid); // already paid
        when(orderRepository.findByOrderCode("DH1")).thenReturn(Optional.of(pendingOrder));

        // Act
        paymentService.processWebhook(validWebhookRequest);

        // Assert
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("processWebhook - So tien khong du thi khong cap nhat")
    void processWebhook_insufficientAmount_notUpdated() {
        // Arrange
        validWebhookRequest.setTransferAmount(new BigDecimal("50000")); // less than 85000
        when(orderRepository.findByOrderCode("DH1")).thenReturn(Optional.of(pendingOrder));

        // Act
        paymentService.processWebhook(validWebhookRequest);

        // Assert
        assertEquals(Order.Status.pending, pendingOrder.getStatus());
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("processWebhook - So tien du thua van cap nhat thanh PAID")
    void processWebhook_overpaidAmount_stillPaid() {
        // Arrange
        validWebhookRequest.setTransferAmount(new BigDecimal("100000")); // more than 85000
        when(orderRepository.findByOrderCode("DH1")).thenReturn(Optional.of(pendingOrder));

        Booking booking = Booking.builder().bookingId(1).order(pendingOrder).showtime(showtime).build();
        when(bookingRepository.findByOrder_OrderId(1)).thenReturn(List.of(booking));
        when(bookingSeatRepository.findByBooking_BookingId(1)).thenReturn(List.of());
        when(redissonClient.<String, String>getMap(anyString())).thenReturn(seatStatusMap);

        // Act
        paymentService.processWebhook(validWebhookRequest);

        // Assert
        assertEquals(Order.Status.paid, pendingOrder.getStatus());
        verify(orderRepository).save(pendingOrder);
    }

    // ==================== GET BOOKING STATUS ====================

    @Test
    @DisplayName("getBookingStatus - Tim thay order PAID, tra ve paid=true")
    void getBookingStatus_found_returnsPaidTrue() {
        // Arrange
        pendingOrder.setStatus(Order.Status.paid);
        when(orderRepository.findByOrderCode("DH1")).thenReturn(Optional.of(pendingOrder));

        // Act
        BookingStatusResponse response = paymentService.getBookingStatus("DH1");

        // Assert
        assertTrue(response.isPaid());
        assertEquals("paid", response.getStatus());
        assertEquals(1, response.getBookingId());
    }

    @Test
    @DisplayName("getBookingStatus - Tim thay order PENDING, tra ve paid=false")
    void getBookingStatus_found_returnsPendingFalse() {
        // Arrange
        when(orderRepository.findByOrderCode("DH1")).thenReturn(Optional.of(pendingOrder));

        // Act
        BookingStatusResponse response = paymentService.getBookingStatus("DH1");

        // Assert
        assertFalse(response.isPaid());
        assertEquals("pending", response.getStatus());
    }

    @Test
    @DisplayName("getBookingStatus - Khong tim thay order, tra ve not_found")
    void getBookingStatus_notFound_returnsNotFound() {
        // Arrange
        when(orderRepository.findByOrderCode("DH999")).thenReturn(Optional.empty());

        // Act
        BookingStatusResponse response = paymentService.getBookingStatus("DH999");

        // Assert
        assertFalse(response.isPaid());
        assertEquals("not_found", response.getStatus());
    }
}
