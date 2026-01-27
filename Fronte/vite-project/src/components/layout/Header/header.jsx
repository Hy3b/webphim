import React from 'react';
import { Link } from 'react-router-dom';
import './header.css';
export default function Header() {
    return (
        <div className="header-wrapper">
            {/* Top Bar: Dark Blue Background */}
            <div className="top-bar">
                <div className="container top-bar-content">
                    <div className="auth-links">
                        <Link to="/login">Đăng nhập</Link>
                        <span className="divider">|</span>
                        <Link to="/register">Đăng ký</Link>

                    </div>
                </div>
            </div>

            {/* Main Header: White Background */}
            <header className="main-header">
                <div className="container main-header-content">
                    {/* Logo Section */}
                    <div className="logo">
                        <Link to="/">
                            <h1 clfileassName="logo-text">MY<span className="logo-highlight">CINEMA</span></h1>
                        </Link>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="main-nav">
                        <ul>
                            <li><Link to="/lichchieu">LỊCH CHIẾU</Link></li>
                            <li><Link to="/">PHIM</Link></li>
                            <li><Link to="/">GIÁ VÉ</Link></li>
                            <li><Link to="/">NHƯỢNG QUYỀN</Link></li>
                            <li><Link to="/">THÀNH VIÊN</Link></li>
                        </ul>
                    </nav>
                </div>
            </header>
        </div>
    );
}