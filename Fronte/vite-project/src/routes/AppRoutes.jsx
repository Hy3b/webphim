import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ClientLayout from '../modules/client/layouts/ClientLayout';
import HomePage from '../modules/client/pages/home/HomePage';
import LoginPage from '../modules/auth/pages/LoginPage';
import RegisterPage from '../modules/auth/pages/RegisterPage';
import LichChieu from '../modules/client/pages/Schedule/LichChieu';
import BookingPage from '../modules/client/pages/booking/BookingPage/BookingPage';
import PaymentPage from '../modules/client/pages/payment/PaymentPage';
import MovieDetail from '../modules/client/pages/movie/MovieDetail';
import TicketPage from '../modules/client/pages/ticket/TicketPage';

// Admin Imports
import AdminLayout from '../modules/admin/layouts/AdminLayout';
import AdminRoute from './AdminRoute';
import AdminDashboard from '../modules/admin/pages/AdminDashboard/AdminDashboard';

const AppRoutes = () => {
    return (
        <Routes>
            {/* Client Routes */}
            <Route path="/" element={<ClientLayout />}>
                <Route index element={<HomePage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="lichchieu" element={<LichChieu />} />
                <Route path="booking/:id" element={<BookingPage />} />
                <Route path="payment" element={<PaymentPage />} />
                <Route path="ticket" element={<TicketPage />} />
                <Route path="movie/:id" element={<MovieDetail />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                
                {/* Placeholders for future pages */}
                <Route path="rooms" element={<div>Quản lý phòng rạp</div>} />
                <Route path="seats" element={<div>Quản lý sơ đồ ghế</div>} />
                <Route path="movies" element={<div>Quản lý phim</div>} />
                <Route path="showtimes" element={<div>Quản lý suất chiếu</div>} />
                <Route path="tickets" element={<div>Bán vé trực tiếp</div>} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
