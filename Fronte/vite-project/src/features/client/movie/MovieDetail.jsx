import React from 'react';
import { useParams } from 'react-router-dom';
import MovieCard from '../../../components/movie_card/movie_card.jsx';
import './MovieDetail.css'; 

const MovieDetail = () => {
    const { id } = useParams(); // Lấy ID từ URL (ví dụ: /movie/1 -> id = 1)

    // Dữ liệu giả mô phỏng 1 bộ phim chi tiết
    const movie = {
        id: id,
        name: "ĐỒI CÂM LẶNG: ÁC MỘNG TRONG SƯƠNG",
        originalName: "Return to Silent Hill",
        poster: "https://upload.wikimedia.org/wikipedia/vi/8/87/Mai_2024_poster.jpg", // Tạm dùng ảnh cũ
        banner: "https://homepage.momocdn.net/img/momo-upload-api-240412154407-889899.jpg", // Ảnh banner ngang
        genre: "Kinh Dị, Tâm Lý",
        duration: 106,
        releaseDate: "22/01/2026",
        director: "Christophe Gans",
        cast: "Radha Mitchell, Laurie Holden, Sean Bean",
        ageRating: "T18",
        rating: 7.0,
        plot: "Sau khi nhận được lá thư bí ẩn từ người bạn gái đã mất, James Sunderland cảm thấy bị thu hút bởi thị trấn Silent Hill và quyết định đặt chân đến đó. Một thị trấn từng quen thuộc nay đã chìm trong bóng tối..."
    };

    // Dữ liệu giả cho Sidebar
    const relatedMovies = [
        { id: 2, name: "BỐ GIÀ TRỞ LẠI", poster: "https://upload.wikimedia.org/wikipedia/vi/8/87/Mai_2024_poster.jpg", genre: "Hành động", duration: 120, status: 'now_showing' },
        { id: 3, name: "TIỂU YÊU QUÁI", poster: "https://upload.wikimedia.org/wikipedia/vi/8/87/Mai_2024_poster.jpg", genre: "Hoạt Hình", duration: 90, status: 'now_showing' }
    ];

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
                            <p><span className="meta-label">Diễn viên:</span> {movie.cast}</p>
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

                {/* 4. Lịch chiếu (Sẽ làm ở bước tiếp theo) */}
                <div className="showtime-section" style={{marginTop: '40px', background: '#f9f9f9', padding: '20px'}}>
                    <h3 className="section-title">LỊCH CHIẾU</h3>
                    <p><i>(Phần chọn ngày giờ sẽ hiển thị ở đây...)</i></p>
                </div>
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