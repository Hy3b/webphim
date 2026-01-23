import React from 'react';
import MovieCard from './components/MovieCard/movie_card.jsx'; // Adjust path if needed

const HomePage = () => {
    return (
        <div className="home-page">
            <h1>Phim Đang Chiếu</h1>
            <div className="movie-list">
                {/* Placeholder for movie list mapping */}
                <p>Danh sách phim sẽ hiển thị ở đây</p>
            </div>
        </div>
    );
};

export default HomePage;
