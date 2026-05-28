import React from 'react';
import { useNavigate } from 'react-router-dom';
import MovieCard from '../../../../../../shared/components/movie_card/movie_card';
import './MovieItem.css';

const MovieItem = ({ movie, dateValue }) => {
    const navigate = useNavigate();

    const handleBuyTicket = () => {
        navigate(`/movie/${movie.id}?date=${dateValue}`);
    };

    // Format date for user display
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <article className="movie-item-container">
            {/* Left side: Movie Card (Poster + Title + Details) */}
            <div className="movie-card-wrapper">
                <MovieCard movie={movie} />
            </div>

            {/* Right side: Buy Ticket CTA instead of showtimes */}
            <div className="movie-item-right" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                <div className="buy-ticket-section" style={{ width: '100%' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Mô tả
                    </h3>
                    <p style={{ 
                        fontSize: '15px', 
                        color: '#4B5563', 
                        marginBottom: '20px', 
                        lineHeight: '1.6',
                        display: '-webkit-box',
                        WebkitLineClamp: 5,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {movie.description || 'Chưa có mô tả cho bộ phim này.'}
                    </p>
                    <button 
                        onClick={handleBuyTicket} 
                        style={{ 
                            background: '#D11515', 
                            color: '#FFFFFF', 
                            border: 'none', 
                            borderRadius: '12px', 
                            padding: '12px 32px', 
                            fontSize: '16px', 
                            fontWeight: 'bold', 
                            cursor: 'pointer', 
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 14px rgba(209, 21, 21, 0.3)'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = '#b91c1c';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(209, 21, 21, 0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = '#D11515';
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(209, 21, 21, 0.3)';
                        }}
                    >
                        MUA VÉ NGAY
                    </button>
                </div>
            </div>
        </article>
    );
};

export default MovieItem;
