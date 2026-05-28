import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import LoadingOverlay from '../../../shared/components/LoadingOverlay/LoadingOverlay';
import api from '../../../services/api';
import './LoginPage.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/login', {
                email: form.email.trim(),
                password: form.password
            });

            if (response.status === 200) {
                const data = response.data;
                // Lưu token vào localStorage để interceptor trong api.js tự động nhận diện!
                localStorage.setItem('token', data.accessToken);
                setIsSuccess(true);
                await login();

                setTimeout(async () => {
                    try {
                        // Giải mã JWT accessToken để lấy quyền
                        const { jwtDecode } = await import('jwt-decode');
                        const decoded = jwtDecode(data.accessToken);
                        const role = typeof decoded.role === 'string' ? decoded.role.toUpperCase() : '';

                        if (role === 'ADMIN' || role === 'STAFF') {
                            // Theo yêu cầu, mở trang Admin ở một tab mới
                            window.open('/admin', '_blank');
                            // Tab hiện tại (Web khách) chuyển về trang chủ
                            navigate('/');
                        } else {
                            navigate('/'); // Chuyển hướng về trang chủ
                        }
                    } catch (decodeError) {
                        console.error("Lỗi khi giải mã token:", decodeError);
                        navigate('/');
                    }
                }, 1500); // Wait 1.5s to show overlay
            } else {
                setErrorMessage('Email/Tên đăng nhập hoặc mật khẩu không chính xác!');
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            // Axios ném lỗi cho mọi status 4xx/5xx — cần phân biệt
            if (error.response) {
                // Có response từ server (401 sai mật khẩu, 400 validation...)
                const msg = error.response.data?.message || 'Email hoặc mật khẩu không đúng!';
                setErrorMessage(msg);
            } else {
                // Không kết nối được server (network error)
                setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại!');
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            {isSuccess && <LoadingOverlay text="Loading..." />}
            <div className="login-container">
                <div className="auth-header">
                    <h2>Đăng Nhập</h2>
                    <div className="auth-divider-line"></div>
                    <p>Chào mừng bạn trở lại với MyCinema!</p>
                </div>

                {errorMessage && (
                    <div className="auth-error-message" style={{ color: '#e74c3c', marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(231, 76, 60, 0.1)', borderRadius: '4px', border: '1px solid #e74c3c' }}>
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
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
                        <label htmlFor="password">Mật khẩu</label>
                        <div className="password-wrapper">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Nhập mật khẩu..."
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

                    <div className="form-options">
                        <Link to="/forgot-password" className="forgot-link">Quên mật khẩu?</Link>
                    </div>

                    <button type="submit" className="btn-submit" disabled={isLoading}>
                        {isLoading && !isSuccess ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
                    </button>

                </form>

                <p className="switch-auth">
                    Chưa có tài khoản?{' '}
                    <Link to="/register">Đăng ký ngay</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;