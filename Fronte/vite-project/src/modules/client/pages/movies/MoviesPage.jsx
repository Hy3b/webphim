import React, { useState, useEffect } from 'react';
import MovieCard from '../../../../shared/components/movie_card/movie_card.jsx';
import './MoviesPage.css';

const MoviesPage = () => {
    // 1. Dữ liệu từ cơ sở dữ liệu
    const [moviesData, setMoviesData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Gọi API để lấy danh sách phim
    useEffect(() => {
        fetch('/api/movies')
            .then(res => res.json())
            .then(data => {
                setMoviesData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Lỗi khi tải phim: ", err);
                setLoading(false);
            });
    }, []);

    // 2. State quản lý Tab và Tìm kiếm
    const [activeTab, setActiveTab] = useState('showing');
    const [searchQuery, setSearchQuery] = useState('');

    // 3. Xử lý tìm kiếm và lọc phim
    const displayedMovies = moviesData.filter(movie => {
        // Lọc theo Tab (Đang chiếu / Sắp chiếu)
        const matchesTab = movie.status === activeTab;
        
        // Lọc theo từ khóa tìm kiếm (so khớp chữ không phân biệt hoa/thường)
        const titleToSearch = (movie.name || movie.title || "").toLowerCase();
        const matchesSearch = titleToSearch.includes(searchQuery.toLowerCase().trim());
        
        return matchesTab && matchesSearch;
    });

    return (
        <div className="moviespage-container">
            <div className="movies-header">
                {/* Thanh Tab chuyển đổi */}
                <div className="movies-tab-navigation">
                    <button
                        className={`movies-tab-btn ${activeTab === 'showing' ? 'active' : ''}`}
                        onClick={() => setActiveTab('showing')}
                    >
                        PHIM ĐANG CHIẾU
                    </button>
                    <button
                        className={`movies-tab-btn ${activeTab === 'coming' ? 'active' : ''}`}
                        onClick={() => setActiveTab('coming')}
                    >
                        PHIM SẮP CHIẾU
                    </button>
                </div>

                {/* Thanh tìm kiếm */}
                <div className="movies-search-container">
                    <input 
                        type="text" 
                        className="movies-search-input"
                        placeholder="Tìm kiếm phim theo tên..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Danh sách phim */}
            <div className="movies-grid">
                {loading ? (
                    <div className="no-movies-found">Đang tải danh sách phim...</div>
                ) : displayedMovies.length > 0 ? (
                    displayedMovies.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} />
                    ))
                ) : (
                    <div className="no-movies-found">
                        Không tìm thấy phim nào khớp với "{searchQuery}".
                    </div>
                )}
            </div>
        </div>
    );
};

export default MoviesPage;
