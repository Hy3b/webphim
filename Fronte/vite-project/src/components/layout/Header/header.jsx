import React, { useState } from 'react'; // 1. Import useState
import { Link } from 'react-router-dom';
import './header.css';
export default function Header() {
    // 2. Khởi tạo biến Active Tab
    const [activeTab, setActiveTab] = useState('');

    return (
        <div className="header-wrapper">
            {/* Top Bar giữ nguyên ... */}
            <div className="top-bar">
                <div className="container top-bar-content">
                    <div className="auth-links">
                        <Link to="/login">Đăng nhập</Link>
                        <span className="divider">|</span>
                        <Link to="/register">Đăng ký</Link>

                    </div>
                </div>
            </div>

            <header className="main-header">
                <div className="container main-header-content">
                    <div className="logo">
<<<<<<< HEAD
                        <Link to="/" onClick={() => setActiveTab('')}> {/* Về trang chủ thì reset active */}
=======
                        <Link to="/">
>>>>>>> 403e9c32baebf487cb1a25a04af81606540e268a
                            <h1 className="logo-text">MY<span className="logo-highlight">CINEMA</span></h1>
                        </Link>
                    </div>

                    <nav className="main-nav">
                        <ul>
<<<<<<< HEAD
                            {/* 3. Sửa lại logic active cho từng mục */}
                            <li>
                                <Link to="/lichchieu" 
                                    className={`tab-btn ${activeTab === 'lich_chieu' ? 'active' : ''}`} 
                                    onClick={() => setActiveTab('lich_chieu')}>
                                    LỊCH CHIẾU
                                </Link>
                            </li>
                            <li>
                                <Link to="/" 
                                    className={`tab-btn ${activeTab === 'phim' ? 'active' : ''}`} 
                                    onClick={() => setActiveTab('phim')}>
                                    PHIM
                                </Link>
                            </li>
                            <li>
                                <Link to="/" 
                                    className={`tab-btn ${activeTab === 'gia_ve' ? 'active' : ''}`} 
                                    onClick={() => setActiveTab('gia_ve')}>
                                    GIÁ VÉ
                                </Link>
                            </li>
                            <li>
                                <Link to="/" 
                                    className={`tab-btn ${activeTab === 'nhuong_quyen' ? 'active' : ''}`} 
                                    onClick={() => setActiveTab('nhuong_quyen')}>
                                    NHƯỢNG QUYỀN
                                </Link>
                            </li>
                            <li>
                                <Link to="/" 
                                    className={`tab-btn ${activeTab === 'thanh_vien' ? 'active' : ''}`} 
                                    onClick={() => setActiveTab('thanh_vien')}>
                                    THÀNH VIÊN
                                </Link>
                            </li>
=======
                            <li><Link to="/">LỊCH CHIẾU</Link></li>
                            <li><Link to="/">PHIM</Link></li>
                            <li><Link to="/">GIÁ VÉ</Link></li>
                            <li><Link to="/">NHƯỢNG QUYỀN</Link></li>
                            <li><Link to="/">THÀNH VIÊN</Link></li>
>>>>>>> 403e9c32baebf487cb1a25a04af81606540e268a
                        </ul>
                    </nav>
                </div>
            </header>
        </div>
    );
}