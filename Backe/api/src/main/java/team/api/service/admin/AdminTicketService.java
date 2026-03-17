package team.api.service.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.api.dto.response.admin.ScanResultResponse;
import team.api.entity.Booking;
import team.api.entity.BookingSeat;
import team.api.entity.Order;
import team.api.repository.BookingRepository;
import team.api.repository.BookingSeatRepository;
import team.api.repository.OrderRepository;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminTicketService {

    private final OrderRepository orderRepository;
    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;

    @Transactional
    public ScanResultResponse scanTicket(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderCode));

        if (order.getStatus() != Order.Status.paid) {
            throw new RuntimeException("Order is not paid. Current status: " + order.getStatus());
        }

        List<Booking> bookings = bookingRepository.findByOrder_OrderId(order.getOrderId());
        if (bookings.isEmpty()) {
            throw new RuntimeException("No bookings found for order: " + orderCode);
        }

        Booking firstBooking = bookings.get(0);
        var showtime = firstBooking.getShowtime();

        // Gather seat info — check if ANY seat was already checked in
        List<ScanResultResponse.SeatInfo> seatInfos = new ArrayList<>();
        boolean alreadyCheckedIn = false;
        List<BookingSeat> allSeats = new ArrayList<>();

        for (Booking booking : bookings) {
            List<BookingSeat> seats = bookingSeatRepository.findByBooking_BookingId(booking.getBookingId());
            allSeats.addAll(seats);
            for (BookingSeat bs : seats) {
                if (Boolean.TRUE.equals(bs.getIsCheckedIn())) alreadyCheckedIn = true;
                seatInfos.add(ScanResultResponse.SeatInfo.builder()
                        .seatLabel(bs.getSeat().getRowName() + bs.getSeat().getSeatNumber())
                        .seatType(bs.getSeat().getSeatType().getName())   // SeatType.name
                        .price(bs.getPrice())
                        .isCheckedIn(bs.getIsCheckedIn())
                        .build());
            }
        }

        // Idempotent check-in: only mark on first scan
        if (!alreadyCheckedIn) {
            allSeats.forEach(bs -> bs.setIsCheckedIn(true));
            bookingSeatRepository.saveAll(allSeats);
        }

        return ScanResultResponse.builder()
                .orderCode(order.getOrderCode())
                .status(ScanResultResponse.OrderStatus.valueOf(order.getStatus().name().toUpperCase()))
                .movieTitle(showtime.getMovie().getName())   // Movie.name
                .showtime(showtime.getStartTime())
                .room(showtime.getRoom().getName())          // Room.name
                .totalAmount(order.getFinalAmount())
                .seats(seatInfos)
                .isFullyCheckedIn(alreadyCheckedIn)
                .build();
    }
}
