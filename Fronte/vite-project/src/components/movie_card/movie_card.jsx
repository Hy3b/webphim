import React from 'react';
import './movie_card.css';
import { Link } from 'react-router-dom';
import Button from '../common/Button/Button'; // Import Button Component


const MovieCard = ({movie}) => {
    return (
        <div className="movie-card">
            {/* Phần ảnh poster */}
            <div className="movie-poster">
                <img src={movie.poster} alt={movie.name} />
                
                {/* Lớp phủ đen (Overlay) */}
                <div className="overlay">
                    {/* Chỉ hiện nút MUA VÉ nếu phim đang chiếu */}
                    {movie.status === 'now_showing' && (
                        <Link to={`/movie/${movie.id}`}>
                            <Button className="btn-buy-ticket">
                                MUA VÉ
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
            {/* Phần thông tin phim */}
            <div className="movie-info">
                <h3 className="movie-name">
                    <Link to={`/movie/${movie.id}`}>{movie.name}</Link>
                </h3>
                <div className="movie-details">
                    <span className="movie-genre">{movie.genre}</span>
                    <span className="movie-duration">{movie.duration} phút</span>
                </div>
            </div>
        </div>
    );
}

export default MovieCard;