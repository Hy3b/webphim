import React from 'react';
import Button from '../../../components/common/Button/Button';

const LoginPage = () => {
    return (
        <div className="login-page">
            <h2>Đăng Nhập</h2>
            <form>
                <div className="form-group">
                    <label>Email:</label>
                    <input type="email" placeholder="Nhập email..." />
                </div>
                <div className="form-group">
                    <label>Mật khẩu:</label>
                    <input type="password" placeholder="Nhập mật khẩu..." />
                </div>
                <Button type="submit">Đăng Nhập</Button>
            </form>
        </div>
    );
};

export default LoginPage;
