import React, { useState, useEffect } from 'react';
import MovieCard from '../../../components/movie_card/movie_card.jsx'; 
import './HomePage.css';
import BannerSlider from './components/BannerSlider/BannerSlider.jsx'

const HomePage = () => {
    const [moviesData, setMoviesData] = useState([]);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        fetch('http://localhost:8080/api/movies')
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                setMoviesData(Array.isArray(data) ? data : []);
                setError(null);
            })
            .catch(err => {
                console.error("Lỗi khi tải phim từ hệ thống: ", err);
                setMoviesData([]);
                setError("Không thể tải danh sách phim. Vui lòng thử lại sau.");
            });
    }, []);

    const [activeTab, setActiveTab] = useState('showing');

    const displayedMovies = Array.isArray(moviesData)
        ? moviesData.filter(movie => movie.status === activeTab)
        : [];

    return (
        <div className="homepage-container">
            <BannerSlider movies={Array.isArray(moviesData) ? moviesData : []} />
            {error && (
                <div style={{ color: '#fff', background: '#c0392b', padding: '10px 16px', margin: '12px 0', borderRadius: 6 }}>
                    {error}
                </div>
            )}
            <div className="tab-navigation">
                <button 
                    className={`tab-btn ${activeTab === 'showing' ? 'active' : ''}`}
                    onClick={() => setActiveTab('showing')}
                >
                    PHIM ĐANG CHIẾU
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'coming' ? 'active' : ''}`}
                    onClick={() => setActiveTab('coming')}
                >
                    PHIM SẮP CHIẾU
                </button>
            </div>

            <div className="movie-grid">
                {displayedMovies.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                ))}
            </div>
        </div>
    );
};

export default HomePage;
