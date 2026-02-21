import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ClientLayout from '../layouts/ClientLayout';
import HomePage from '../features/client/home/HomePage';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import MovieDetail from '../features/client/movie/MovieDetail';
import BookingPage from '../features/client/booking/BookingPage/BookingPage';
import PaymentPage from '../features/client/payment/PaymentPage';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<ClientLayout />}>
                <Route index element={<HomePage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="movie/:id" element={<MovieDetail />} />
                <Route path="booking/:id" element={<BookingPage />} />
                <Route path="payment" element={<PaymentPage />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
