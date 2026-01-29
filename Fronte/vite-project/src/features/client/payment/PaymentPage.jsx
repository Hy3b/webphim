import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './PaymentPage.css';

const PaymentPage = () => {
    const location = useLocation();
    const { movie, selectedSeats, totalPrice } = location.state || {};

    if (!location.state) {
        return (
            <div className="payment-page error-state">
                <h2>Không tìm thấy thông tin đặt vé</h2>
                <Link to="/" className="back-btn">Quay về trang chủ</Link>
            </div>
        );
    }

    return (
        <div className="payment-page">
            <div className="payment-container">
                <div className="payment-header">
                    <h2>Thanh Toán Đơn Hàng</h2>
                    <p>Vui lòng quét mã QR bên dưới để hoàn tất thanh toán</p>
                </div>

                <div className="payment-content">
                    <div className="qr-section">
                        <div className="qr-frame">
                            {/* PLACEHOLDER FOR PAYOS QR CODE */}
                            {/* Bạn có thể thay đổi src bên dưới bằng URL từ API PayOS */}
                            <img
                                src="https://via.placeholder.com/300x300?text=QR+Code+PayOS"
                                alt="Mã QR Thanh Toán"
                                className="qr-image"
                            />
                            {/* END PLACEHOLDER */}
                        </div>
                        <div className="payment-instructions">
                            <p>Mở ứng dụng ngân hàng để quét mã QR</p>
                            <p className="timer-note">Mã QR sẽ hết hạn sau 10 phút</p>
                        </div>
                    </div>

                    <div className="order-details">
                        <h3>Thông tin vé</h3>
                        <div className="detail-row">
                            <span>Phim:</span>
                            <strong>{movie.title}</strong>
                        </div>
                        <div className="detail-row">
                            <span>Rạp:</span>
                            <span>{movie.theater}</span>
                        </div>
                        <div className="detail-row">
                            <span>Phòng chiếu:</span>
                            <span>{movie.room}</span>
                        </div>
                        <div className="detail-row">
                            <span>Suất chiếu:</span>
                            <span>{movie.showtime} - {movie.showDate}</span>
                        </div>
                        <div className="detail-row">
                            <span>Ghế:</span>
                            <span className="seats-highlight">{selectedSeats.join(', ')}</span>
                        </div>
                        <hr />
                        <div className="detail-row total">
                            <span>Tổng tiền:</span>
                            <span className="total-amount">{totalPrice.toLocaleString()}đ</span>
                        </div>

                        <button className="confirm-payment-btn" onClick={() => alert('Chức năng kiểm tra thanh toán sẽ được tích hợp sau.')}>
                            Tôi đã thanh toán
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
