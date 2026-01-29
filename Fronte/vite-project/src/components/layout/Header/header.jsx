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
                        <Link to="/" onClick={() => setActiveTab('')}> {/* Về trang chủ thì reset active */}
                            <h1 className="logo-text">MY<span className="logo-highlight">CINEMA</span></h1>
                        </Link>
                    </div>

                    <nav className="main-nav">
                        <ul>
                            {/* 3. Sửa lại logic active cho từng mục */}
                            <li>
                                <Link to="/" 
                                    className={`tab-btn ${activeTab === 'lich_chieu' ? 'active' : ''}`} 
                                    onClick={() => setActiveTab('lich_chieu')}>
                                    LỊCH CHIẾU
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
                        </ul>
                    </nav>
                </div>
            </header>
        </div>
    );
}