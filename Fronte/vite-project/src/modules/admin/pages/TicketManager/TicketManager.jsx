import React, { useState, useEffect } from 'react';
import { 
    Ticket, 
    Film, 
    Calendar, 
    Armchair, 
    ChevronRight, 
    CheckCircle2, 
    AlertCircle,
    ArrowLeft,
    Clock,
    MapPin,
    CreditCard
} from 'lucide-react';
import api from '../../../../services/api';
import { adminTicketApi } from '../../../../services/adminTicketApi';
import SeatMap from '../../../client/pages/booking/SeatMap/SeatMap';
import './TicketManager.css';

const TicketManager = () => {
    const [step, setStep] = useState(1);
    const [movies, setMovies] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [showtimes, setShowtimes] = useState([]);
    const [selectedShowtime, setSelectedShowtime] = useState(null);
    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successData, setSuccessData] = useState(null);

    // Fetch movies on mount
    useEffect(() => {
        const fetchMovies = async () => {
            setLoading(true);
            try {
                const res = await api.get('/movies?status=showing');
                setMovies(res.data);
            } catch (_err) {
                setError('Không thể tải danh sách phim.');
            } finally {
                setLoading(false);
            }
        };
        fetchMovies();
    }, []);

    // Step 1 -> Step 2: Handle Movie Selection
    const handleSelectMovie = async (movie) => {
        setSelectedMovie(movie);
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/showtimes/movie/${movie.id}`);
            setShowtimes(res.data);
            setStep(2);
        } catch (_err) {
            setError('Không thể tải suất chiếu cho phim này.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2 -> Step 3: Handle Showtime Selection
    const handleSelectShowtime = async (showtime) => {
        // Prevent selecting past showtimes
        if (new Date(showtime.startTime) <= new Date()) {
            setError('Suất chiếu đã hết thời gian và không thể tạo vé.');
            return;
        }
        setSelectedShowtime(showtime);
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/showtimes/${showtime.showtimeId}/seats`);
            const mappedSeats = res.data.map(seat => ({
                id: seat.rowName + seat.seatNumber,
                row: seat.rowName,
                number: seat.seatNumber.toString().padStart(2, '0'),
                status: seat.status === 'AVAILABLE' ? 'available' : seat.status === 'LOCKED' ? 'holding' : 'booked',
                price: Number(seat.price),
                type: seat.seatTypeName.toLowerCase()
            }));
            setSeats(mappedSeats);
            setStep(3);
        } catch (_err) {
            setError('Không thể tải sơ đồ ghế.');
        } finally {
            setLoading(false);
        }
    };

    // Handle Seat Selection
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

    // Step 3 -> Step 4: Handle Confirmation
    const handleConfirmBooking = async () => {
        if (selectedSeats.length === 0) {
            setError('Vui lòng chọn ít nhất 1 ghế.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const payload = {
                showtimeId: selectedShowtime.showtimeId,
                seatIds: selectedSeats,
                paymentMethod: 'CASH'
            };
            const res = await adminTicketApi.bookAtCounter(payload);
            setSuccessData(res.data);
            setStep(4);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi tạo vé.');
        } finally {
            setLoading(false);
        }
    };

    const resetFlow = () => {
        setStep(1);
        setSelectedMovie(null);
        setSelectedShowtime(null);
        setSelectedSeats([]);
        setSuccessData(null);
        setError(null);
    };

    const handlePrint = () => {
        const orderCode = successData?.orderCode || 'UNKNOWN';
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(orderCode)}`;
        const showtimeStr = selectedShowtime
            ? new Date(selectedShowtime.startTime).toLocaleString('vi-VN')
            : '';
        const totalStr = calculateTotal().toLocaleString() + 'đ';
        const seatsStr = selectedSeats.join(', ');

        const printContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Vé Xem Phim - ${orderCode}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #fff;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 24px;
    }
    .ticket {
      width: 340px;
      border: 2px dashed #333;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.12);
    }
    .ticket-header {
      background: #1a1a2e;
      color: #fff;
      text-align: center;
      padding: 16px 12px 12px;
    }
    .ticket-header h1 { font-size: 20px; letter-spacing: 2px; }
    .ticket-header p { font-size: 11px; opacity: 0.7; margin-top: 4px; }
    .ticket-body { padding: 20px 24px; }
    .movie-title {
      font-size: 17px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 12px;
      text-align: center;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
      color: #444;
    }
    .row .label { font-weight: 600; color: #222; }
    .divider {
      border: none;
      border-top: 1px dashed #ccc;
      margin: 14px 0;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 15px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 4px;
    }
    .status-badge {
      display: inline-block;
      background: #22c55e;
      color: #fff;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      letter-spacing: 1px;
    }
    .qr-section {
      text-align: center;
      padding: 16px 0 20px;
    }
    .qr-section img {
      width: 180px;
      height: 180px;
      border: 4px solid #1a1a2e;
      border-radius: 8px;
    }
    .qr-label {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
    }
    .order-code {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    .ticket-footer {
      background: #f5f5f5;
      text-align: center;
      padding: 10px;
      font-size: 11px;
      color: #888;
      border-top: 1px dashed #ccc;
    }
    @media print {
      body { padding: 0; }
      .ticket { box-shadow: none; border-color: #999; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="ticket-header">
      <h1>🎬 CINEMA</h1>
      <p>Vé Xem Phim Chính Thức</p>
    </div>
    <div class="ticket-body">
      <div class="movie-title">${selectedMovie?.title || ''}</div>
      <div class="row"><span class="label">Suất chiếu:</span><span>${showtimeStr}</span></div>
      <div class="row"><span class="label">Phòng:</span><span>${selectedShowtime?.roomName || ''}</span></div>
      <div class="row"><span class="label">Ghế:</span><span>${seatsStr}</span></div>
      <hr class="divider" />
      <div class="total-row"><span>Tổng tiền:</span><span>${totalStr}</span></div>
      <div class="row"><span class="label">Thanh toán:</span><span><span class="status-badge">ĐÃ THANH TOÁN</span></span></div>
    </div>
    <div class="qr-section">
      <img src="${qrUrl}" alt="QR Code" />
      <div class="qr-label">Mã đơn hàng</div>
      <div class="order-code">${orderCode}</div>
    </div>
    <div class="ticket-footer">Cảm ơn quý khách! Vui lòng giữ vé để đối chiếu.</div>
  </div>
  <script>
    window.onload = function() {
      window.focus();
      window.print();
      setTimeout(function() { window.close(); }, 1000);
    };
  <\/script>
</body>
</html>`;

        const printWin = window.open('', '_blank', 'width=420,height=650,scrollbars=no,menubar=no,toolbar=no');
        if (printWin) {
            printWin.document.write(printContent);
            printWin.document.close();
        } else {
            alert('Vui lòng cho phép popup để in vé!');
        }
    };

    const renderSteps = () => (
        <div className="tm-steps">
            {[1, 2, 3].map(i => (
                <div key={i} className={`tm-step ${step >= i ? 'active' : ''} ${step > i ? 'completed' : ''}`}>
                    <div className="tm-step-number">
                        {step > i ? <CheckCircle2 size={16} /> : i}
                    </div>
                    <div className="tm-step-label">
                        {i === 1 ? 'Chọn Phim' : i === 2 ? 'Suất Chiếu' : 'Chọn Ghế'}
                    </div>
                    {i < 3 && <div className="tm-step-line" />}
                </div>
            ))}
        </div>
    );

    return (
        <div className="tm-container">
            <div className="tm-header">
                <div className="tm-header-left">
                    <Ticket className="tm-icon" />
                    <div>
                        <h1>Tạo Vé Tại Quầy</h1>
                        <p>Bán vé và thu tiền trực tiếp cho khách hàng</p>
                    </div>
                </div>
                {step > 1 && step < 4 && (
                    <button className="tm-btn-back" onClick={() => setStep(step - 1)}>
                        <ArrowLeft size={16} /> Quay lại
                    </button>
                )}
            </div>

            {renderSteps()}

            {error && (
                <div className="tm-error-banner">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {loading && <div className="tm-loader">Đang xử lý...</div>}

            <div className="tm-content">
                {/* STEP 1: SELECT MOVIE */}
                {step === 1 && (
                    <div className="tm-movie-grid">
                        {movies.map(movie => (
                            <div key={movie.id} className="tm-movie-card" onClick={() => handleSelectMovie(movie)}>
                                <div className="tm-movie-poster">
                                    <img src={movie.poster} alt={movie.title} />
                                    <div className="tm-movie-overlay">
                                        <button className="tm-btn-select">Chọn Phim <ChevronRight size={16} /></button>
                                    </div>
                                </div>
                                <div className="tm-movie-info">
                                    <h3>{movie.title}</h3>
                                    <p>{movie.genre} • {movie.duration} phút</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* STEP 2: SELECT SHOWTIME */}
                {step === 2 && (
                    <div className="tm-showtime-view">
                        <div className="tm-selected-movie-info">
                            <img src={selectedMovie.poster} alt={selectedMovie.title} />
                            <div>
                                <h2>{selectedMovie.title}</h2>
                                <p>{selectedMovie.genre} | {selectedMovie.duration} phút</p>
                            </div>
                        </div>
                        
                        <div className="tm-showtime-list">
                            <h3>Chọn suất chiếu</h3>
                            {showtimes.filter(st => new Date(st.startTime) > new Date()).length === 0 ? (
                                <p className="tm-empty">Không có suất chiếu nào khả dụng.</p>
                            ) : (
                                <div className="tm-showtime-grid">
                                    {showtimes
                                        .filter(st => new Date(st.startTime) > new Date())
                                        .map(st => (
                                            <button
                                                key={st.showtimeId}
                                                className="tm-showtime-item"
                                                onClick={() => handleSelectShowtime(st)}
                                            >
                                                <div className="tm-st-time">
                                                    <Clock size={16} />
                                                    <span>{new Date(st.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div className="tm-st-details">
                                                    <span>{new Date(st.startTime).toLocaleDateString('vi-VN')}</span>
                                                    <span className="tm-st-room">{st.roomName}</span>
                                                </div>
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 3: SELECT SEATS */}
                {step === 3 && (
                    <div className="tm-seat-view">
                        <div className="tm-seat-layout">
                            <SeatMap 
                                seats={seats}
                                selectedSeats={selectedSeats}
                                onSeatSelect={handleSeatSelect}
                            />
                        </div>
                        
                        <div className="tm-booking-summary">
                            <div className="tm-summary-card">
                                <h3>Thông tin vé</h3>
                                <div className="tm-summary-item">
                                    <Film size={16} />
                                    <span>{selectedMovie.title}</span>
                                </div>
                                <div className="tm-summary-item">
                                    <Clock size={16} />
                                    <span>{new Date(selectedShowtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(selectedShowtime.startTime).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="tm-summary-item">
                                    <MapPin size={16} />
                                    <span>{selectedShowtime.roomName}</span>
                                </div>
                                <div className="tm-summary-item">
                                    <Armchair size={16} />
                                    <span>{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn ghế'}</span>
                                </div>
                                
                                <div className="tm-divider" />
                                
                                <div className="tm-total">
                                    <span>Tổng cộng:</span>
                                    <span className="tm-price">{calculateTotal().toLocaleString()}đ</span>
                                </div>

                                <button 
                                    className="tm-btn-confirm" 
                                    disabled={selectedSeats.length === 0 || loading}
                                    onClick={handleConfirmBooking}
                                >
                                    <CreditCard size={18} />
                                    Xác nhận & Thu tiền mặt
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 4: SUCCESS */}
                {step === 4 && (
                    <div className="tm-success-view">
                        <div className="tm-success-card">
                            <div className="tm-success-icon">
                                <CheckCircle2 size={64} />
                            </div>
                            <h2>Đặt vé thành công!</h2>
                            <p>Mã đơn hàng: <strong>{successData?.orderCode}</strong></p>
                            
                            <div className="tm-success-details">
                                <div className="tm-detail-row">
                                    <span>Phim:</span>
                                    <span>{selectedMovie.title}</span>
                                </div>
                                <div className="tm-detail-row">
                                    <span>Suất chiếu:</span>
                                    <span>{new Date(selectedShowtime.startTime).toLocaleString('vi-VN')}</span>
                                </div>
                                <div className="tm-detail-row">
                                    <span>Phòng:</span>
                                    <span>{selectedShowtime.roomName}</span>
                                </div>
                                <div className="tm-detail-row">
                                    <span>Ghế:</span>
                                    <span>{selectedSeats.join(', ')}</span>
                                </div>
                                <div className="tm-detail-row">
                                    <span>Tổng tiền:</span>
                                    <span className="tm-success-price">{calculateTotal().toLocaleString()}đ</span>
                                </div>
                                <div className="tm-detail-row">
                                    <span>Trạng thái:</span>
                                    <span className="tm-badge-paid">ĐÃ THANH TOÁN (CASH)</span>
                                </div>
                            </div>

                            <div className="tm-success-actions">
                                <button className="tm-btn-print" onClick={handlePrint}>
                                    In hóa đơn / vé
                                </button>
                                <button className="tm-btn-new" onClick={resetFlow}>
                                    Tạo đơn mới
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketManager;
