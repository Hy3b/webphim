package team.api.dto.response.admin;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonFormat;

@Getter
@Builder
public class ScanResultResponse {
    private String orderCode;
    
    // Sử dụng Enum thay vì String để tránh lỗi type nhầm
    private OrderStatus status; 

    private String movieTitle;
    
    // Dùng đối tượng Date/Time và để Jackson tự format khi serialize ra JSON
    @JsonFormat(pattern = "dd/MM/yyyy HH:mm")
    private LocalDateTime showtime; 
    
    private String room;
    private BigDecimal totalAmount;
    
    // Bổ sung thông tin khách hàng để nhân viên dễ đối chiếu
    private String customerName;
    private String customerPhone; 

    private List<SeatInfo> seats;
    
    // Tên biến rõ nghĩa hơn: tất cả ghế đã được check-in chưa?
    private Boolean isFullyCheckedIn; 

    @Getter
    @Builder
    public static class SeatInfo {
        private String seatLabel;
        private String seatType;
        private BigDecimal price;
        private Boolean isCheckedIn; // Đổi thành isCheckedIn theo chuẩn naming convention của Boolean
    }

    // Nên tách ra file riêng, nhưng để minh họa tôi viết chung ở đây
    public enum OrderStatus {
        PENDING, PAID, CANCELLED, EXPIRED, REFUNDED
    }
}
  