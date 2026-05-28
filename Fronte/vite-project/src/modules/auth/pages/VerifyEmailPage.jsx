import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import './LoginPage.css';

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Đang xác thực tài khoản của bạn, vui lòng đợi...');
    const navigate = useNavigate();
    const { checkAuthStatus } = useAuth();
    const token = searchParams.get('token');

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Token xác thực không hợp lệ hoặc đã bị thiếu.');
                return;
            }

            try {
                const response = await api.post('/auth/verify-email', { token });
                if (response.status === 200) {
                    setStatus('success');
                    setMessage('Kích hoạt tài khoản thành công! Đang đăng nhập tự động...');
                    
                    // Cập nhật trạng thái đăng nhập
                    await checkAuthStatus();

                    // Chuyển hướng về trang chủ sau 3 giây
                    setTimeout(() => {
                        navigate('/');
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage(response.data?.message || 'Kích hoạt thất bại. Vui lòng thử lại.');
                }
            } catch (error) {
                console.error("Lỗi xác thực email:", error);
                setStatus('error');
                if (error.response) {
                    setMessage(error.response.data?.message || 'Token xác thực đã hết hạn hoặc không tồn tại.');
                } else {
                    setMessage('Không thể kết nối tới máy chủ. Vui lòng thử lại sau.');
                }
            }
        };

        verify();
    }, [token, navigate, checkAuthStatus]);

    return (
        <div className="login-page">
            <div className="login-container" style={{ textAlign: 'center', padding: '40px 30px' }}>
                <div className="auth-header">
                    {status === 'verifying' && (
                        <>
                            <div className="loading-spinner" style={{
                                width: '50px',
                                height: '50px',
                                border: '5px solid #f3f3f3',
                                borderTop: '5px solid #034EA2',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '20px auto'
                            }}></div>
                            <style>{`
                                @keyframes spin {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                            `}</style>
                            <h2>Đang Xác Thực</h2>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div style={{ fontSize: '64px', marginBottom: '20px', color: '#2ecc71' }}>✓</div>
                            <h2>Thành Công</h2>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div style={{ fontSize: '64px', marginBottom: '20px', color: '#e74c3c' }}>✗</div>
                            <h2>Thất Bại</h2>
                        </>
                    )}

                    <div className="auth-divider-line"></div>
                    <p style={{ marginTop: '15px', lineHeight: '1.6', color: '#444' }}>
                        {message}
                    </p>
                </div>

                <div style={{ marginTop: '30px' }}>
                    {status === 'success' && (
                        <Link to="/" className="btn-submit" style={{ display: 'block', textDecoration: 'none', lineHeight: '45px', height: '45px', padding: 0 }}>
                            Đi tới trang chủ ngay
                        </Link>
                    )}
                    {status === 'error' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <Link to="/register" className="btn-submit" style={{ display: 'block', textDecoration: 'none', lineHeight: '45px', height: '45px', padding: 0 }}>
                                Quay lại Đăng ký
                            </Link>
                            <Link to="/login" className="btn-submit" style={{ display: 'block', textDecoration: 'none', lineHeight: '45px', height: '45px', padding: 0, backgroundColor: '#7f8c8d' }}>
                                Đi tới Đăng nhập
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;
