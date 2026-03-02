import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './header.css';

export default function Header() {
    const [activeTab, setActiveTab] = useState('');
    const [username, setUsername] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Đọc token và lấy username từ JWT payload
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUsername(payload.sub); // "sub" là username trong JWT
            } catch {
                setUsername(null);
            }
        } else {
            setUsername(null);
        }
    }, []);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        setUsername(null);
        setDropdownOpen(false);
        navigate('/');
    };

    return (
        <div className="header-wrapper">
            <div className="top-bar">
                <div className="container top-bar-content">
                    {username ? (
                        <div className="user-menu" ref={dropdownRef}>
                            <button
                                className="user-btn"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                <span className="user-avatar">
                                    {username.charAt(0).toUpperCase()}
                                </span>
                                <span className="user-name">{username}</span>
                                <span className="chevron">{dropdownOpen ? '▲' : '▼'}</span>
                            </button>

                            {dropdownOpen && (
                                <div className="dropdown-menu">
                                    <Link
                                        to="/profile"
                                        className="dropdown-item"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        👤 Thông tin cá nhân
                                    </Link>
                                    <button
                                        className="dropdown-item dropdown-logout"
                                        onClick={handleLogout}
                                    >
                                        🚪 Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="auth-links">
                            <Link to="/login">Đăng nhập</Link>
                            <span className="divider">|</span>
                            <Link to="/register">Đăng ký</Link>
                        </div>
                    )}
                </div>
            </div>

            <header className="main-header">
                <div className="container main-header-content">
                    <div className="logo">
                        <Link to="/" onClick={() => setActiveTab('')}>
                            <h1 className="logo-text">MY<span className="logo-highlight">CINEMA</span></h1>
                        </Link>
                    </div>

                    <nav className="main-nav">
                        <ul>
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
