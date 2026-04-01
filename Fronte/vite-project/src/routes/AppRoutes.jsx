import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ClientLayout from '../layouts/ClientLayout';
import HomePage from '../features/client/home/HomePage';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import LichChieu from '../features/client/Schedule/LichChieu';
import BookingPage from '../features/client/booking/BookingPage/BookingPage';
import PaymentPage from '../features/client/payment/PaymentPage';
import MovieDetail from '../features/client/movie/MovieDetail';
import TicketPage from '../features/client/ticket/TicketPage';

// Admin Imports
import AdminLayout from '../layouts/AdminLayout';
import AdminRoute from './AdminRoute';
import AdminDashboard from '../features/admin/dashboard/AdminDashboard';

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
