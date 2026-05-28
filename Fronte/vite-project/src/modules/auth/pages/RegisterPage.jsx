import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import './LoginPage.css';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        username: '',
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendStatus, setResendStatus] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleResendEmail = async () => {
        setIsResending(true);
        setResendStatus('');
        try {
            const response = await api.post('/auth/resend-activation', {
                email: form.email.trim()
            });
            setResendStatus(response.data?.message || 'Đã gửi lại email kích hoạt.');
        } catch (error) {
            console.error("Lỗi gửi lại:", error);
            if (error.response) {
                setResendStatus(error.response.data?.message || 'Không thể gửi lại email kích hoạt.');
            } else {
                setResendStatus('Không thể kết nối đến máy chủ. Vui lòng thử lại!');
            }
        } finally {
            setIsResending(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (form.password !== form.confirmPassword) {
            setErrorMessage('Mật khẩu xác nhận không khớp!');
            return;
        }

        try {
            const response = await api.post('/auth/register', {
                username: form.username.trim(),
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                phoneNumber: form.phone.trim(),
                password: form.password
            });

            if (response.status === 200) {
                setIsSubmitted(true);
            } else {
                setErrorMessage('Dữ liệu không hợp lệ, vui lòng kiểm tra lại!');
            }
        } catch (error) {
            console.error("Lỗi đăng ký:", error);
            if (error.response) {
                const msg = error.response.data?.message || 'Đăng ký thất bại. Email hoặc tên đăng nhập đã tồn tại!';
                setErrorMessage(msg);
            } else {
                setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại!');
            }
        }
    };

    const passwordMatch = form.confirmPassword && form.password === form.confirmPassword;
    const passwordNotMatch = form.confirmPassword && form.password !== form.confirmPassword;

    if (isSubmitted) {
        return (
            <div className="login-page">
                <div className="login-container" style={{ textAlign: 'center', padding: '40px 30px' }}>
                    <div className="auth-header">
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>📧</div>
                        <h2 style={{ display: 'block', marginBottom: '12px' }}>Đăng Ký Thành Công</h2>
                        <p style={{ marginTop: '15px', lineHeight: '1.6', color: '#444' }}>
                            Chúng tôi đã gửi một email xác minh đến hộp thư: <br />
                            <strong style={{ color: '#FF6600', fontSize: '1.15em', wordBreak: 'break-all' }}>{form.email}</strong>
                        </p>
                        <p style={{ fontSize: '13px', color: '#777', marginTop: '12px' }}>
                            Vui lòng nhấp vào liên kết trong email để kích hoạt tài khoản của bạn.
                        </p>
                    </div>

                    <div style={{ margin: '25px 0' }}>
                        <button 
                            onClick={handleResendEmail} 
                            className="btn-submit" 
                            disabled={isResending}
                            style={{ backgroundColor: '#FF6600', width: '100%', marginBottom: '12px' }}
                        >
                            {isResending ? 'ĐANG GỬI LẠI...' : 'GỬI LẠI EMAIL KÍCH HOẠT'}
                        </button>
                        
                        {resendStatus && (
                            <div style={{ 
                                color: resendStatus.includes('lỗi') || resendStatus.includes('thất bại') || resendStatus.includes('không') ? '#e74c3c' : '#2ecc71', 
                                fontSize: '13px', 
                                marginBottom: '12px',
                                fontWeight: '600'
                            }}>
                                {resendStatus}
                            </div>
                        )}

                        <Link to="/login" className="btn-submit" style={{ display: 'block', textDecoration: 'none', lineHeight: '45px', height: '45px', padding: 0, backgroundColor: '#034EA2' }}>
                            ĐI TỚI ĐĂNG NHẬP
                        </Link>
                    </div>

                    <p className="switch-auth">
                        Nhập sai email?{' '}
                        <span style={{ color: '#FF6600', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }} onClick={() => setIsSubmitted(false)}>
                            Quay lại sửa thông tin
                        </span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="auth-header">
                    <h2>Đăng Ký</h2>
                    <div className="auth-divider-line"></div>
                    <p>Tạo tài khoản để đặt vé nhanh hơn!</p>
                </div>

                {errorMessage && (
                    <div className="auth-error-message" style={{ color: '#e74c3c', marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(231, 76, 60, 0.1)', borderRadius: '4px', border: '1px solid #e74c3c' }}>
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Tên đăng nhập</label>
                        <input
                            id="username"
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="Viết liền không dấu..."
                            maxLength={50}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="fullName">Họ và tên</label>
                        <input
                            id="fullName"
                            type="text"
                            name="fullName"
                            value={form.fullName}
                            onChange={handleChange}
                            placeholder="Nhập họ và tên đầy đủ..."
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Nhập địa chỉ email..."
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Số điện thoại</label>
                        <input
                            id="phone"
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="Nhập số điện thoại..."
                            maxLength={15}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu</label>
                        <div className="password-wrapper">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Tối thiểu 8 ký tự..."
                                maxLength={100}
                                required
                            />
                            <button
                                type="button"
                                className="toggle-pw"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '-.-' : '👁'}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            placeholder="Nhập lại mật khẩu..."
                            maxLength={100}
                            required
                            style={{
                                borderColor: passwordMatch ? '#2ecc71'
                                    : passwordNotMatch ? '#e74c3c'
                                        : undefined
                            }}
                        />
                        {passwordNotMatch && (
                            <span style={{ fontSize: 12, color: '#e74c3c', marginTop: 4, display: 'block' }}>
                                Mật khẩu không khớp!
                            </span>
                        )}
                        {passwordMatch && (
                            <span style={{ fontSize: 12, color: '#2ecc71', marginTop: 4, display: 'block' }}>
                                Mật khẩu khớp ✓
                            </span>
                        )}
                    </div>

                    <button type="submit" className="btn-submit">
                        TẠO TÀI KHOẢN
                    </button>
                </form>

                <p className="switch-auth">
                    Đã có tài khoản?{' '}
                    <Link to="/login">Đăng nhập ngay</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;