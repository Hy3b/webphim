import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ShowtimeGrid.css';

const ShowtimeGrid = ({ showtimes }) => {
    const navigate = useNavigate();

    if (!showtimes || showtimes.length === 0) {
        return (
            <p style={{ marginTop: '20px', fontStyle: 'italic', color: '#666' }}>
                Không có lịch chiếu.
            </p>
        );
    }

    const handleSelectShowtime = (showtime) => {
        // Fallback id if not provided, just in case
        const showtimeId = showtime.id || '1';
        navigate(`/booking/${showtimeId}`);
    };

    return (
        <div className="showtimes-grid">
            {showtimes.map((item, index) => (
                <div key={index} className="showtime-card">
                    <button 
                        onClick={() => handleSelectShowtime(item)} 
                        className="showtime-btn"
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        <span className="showtime-time">{item.time}</span>
                        <span className="showtime-seats">{item.seats} ghế trống</span>
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ShowtimeGrid;
