# 🎬 Hướng Dẫn Nối Luồng Frontend: Lịch Chiếu ➡️ Chọn Ghế ➡️ Thanh Toán

Chào bạn, với tư cách là Senior Fullstack Developer, mình đã xem xét kiến trúc của dự án. Backend đã trang bị sẵn **Redis Distributed Lock** rất xịn sò. Việc của chúng ta ở Frontend bây giờ là kết nối 3 trang: `LichChieu` -> `BookingPage` -> `PaymentPage` sao cho trơn tru và bắt được lỗi Redis.

Dưới đây là thiết kế luồng dữ liệu (Data Flow) và các đoạn code cụ thể bằng ReactJS (Dùng `fetch` và `react-router-dom`).

---

## Bước 1: Điều hướng từ Lịch Chiếu sang Đặt Ghế (`Schedule` ➡️ `Booking`)

Khi người dùng đang ở trang Lịch Chiếu và bấm vào một **Giờ chiếu** (Suất chiếu), chúng ta phải chuyển trang sang `/booking/:id` và gửi kèm cái `showtimeId` đó đi.

**📍 Cập nhật tại Component hiển thị nút Giờ chiếu (VD: `MovieItem.jsx` hoặc `ShowtimeGrid.jsx`):**

```jsx
import { useNavigate } from "react-router-dom";

const ShowtimeButton = ({ showtime }) => {
  const navigate = useNavigate();

  const handleSelectShowtime = () => {
    // Chuyển hướng sang trang Booking kèm cái ID của suất chiếu trên thanh URL Web
    // Ví dụ: /booking/1
    navigate(`/booking/${showtime.id}`);
  };

  return (
    <button onClick={handleSelectShowtime} className="showtime-btn">
      {showtime.startTime}
    </button>
  );
};
```

---

## Bước 2: Xử lý Logic tại Trang Mua Ghế (`BookingPage.jsx`)

Trang này có 2 nhiệm vụ cốt lõi:

1. Vừa vào trang là **GET** bản đồ ghế ngay.
2. Khi người dùng tick chọn ghế rồi bấm Xong, thì **POST** lên server kèm bắt lỗi Redis 400.

**📍 Viết logic cho `BookingPage.jsx`:**

```jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BookingPage = () => {
  const { id: showtimeId } = useParams(); // Lấy ID suất chiếu từ URL xuống
  const navigate = useNavigate();

  // Khởi tạo State quản lý
  const [seats, setSeats] = useState([]); // Chứa danh sách ghế từ Backend
  const [selectedSeats, setSelectedSeats] = useState([]); // Ghế user đang click chọn
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 1. NGAY LÚC MỞ TRANG: GỌI API BẢN ĐỒ GHẾ
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/showtimes/${showtimeId}/seats`,
        );
        const data = await response.json();
        setSeats(data);
      } catch (error) {
        console.error("Lỗi khi tải ghế:", error);
      }
    };
    fetchSeats();
  }, [showtimeId]);

  // 2. HÀM CHỌN / BỎ CHỌN GHẾ TẠI GIAO DIỆN
  const toggleSeat = (seatId, isBooked) => {
    if (isBooked) return; // Nếu ghế người khác mua rồi thì cấm click

    setSelectedSeats(
      (prev) =>
        prev.includes(seatId)
          ? prev.filter((id) => id !== seatId) // Bỏ chọn
          : [...prev, seatId], // Thêm vào danh sách chọn
    );
  };

  // 3. HÀM XÁC NHẬN ĐẶT GHẾ (GỌI POST REQUEST REDIS LOCK)
  const handleConfirmBooking = async () => {
    if (selectedSeats.length === 0) {
      setErrorMessage("Vui lòng chọn ít nhất 1 ghế!");
      return;
    }

    setIsLoading(true);
    setErrorMessage(""); // Clear lỗi cũ

    try {
      const response = await fetch("http://localhost:8080/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 1, // Fix cứng user 1 trước, sau này thay bằng User đang đăng nhập (Token)
          showtimeId: parseInt(showtimeId),
          seatIds: selectedSeats,
        }),
      });

      // Nếu Backend trả về 400 (Redis block vì khách khác vừa hẫng tay trên)
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || "Ghế đã bị người khác khóa. Vui lòng chọn ghế khác!",
        );
      }

      const data = await response.json();

      // THÀNH CÔNG: Chuyển thẳng sang trang Payment
      // Dùng thuộc tính 'state' của React Router để lén truyền bookingId sang trang kia
      navigate("/payment", { state: { bookingInfo: data } });
    } catch (error) {
      // XỬ LÝ LỖI REDIS VÀ HIỆN LÊN UI
      setErrorMessage(error.message);

      // Xoá trắng các ghế đang chọn hiện tại bắt người dùng chọn lại
      setSelectedSeats([]);

      // TIP VIP: Nên gọi lại vòng lặp fetchSeats() ở đây để màn hình update
      // hiển thị các ghế nào vừa bị người ta giành mất (đổi màu đỏ)!
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="booking-container">
      <h2>Chọn Ghế Cho Suất Chiếu #{showtimeId}</h2>

      {/* Hiển thị lỗi nếu có (Blocker màu đỏ) */}
      {errorMessage && <div className="error-banner">{errorMessage}</div>}

      {/* Render Map Chỗ Ngồi (Minh họa HTML) */}
      <div className="seat-map">
        {seats.map((seat) => (
          <button
            key={seat.id}
            disabled={seat.isBooked} // NÚT TẮT NẾU BACKEND BÁO CÓ NGƯỜI ĐẶT
            className={`seat-btn 
                            ${seat.isBooked ? "booked" : ""} 
                            ${selectedSeats.includes(seat.id) ? "selected" : ""}`}
            onClick={() => toggleSeat(seat.id, seat.isBooked)}
          >
            {seat.name}
          </button>
        ))}
      </div>

      <button
        onClick={handleConfirmBooking}
        disabled={isLoading}
        className="btn-confirm"
      >
        {isLoading ? "Đang khóa ghế..." : "Xác Kế Đặt Ghế"}
      </button>
    </div>
  );
};

export default BookingPage;
```

---

## Bước 3: Đón Dữ Liệu Ở Trang Thanh Toán (`PaymentPage.jsx`)

Ở Bước 2, nhờ câu thần chú `navigate("/payment", { state: { bookingInfo: data } });`, thằng React Router sẽ gánh cục dữ liệu hóa đơn chạy ngầm sang trang Thanh toán mà URL không hề thay đổi. Việc của chúng ta ở trang Payment là giăng lưới hứng cục dữ liệu đó.

**📍 Viết logic tại `PaymentPage.jsx`:**

```jsx
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Hứng dữ liệu từ Booking truyền sang
  const bookingInfo = location.state?.bookingInfo;

  useEffect(() => {
    // Bảo vệ route: Nếu tự gõ URL webphim/payment (chưa có giỏ hàng) -> Đuổi về trang chủ
    if (!bookingInfo) {
      alert("Bạn chưa chọn ghế nào!");
      navigate("/");
    }
  }, [bookingInfo, navigate]);

  if (!bookingInfo) return null; // Ẩn giao diện trong lúc bị đuổi về

  return (
    <div className="payment-container">
      <h1>Thanh Toán Đơn Hàng</h1>

      <div className="invoice-box">
        <p>
          <strong>Mã Đơn Hàng:</strong> #{bookingInfo.bookingId}
        </p>
        <p>Hệ thống đang giữ chỗ cho bạn. Vui lòng thanh toán trong 10 phút!</p>

        {/* 
                  Ở đây bạn có thể hiển thị mã QR SePay chuyển khoản.
                  Dựa vào cái bookingInfo.bookingId để gọi các API Payment Backend tiếp theo.
                */}
        <button className="btn-pay">Tiến Hành Thanh Toán</button>
      </div>
    </div>
  );
};

export default PaymentPage;
```

### 🎯 Tóm Gọn Bí Kíp (Best Practices):

1. **Truyền số ẩn (State Transfer):** Tuyệt đối không nhét `bookingId` lên thanh URL `/payment/102` (khách hàng sửa URL sẽ thành hổng bảo mật). Hãy dùng mồi lén `useLocation().state` của React Router.
2. **Handle Redis Exception tinh tế:** Khi Redis Backend quăng lỗi trùng giữ ghế `400 Bad Request`, bạn **phải xoá `selectedSeats` của người đó** đi, và bắt Frontend gọi lại API GET ghế để tải lại các ghế màu đỏ do khách khác vừa mua. Điều này giúp UX mượt mà, khách sẽ thốt lên _"Ồ, hụt ghế rồi, người ta vừa mua tranh xong"_.
3. **Double Click Prevention:** Luôn có `setIsLoading(true)` chọc vào nút _"Xác Nhận Đặt Ghế"_ (`disabled={isLoading}`). Thao tác này chặn khách hàng bấm loạn xã ngầu 5 lần / giây gây kẹt Server.
