import React from 'react';
import { Routes, Route } from 'react-router-dom';

import ClientLayout from '../layouts/ClientLayout';

// Client pages
import HomePage from '../features/client/home/HomePage';
import MovieDetail from '../features/client/movie/MovieDetail';
import LichChieu from '../features/client/Schedule/LichChieu';
import BookingPage from '../features/client/booking/BookingPage/BookingPage';
import PaymentPage from '../features/client/payment/PaymentPage';
import TicketPage from '../features/client/ticket/TicketPage';

// Auth pages
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';

// User
import ProfilePage from '../pages/ProfilePage';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<ClientLayout />}>

                {/* Home */}
                <Route index element={<HomePage />} />

                {/* Auth */}
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />

                {/* Movie */}
                <Route path="movie/:id" element={<MovieDetail />} />
                <Route path="lichchieu" element={<LichChieu />} />

                {/* Booking flow */}
                <Route path="booking/:id" element={<BookingPage />} />
                <Route path="payment" element={<PaymentPage />} />
                <Route path="ticket" element={<TicketPage />} />

                {/* User */}
                <Route path="profile" element={<ProfilePage />} />

            </Route>
        </Routes>
    );
};

export default AppRoutes;
