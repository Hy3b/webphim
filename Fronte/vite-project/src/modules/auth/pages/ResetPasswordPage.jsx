import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../../services/api';
import './LoginPage.css';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [form, setForm] = useState({ password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setErrorMessage('Liên kết đổi mật khẩu thiếu token xác thực hoặc không hợp lệ.');
        }
    }, [token]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (!token) {
            setErrorMessage('Token xác thực không hợp lệ.');
            return;
        }

        if (form.password.length < 6) {
            setErrorMessage('Mật khẩu mới phải có tối thiểu 6 ký tự.');
            return;
        }

        if (form.password !== form.confirmPassword) {
            setErrorMessage('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.post('/auth/reset-password', {
                token: token,
                newPassword: form.password
            });

            if (response.status === 200) {
                setSuccessMessage('Đổi mật khẩu thành công! Bạn đang được chuyển hướng về trang Đăng nhập...');
                setForm({ password: '', confirmPassword: '' });
                
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setErrorMessage('Có lỗi xảy ra trong quá trình đặt lại mật khẩu.');
            }
        } catch (error) {
            console.error("Lỗi đặt lại mật khẩu:", error);
            if (error.response) {
                setErrorMessage(error.response.data?.message || 'Token đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu lại.');
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
                    <h2>Đặt Lại Mật Khẩu</h2>
                    <div className="auth-divider-line"></div>
                    <p>Nhập mật khẩu mới cho tài khoản của bạn.</p>
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
                        <label htmlFor="password">Mật khẩu mới</label>
                        <div className="password-wrapper">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Nhập mật khẩu mới..."
                                maxLength={100}
                                required
                                disabled={!token || isLoading}
                            />
                            <button
                                type="button"
                                className="toggle-pw"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                            >
                                {showPassword ? '-.-' : '👁'}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                        <div className="password-wrapper">
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder="Nhập lại mật khẩu mới..."
                                maxLength={100}
                                required
                                disabled={!token || isLoading}
                            />
                            <button
                                type="button"
                                className="toggle-pw"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex="-1"
                            >
                                {showConfirmPassword ? '-.-' : '👁'}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn-submit" disabled={!token || isLoading}>
                        {isLoading ? 'ĐANG CẬP NHẬT...' : 'ĐẶT LẠI MẬT KHẨU'}
                    </button>
                </form>

                <p className="switch-auth" style={{ marginTop: '20px' }}>
                    <Link to="/login">Quay lại Đăng nhập</Link>
                </p>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
