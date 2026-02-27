import React from 'react';
import './ShowtimeGrid.css';

const ShowtimeGrid = ({ showtimes }) => {
    if (!showtimes || showtimes.length === 0) {
        return (
            <p style={{ marginTop: '20px', fontStyle: 'italic', color: '#666' }}>
                Không có lịch chiếu.
            </p>
        );
    }

    return (
        <div className="showtimes-grid">
            {showtimes.map((item, index) => (
                <div key={index} className="showtime-card">
                    <a href="#booking" className="showtime-btn">
                        <span className="showtime-time">{item.time}</span>
                    </a>
                    <span className="showtime-seats">{item.seats} ghế trống</span>
                </div>
            ))}
        </div>
    );
};

export default ShowtimeGrid;
