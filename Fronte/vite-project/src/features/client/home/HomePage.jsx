import React, { useState } from 'react';
import MovieCard from '../../../components/movie_card/movie_card.jsx'; // Đảm bảo đường dẫn import đúng
import './HomePage.css';
import BannerSlider from './components/BannerSlider/BannerSlider.jsx'
// Chúng ta sẽ tạo file này ngay sau đây để trang trí
const HomePage = () => {
    // 1. Dữ liệu giả (Dummy Data)
    const moviesData = [
        {
            id: 1,
            name: "MAI",
            poster: "https://upload.wikimedia.org/wikipedia/vi/8/87/Mai_2024_poster.jpg", // Link ảnh mạng tạm thời
            genre: "Tâm lý, Tình cảm",
            duration: 131,
            status: "now_showing",
            banner: "link_anh_ngang..." // Phim đang chiếu
        },
        {
            id: 2,
            name: "DUNE: PART TWO",
            poster: "https://upload.wikimedia.org/wikipedia/en/5/52/Dune_Part_Two_poster.jpg",
            genre: "Hành động, Viễn tưởng",
            duration: 166,
            status: "now_showing",
            banner: "link_anh_ngang..."
        },
        {
            id: 3,
            name: "KUNG FU PANDA 4",
            poster: "https://upload.wikimedia.org/wikipedia/vi/8/82/Kung_Fu_Panda_4_poster.jpg",
            genre: "Hoạt hình, Hài",
            duration: 94,
            status: "coming_soon",
            banner: "link_anh_ngang..." // Phim sắp chiếu
        },
        {
            id: 4,
            name: "GODZILLA X KONG",
            poster: "https://upload.wikimedia.org/wikipedia/vi/a/a2/Godzilla_x_Kong_The_New_Empire_poster.jpg",
            genre: "Hành động, Quái vật",
            duration: 115,
            status: "coming_soon",
            banner: "link_anh_ngang..."
        },
        // Bạn có thể thêm nhiều phim nữa vào đây
    ];

    // 2. Tab State: Quản lý xem đang chọn Tab nào
    const [activeTab, setActiveTab] = useState('now_showing');

    // 3. Lọc danh sách phim theo Tab đang chọn
    const displayedMovies = moviesData.filter(movie => movie.status === activeTab);

    return (
        <div className="homepage-container">
            {/* Thanh Tab chuyển đổi */}
            <BannerSlider movies={moviesData} />
            <div className="tab-navigation">
                <button 
                    className={`tab-btn ${activeTab === 'now_showing' ? 'active' : ''}`}
                    onClick={() => setActiveTab('now_showing')}
                >
                    PHIM ĐANG CHIẾU
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'coming_soon' ? 'active' : ''}`}
                    onClick={() => setActiveTab('coming_soon')}
                >
                    PHIM SẮP CHIẾU
                </button>
            </div>

            {/* Danh sách phim */}
            <div className="movie-grid">
                {displayedMovies.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                ))}
            </div>
        </div>
    );
};

export default HomePage;