import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import './LoginPage.css';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/forgot-password', {
                email: email.trim()
            });

            if (response.status === 200) {
                setSuccessMessage('Yêu cầu thành công! Chúng tôi đã gửi liên kết đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác).');
                setEmail('');
            } else {
                setErrorMessage('Có lỗi xảy ra. Vui lòng thử lại sau.');
            }
        } catch (error) {
            console.error("Lỗi yêu cầu quên mật khẩu:", error);
            if (error.response) {
                setErrorMessage(error.response.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!');
            } else {
                setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng!');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="auth-header">
                    <h2>Quên Mật Khẩu</h2>
                    <div className="auth-divider-line"></div>
                    <p>Nhập email của bạn để nhận liên kết đặt lại mật khẩu.</p>
                </div>

                {errorMessage && (
                    <div className="auth-error-message" style={{ color: '#e74c3c', marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(231, 76, 60, 0.1)', borderRadius: '4px', border: '1px solid #e74c3c', fontSize: '14px' }}>
                        {errorMessage}
                    </div>
                )}

                {successMessage && (
                    <div className="auth-success-message" style={{ color: '#2ecc71', marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(46, 204, 113, 0.1)', borderRadius: '4px', border: '1px solid #2ecc71', fontSize: '14px', lineHeight: '1.6' }}>
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Nhập địa chỉ email..."
                            maxLength={100}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-submit" disabled={isLoading}>
                        {isLoading ? 'ĐANG GỬI YÊU CẦU...' : 'GỬI LIÊN KẾT ĐẶT LẠI'}
                    </button>
                </form>

                <p className="switch-auth" style={{ marginTop: '20px' }}>
                    <Link to="/login">Quay lại Đăng nhập</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
