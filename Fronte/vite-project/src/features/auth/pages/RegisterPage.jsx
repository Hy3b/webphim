import React from 'react';
import Button from '../../../components/common/Button/Button';

const RegisterPage = () => {
    return (
        <div className="register-page">
            <h2>Đăng Ký Khách Hàng</h2>
            <form>
                <div className="form-group">
                    <label>Họ tên:</label>
                    <input type="text" placeholder="Nhập họ tên..." />
                </div>
                <div className="form-group">
                    <label>Email:</label>
                    <input type="email" placeholder="Nhập email..." />
                </div>
                <div className="form-group">
                    <label>Mật khẩu:</label>
                    <input type="password" placeholder="Nhập mật khẩu..." />
                </div>
                <div className="form-group">
                    <label>Xác nhận mật khẩu:</label>
                    <input type="password" placeholder="Nhập lại mật khẩu..." />
                </div>
                <Button type="submit">Đăng Ký</Button>
            </form>
        </div>
    );
};

export default RegisterPage;
