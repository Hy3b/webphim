package team.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.api.dto.request.CreateBookingRequest;
import team.api.dto.response.CreateBookingResponse;
import team.api.service.BookingService;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /**
     * Tạo booking mới.
     * Frontend gọi endpoint này trước khi hiển thị trang thanh toán.
     *
     * Request body: { userId, showtimeId, totalAmount, seatIds }
     * Response: { bookingId, orderCode, status }
     */
    @PostMapping
    public ResponseEntity<CreateBookingResponse> createBooking(
            @RequestBody CreateBookingRequest request) {
        CreateBookingResponse response = bookingService.createBooking(request);
        return ResponseEntity.ok(response);
    }
}
