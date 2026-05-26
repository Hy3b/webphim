import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../services/api';
import './ProfilePage.css';

export default function ProfilePage() {
    const { user, checkAuthStatus } = useAuth();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    
    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ fullName: '', phoneNumber: '' });
    const [isSaving, setIsSaving] = useState(false);
    
    // UI state
    const [activeQR, setActiveQR] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (user === null) {
            // User not logged in, handled by checkAuthStatus, but let's be safe
            // We wait for initial load in a real scenario.
            // If user explicitly null and not loading, we can redirect, but AuthContext handles this usually.
            // Wait, we need to fetch history if user exists
        }
    }, [user]);

    useEffect(() => {
        let isMounted = true;
        const fetchHistory = async () => {
            try {
                const response = await api.get('/bookings/history');
                if (isMounted) setHistory(response.data);
            } catch (error) {
                console.error('Lỗi khi tải lịch sử đặt vé:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (user) {
            setEditForm({ fullName: user.fullName || '', phoneNumber: user.phoneNumber || '' });
            fetchHistory();
        } else {
            // Give context some time to load or redirect if absolutely null
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
            }
        }
        return () => { isMounted = false; };
    }, [user, navigate]);

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.put('/auth/update-profile', editForm);
            await checkAuthStatus(); // Refetch user info globally
            setIsEditing(false);
            alert('Cập nhật thông tin thành công!');
        } catch (error) {
            console.error('Lỗi cập nhật:', error);
            alert('Cập nhật thất bại. Vui lòng thử lại.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!user || loading) return <div className="profile-loading">Đang tải thông tin...</div>;

    return (
        <div className="profile-page">
            <div className="profile-container">
                {/* Profile Information Card */}
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="profile-avatar-large">
                            {(user.fullName || user.username).charAt(0).toUpperCase()}
                        </div>
                        <h2 className="profile-username">{user.fullName || user.username}</h2>
                        <span className="profile-role">{user.role}</span>
                    </div>

                    {!isEditing ? (
                        <>
                            <div className="profile-info-grid">
                                <div className="info-item">
                                    <span className="info-label">Tên đăng nhập</span>
                                    <span className="info-value">{user.username}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Họ và tên</span>
                                    <span className="info-value">{user.fullName || 'Chưa cập nhật'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Email</span>
                                    <span className="info-value">{user.email}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Số điện thoại</span>
                                    <span className="info-value">{user.phoneNumber || 'Chưa cập nhật'}</span>
                                </div>
                                <div className="info-item" style={{ gridColumn: '1 / -1', background: 'linear-gradient(to right, #034EA2, #00B1FF)', padding: '15px', borderRadius: '8px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>⭐ Điểm tích lũy</span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{user.points || 0} Điểm</span>
                                </div>
                            </div>
                            <div className="profile-actions">
                                <button className="primary-btn" onClick={() => setIsEditing(true)}>
                                    Chỉnh sửa thông tin
                                </button>
                            </div>
                        </>
                    ) : (
                        <form className="edit-form" onSubmit={handleEditSubmit}>
                            <div className="profile-info-grid">
                                <div className="form-group">
                                    <label>Tên đăng nhập (Không thể đổi)</label>
                                    <input type="text" value={user.username} disabled />
                                </div>
                                <div className="form-group">
                                    <label>Email (Không thể đổi)</label>
                                    <input type="email" value={user.email} disabled />
                                </div>
                                <div className="form-group">
                                    <label>Họ và tên</label>
                                    <input 
                                        type="text" 
                                        value={editForm.fullName} 
                                        onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                                        required 
                                        placeholder="Nhập họ và tên"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Số điện thoại</label>
                                    <input 
                                        type="text" 
                                        value={editForm.phoneNumber} 
                                        onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="secondary-btn" onClick={() => setIsEditing(false)}>
                                    Hủy
                                </button>
                                <button type="submit" className="primary-btn" disabled={isSaving}>
                                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Booking History Card */}
                <div className="history-card">
                    <h3>Lịch sử đặt vé</h3>
                    
                    {history.length === 0 ? (
                        <div className="empty-history">Bạn chưa có lịch sử đặt vé nào.</div>
                    ) : (
                        <div className="history-list">
                            {history.map((item) => (
                                <div className="history-item" key={item.orderCode}>
                                    <div className="history-top">
                                        <span className="history-movie">{item.movieTitle}</span>
                                        <span className="history-status">Thành công</span>
                                    </div>
                                    
                                    <div className="history-details">
                                        <span>📅 {new Date(item.showtime).toLocaleDateString('vi-VN')}</span>
                                        <span>🕐 {new Date(item.showtime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}</span>
                                        <span>📍 Rạp: WebPhim</span>
                                        <span>🎭 Phòng: {item.room}</span>
                                        <span>💺 Ghế: {item.seats.join(', ')}</span>
                                        <span>🔖 Đơn: {item.orderCode}</span>
                                    </div>
                                    
                                    <div className="history-footer">
                                        <span className="history-total">Tổng: {item.totalAmount.toLocaleString()}đ</span>
                                        <button 
                                            className="qr-btn"
                                            onClick={() => setActiveQR(activeQR === item.orderCode ? null : item.orderCode)}
                                        >
                                            {activeQR === item.orderCode ? 'Ẩn mã QR' : 'Mã QR Check-in'}
                                        </button>
                                    </div>
                                    
                                    {activeQR === item.orderCode && (
                                        <div className="qr-section">
                                            <img 
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${item.orderCode}`} 
                                                alt="QR Code" 
                                                className="qr-image"
                                            />
                                            <span className="qr-hint">Đưa mã này cho nhân viên soát vé</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
