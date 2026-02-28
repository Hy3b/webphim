package team.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.api.dto.request.CreateBookingRequest;
import team.api.dto.response.CreateBookingResponse;
import team.api.entity.Booking;
import team.api.repository.BookingRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;

    /**
     * Tạo booking mới với status = "pending".
     * orderCode = "DH{bookingId}" — khớp với pattern webhook SePay.
     */
    @Transactional
    public CreateBookingResponse createBooking(CreateBookingRequest request) {
        Booking booking = Booking.builder()
                .userId(request.getUserId())
                .showtimeId(request.getShowtimeId())
                .totalAmount(request.getTotalAmount())
                .status("pending")
                .build();

        Booking saved = bookingRepository.save(booking);
        String orderCode = "DH" + saved.getBookingId();

        log.info("✅ Tạo booking mới: bookingId={}, orderCode={}, amount={}",
                saved.getBookingId(), orderCode, saved.getTotalAmount());

        return CreateBookingResponse.builder()
                .bookingId(saved.getBookingId())
                .orderCode(orderCode)
                .status(saved.getStatus())
                .build();
    }
}
