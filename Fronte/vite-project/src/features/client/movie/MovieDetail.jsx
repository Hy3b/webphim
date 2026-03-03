import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MovieCard from '../../../components/movie_card/movie_card.jsx';
import DateSelector from '../Schedule/components/DateSelector/DateSelector';
import ShowtimeGrid from '../../../components/common/ShowtimeGrid/ShowtimeGrid';
import { scheduleData } from '../Schedule/data/fakeData';
import './MovieDetail.css'; 

const MovieDetail = () => {
    const { id } = useParams(); // Lấy ID từ URL (ví dụ: /movie/1 -> id = 1)

    // State cho thanh Chọn Ngày (Vẫn xài data ảo ngầm định)
    const [activeTab, setActiveTab] = useState(scheduleData[0]?.day.id || 'tab-id-1');
    const days = scheduleData.map(item => item.day);
    const activeDayData = scheduleData.find(item => item.day.id === activeTab);
    const showtimes = activeDayData?.movies[0]?.showtimes || [];

    // State lưu dữ liệu phim thật
    const [movie, setMovie] = useState(null);
    const [relatedMovies, setRelatedMovies] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:8080/api/movies/${id}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                setMovie(data);
                setError(null);
            })
            .catch(err => {
                console.error("Lỗi tải phim: ", err);
                setMovie(null);
                setError("Không thể tải chi tiết phim. Vui lòng thử lại sau.");
            });

        fetch(`http://localhost:8080/api/movies`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                const list = Array.isArray(data) ? data : [];
                const filtered = list.filter(m => m.status === 'showing' && m.id.toString() !== id.toString());
                setRelatedMovies(filtered.slice(0, 3));
            })
            .catch(err => {
                console.error("Lỗi tải danh sách phim: ", err);
                setRelatedMovies([]);
            });
    }, [id]); // Đặt dependency là id để mỗi khi bấm qua phim khác, nó sẽ fetch lại data!

    if (error) {
        return <div style={{textAlign: 'center', padding: '100px', color: '#fff'}}>{error}</div>;
    }
    if (!movie) {
        return <div style={{textAlign: 'center', padding: '100px', color: '#fff'}}>Đang tải dữ liệu phim...</div>;
    }

    return (
        <div className="movie-detail-container">
            {/* Cột Trái: Nội dung chính */}
            <div className="main-content">
                {/* 1. Banner & Play Button */}
                <div className="hero-banner">
                    <img src={movie.banner} alt="Banner" />
                    <div className="play-button">▶</div>
                </div>

                {/* 2. Thông tin phim (Poster + Details) */}
                <div className="movie-info-section">
                    <div className="poster-box">
                        <img src={movie.poster} alt={movie.name} />
                    </div>
                    <div className="info-box">
                        <h1 className="movie-title">
                            {movie.name} 
                            <span className="rating-tag">{movie.ageRating}</span>
                        </h1>
                        <div className="meta-info">
                            <p><span className="meta-label">Đạo diễn:</span> {movie.director}</p>
                            <p><span className="meta-label">Diễn viên:</span> {movie.castMembers}</p>
                            <p><span className="meta-label">Thể loại:</span> {movie.genre}</p>
                            <p><span className="meta-label">Khởi chiếu:</span> {movie.releaseDate}</p>
                            <p><span className="meta-label">Thời lượng:</span> {movie.duration} phút</p>
                            <p className="rating-star">⭐ {movie.rating}/10 (132 votes)</p>
                        </div>
                    </div>
                </div>

                {/* 3. Nội dung phim */}
                <div className="movie-plot">
                    <h3 className="section-title">NỘI DUNG PHIM</h3>
                    <p>{movie.plot}</p>
                </div>

                {/* 4. Lịch chiếu */}
                {movie.status === 'showing' ? (
                    <div className="showtimes-container">
                        <h3 className="section-title">LỊCH CHIẾU</h3>
                        <DateSelector 
                            days={days} 
                            activeTab={activeTab} 
                            onTabChange={setActiveTab} 
                        />
                        
                        <ShowtimeGrid showtimes={showtimes} />
                    </div>
                ) : (
                    <div className="showtimes-container">
                        <h3 className="section-title">LỊCH CHIẾU</h3>
                        <div style={{ textAlign: 'center', padding: '40px', background: '#F9FAFB', borderRadius: '12px', marginTop: '20px' }}>
                            <p style={{ color: '#6B7280', fontSize: '16px', fontWeight: '500', margin: 0 }}>Hệ thống chưa mở bán vé cho phim này. Vui lòng quay lại sau!</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Cột Phải: Sidebar phim đang chiếu */}
            <div className="sidebar">
                <h3>PHIM ĐANG CHIẾU</h3>
                <div className="sidebar-list">
                    {relatedMovies.map(item => (
                        // Tái sử dụng MovieCard nhưng css có thể cần chỉnh lại xíu nếu muốn nhỏ hơn
                        <div key={item.id} style={{transform: 'scale(0.9)', transformOrigin: 'top left', marginBottom: '-50px'}}>
                             <MovieCard movie={item} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MovieDetail;
