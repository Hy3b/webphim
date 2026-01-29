import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SeatMap from '../SeatMap/SeatMap';
import BookingSummary from '../BookingSummary/BookingSummary';
import './BookingPage.css';

const BookingPage = () => {
    const { id } = useParams();
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [seats, setSeats] = useState([]);
    const [movie, setMovie] = useState(null);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

    // Countdown Timer Logic
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Mock data initialization
    useEffect(() => {
        // Enhanced Mock movie data
        setMovie({
            id: id,
            title: "Yêu quái vùng Yên Lãng",
            originalTitle: "Yeu Quai Vung Yen Lang",
            poster: "https://image.tmdb.org/t/p/w600_and_h900_face/5Xtwoju2GOlgXRkEtPO2BA5WNTw.jpg", // Valid placeholder URL from BHD or similar
            showtime: "23:00",
            showDate: "26/01/2026",
            theater: "Beta TRMall Phú Quốc",
            room: "Rạp 4",
            tags: ["Tâm lý", "Gia đình"],
            duration: "111 phút",
            type: "2D Phụ đề",
            ageRating: "T13 - Phim được phổ biến đến người xem từ đủ 13 tuổi trở lên"
        });

        // Mock seats data (Rows A-H, 14 seats per row roughly to create a grid)
        const mockSeats = [];
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

        rows.forEach((row, rowIndex) => {
            for (let i = 1; i <= 14; i++) {
                // Randomly mark some seats as booked
                const isBooked = Math.random() < 0.1;
                // Simple price logic: Back rows expensive
                const price = rowIndex > 5 ? 70000 : 50000;

                mockSeats.push({
                    id: `${row}${i}`,
                    row: row,
                    number: i.toString().padStart(2, '0'), // 01, 02...
                    status: isBooked ? 'booked' : 'available',
                    price: price,
                    type: 'standard' // standard or vip
                });
            }
        });
        setSeats(mockSeats);
    }, [id]);

    const handleSeatSelect = (seat) => {
        setSelectedSeats(prev => {
            if (prev.includes(seat.id)) {
                return prev.filter(s => s !== seat.id);
            } else {
                return [...prev, seat.id];
            }
        });
    };

    const calculateTotal = () => {
        return selectedSeats.reduce((total, seatId) => {
            const seat = seats.find(s => s.id === seatId);
            return total + (seat ? seat.price : 0);
        }, 0);
    };

    const navigate = useNavigate();

    const handleConfirmBooking = () => {
        // Navigate to payment page with booking details
        navigate('/payment', {
            state: {
                movie: movie,
                selectedSeats: selectedSeats,
                totalPrice: calculateTotal()
            }
        });
    };

    if (!movie) return <div className="loading-screen">Loading...</div>;

    return (
        <div className="booking-page">
            <div className="booking-header-container">
                <div className="breadcrumb">
                    <Link to="/">Trang chủ</Link> &gt; <span>Đặt vé</span> &gt; <span className="current-page">{movie.title}</span>
                </div>
            </div>

            <div className="warning-banner">
                Theo quy định của cục điện ảnh, phim này không dành cho khán giả dưới 13 tuổi.
            </div>

            <div className="booking-main-layout">
                <div className="seat-selection-area">
                    <SeatMap
                        seats={seats}
                        selectedSeats={selectedSeats}
                        onSeatSelect={handleSeatSelect}
                    />

                    <div className="bottom-bar-info">
                        <div className="legend-group">
                            {/* Legend moved to SeatMap or kept here, let's keep it simple here or handled in SeatMap */}
                        </div>
                        <div className="total-time-info">
                            <div className="info-block">
                                <span className="label">Ghế thường</span>
                            </div>
                            <div className="info-block">
                                <span className="label">Ghế VIP</span>
                            </div>
                        </div>
                        <div className="price-timer-container">
                            <div className="total-price-block">
                                <span className="label">Tổng tiền</span>
                                <span className="value">{calculateTotal().toLocaleString()} vnđ</span>
                            </div>
                            <div className="timer-block">
                                <span className="label">Thời gian còn lại</span>
                                <span className="value">{formatTime(timeLeft)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="booking-sidebar-area">
                    <BookingSummary
                        movie={movie}
                        selectedSeats={selectedSeats}
                        totalPrice={calculateTotal()}
                        onConfirm={handleConfirmBooking}
                    />
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
