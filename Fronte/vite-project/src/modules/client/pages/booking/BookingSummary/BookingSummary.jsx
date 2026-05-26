import React from 'react';
import './BookingSummary.css';

const BookingSummary = ({ movie, selectedSeats, totalPrice, onConfirm, isLoading, error, user, pointsToUse, setPointsToUse }) => {
    return (
        <div className="booking-summary">
            <div className="summary-header">
                <img src={movie.moviePoster || movie.poster} alt={movie.title} className="movie-poster" />
                <div className="movie-details">
                    <h3 className="movie-title">{movie.title}</h3>
                    <div className="movie-format">{movie.type}</div>
                </div>
            </div>

            <div className="summary-body">
                <div className="info-row">
                    <span className="info-label">Thể loại</span>
                    <span className="info-value">{movie.tags ? movie.tags.join(', ') : 'N/A'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Thời lượng</span>
                    <span className="info-value">{movie.duration}</span>
                </div>
                <hr className="divider" />

                <div className="info-row">
                    <span className="info-label">Rạp chiếu</span>
                    <span className="info-value bold">{movie.theater}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Ngày chiếu</span>
                    <span className="info-value">{movie.showDate}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Giờ chiếu</span>
                    <span className="info-value">{movie.showtime}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Phòng chiếu</span>
                    <span className="info-value">{movie.room}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Ghế ngồi</span>
                    <span className="info-value seats-list">
                        {selectedSeats.length > 0 ? selectedSeats.join(', ') : '-'}
                    </span>
                </div>

                <hr className="divider" />
                {user && user.points > 0 && (
                    <div className="info-row points-row" style={{ flexDirection: 'column', alignItems: 'flex-start', marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '5px' }}>
                            <span className="info-label">Dùng điểm tích lũy</span>
                            <span className="info-value">(Tối đa: {user.points})</span>
                        </div>
                        <input 
                            type="number" 
                            min="0" 
                            max={user.points} 
                            value={pointsToUse} 
                            onChange={(e) => {
                                let val = parseInt(e.target.value) || 0;
                                if (val > user.points) val = user.points;
                                // Không cho nhập điểm quá tổng tiền (1đ = 1000vnd)
                                const maxPointsForPrice = Math.ceil(totalPrice / 1000);
                                if (val > maxPointsForPrice) val = maxPointsForPrice;
                                setPointsToUse(val);
                            }}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f9f9f9', color: '#000' }}
                        />
                        {pointsToUse > 0 && (
                            <div style={{ color: '#d32f2f', fontWeight: 'bold', marginTop: '5px', alignSelf: 'flex-end' }}>
                                - {(pointsToUse * 1000).toLocaleString()} đ
                            </div>
                        )}
                    </div>
                )}

                <button
                    className={`continue-btn ${isLoading ? 'loading' : ''}`}
                    disabled={selectedSeats.length === 0 || isLoading}
                    onClick={onConfirm}
                >
                    {isLoading ? 'Đang xử lý...' : 'TIẾP TỤC'}
                </button>

                {error && (
                    <p className="booking-error-msg">{error}</p>
                )}
            </div>
        </div>
    );
};

export default BookingSummary;
