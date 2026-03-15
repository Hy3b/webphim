import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import './PaymentPage.css';

const POLL_INTERVAL_MS = 5000; // kiểm tra mỗi 5 giây

const PaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { movie, selectedSeats, totalPrice, bookingId, orderCode: stateOrderCode, bookingInfo } = location.state || {};

    // Bảo vệ route như hướng dẫn: Nếu không có state -> Đuổi về trang chủ
    useEffect(() => {
        if (!location.state) {
            alert("Bạn chưa chọn ghế nào!");
            navigate("/");
        }
    }, [location.state, navigate]);

    // Dùng orderCode từ state (do BookingService tạo = "DH{id}") hoặc fallback random
    const orderCode = stateOrderCode ?? `DONHANG_${Math.floor(Math.random() * 100000)}`;

    // bookingId thật từ DB (được trả về sau POST /api/bookings)
    const resolvedBookingId = bookingId ?? null;

    // Lấy config SePay từ biến môi trường Vite (.env)
    // Lưu ý: Trong Vite, các biến cần có tiền tố VITE_ để truy cập được ở frontend bằng import.meta.env
    const sepayAccount = import.meta.env.VITE_SEPAY_BANK_ACCOUNT;
    const sepayBank = import.meta.env.VITE_SEPAY_BANK_NAME;

    const qrUrl = `https://qr.sepay.vn/img?acc=${sepayAccount}&bank=${sepayBank}&amount=${totalPrice}&des=${orderCode}`;

    const [pollStatus, setPollStatus] = useState('idle');   // idle | polling | paid | error
    const [dotCount, setDotCount] = useState(0);
    const intervalRef = useRef(null);
    const dotRef = useRef(null);

    // Animation cho "Đang kiểm tra..."
    useEffect(() => {
        if (pollStatus === 'polling') {
            dotRef.current = setInterval(() => setDotCount(d => (d + 1) % 4), 500);
        } else {
            clearInterval(dotRef.current);
        }
        return () => clearInterval(dotRef.current);
    }, [pollStatus]);

    // Polling: gọi API mỗi 5 giây
    const startPolling = () => {
        if (intervalRef.current) return;
        setPollStatus('polling');

        intervalRef.current = setInterval(async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/payment/status/${orderCode}`);
                if (!res.ok) throw new Error('Lỗi kết nối backend');
                const data = await res.json();

                if (data.paid) {
                    clearInterval(intervalRef.current);
                    setPollStatus('paid');

                    navigate('/ticket', {
                        state: {
                            movie,
                            selectedSeats,
                            totalPrice,
                            orderCode,
                            bookingId: resolvedBookingId,
                            paidAt: new Date().toISOString()
                        }
                    });
                } else if (data.status === 'expired' || data.status === 'cancelled') {
                    clearInterval(intervalRef.current);
                    setPollStatus('expired');
                }
            } catch {
                // Giữ polling, không dừng vì lỗi mạng tạm thời
            }
        }, POLL_INTERVAL_MS);
    };

    // Dọn interval khi unmount
    useEffect(() => () => clearInterval(intervalRef.current), []);

    if (!location.state) return null; // Ẩn giao diện trong lúc bị đuổi về

    return (
        <div className="payment-page">
            <div className="payment-container">
                <div className="payment-header">
                    <h2>Thanh Toán Đơn Hàng</h2>
                    <p>Quét mã QR rồi bấm <strong>"Tôi đã thanh toán"</strong> để hệ thống xác nhận tự động</p>
                </div>

                <div className="payment-content">
                    {/* QR Code */}
                    <div className="qr-section">
                        <div className="qr-frame" style={{ position: 'relative' }}>
                            <img src={qrUrl} alt="Mã QR Thanh Toán SePay" className="qr-image" style={pollStatus === 'expired' ? { opacity: 0.2, filter: 'grayscale(100%)' } : {}} />
                            {pollStatus === 'expired' && (
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#dc3545', fontWeight: 'bold', border: '3px solid #dc3545', padding: '10px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.95)', zIndex: 10, fontSize: '1.5rem', whiteSpace: 'nowrap', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                    ĐÃ HẾT HẠN
                                </div>
                            )}
                        </div>
                        <div className="payment-instructions">
                            <p>Mở ứng dụng ngân hàng để quét mã QR</p>
                            <p className="timer-note">
                                Nội dung chuyển khoản: <strong>{orderCode}</strong>
                            </p>
                        </div>
                    </div>

                    {/* Chi tiết đơn hàng */}
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

                        {/* Nút kiểm tra thanh toán */}
                        <button
                            id="confirm-payment-btn"
                            className={`confirm-payment-btn ${pollStatus === 'polling' ? 'polling' : pollStatus === 'expired' ? 'expired' : ''}`}
                            onClick={startPolling}
                            disabled={pollStatus === 'polling' || pollStatus === 'paid' || pollStatus === 'expired'}
                            style={pollStatus === 'expired' ? { backgroundColor: '#dc3545', cursor: 'not-allowed', color: '#fff', border: 'none' } : {}}
                        >
                            {pollStatus === 'polling'
                                ? `Đang xác nhận${'.'.repeat(dotCount)}`
                                : pollStatus === 'paid'
                                    ? '✅ Đã thanh toán!'
                                    : pollStatus === 'expired'
                                        ? '❌ Hết thời gian giữ ghế'
                                        : 'Tôi đã thanh toán'}
                        </button>

                        {pollStatus === 'polling' && (
                            <p className="poll-hint">
                                Hệ thống đang tự động kiểm tra mỗi 5 giây. Vui lòng chờ...
                            </p>
                        )}

                        {pollStatus === 'expired' && (
                            <div className="poll-hint error" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <p style={{ color: '#dc3545', margin: 0 }}>
                                    <strong>Phiên giao dịch đã kết thúc do quá thời gian thanh toán.</strong>
                                </p>
                                <button
                                    onClick={() => navigate('/')}
                                    style={{ padding: '10px 24px', backgroundColor: '#fff', border: '2px solid #dc3545', color: '#dc3545', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.2s ease-in-out' }}
                                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#dc3545'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#dc3545'; }}
                                >
                                    Quay lại trang chủ đặt vé
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
