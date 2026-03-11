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

// Admin imports
import AdminLayout from '../layouts/AdminLayout';
import DashboardPage from '../features/admin/pages/DashboardPage';
import MoviesPage from '../features/admin/pages/movies/MoviesPage';
import MovieFormPage from '../features/admin/pages/movies/MovieFormPage';
import ShowtimesPage from '../features/admin/pages/showtimes/ShowtimesPage';
import ShowtimeFormPage from '../features/admin/pages/showtimes/ShowtimeFormPage';
import RoomsPage from '../features/admin/pages/rooms/RoomsPage';
import SeatMapTemplatesPage from '../features/admin/pages/seat-map/SeatMapTemplatesPage';

const AppRoutes = () => {
    return (
        <Routes>
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
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="movies" element={<MoviesPage />} />
                <Route path="movies/create" element={<MovieFormPage />} />
                <Route path="movies/edit/:id" element={<MovieFormPage />} />
                <Route path="showtimes" element={<ShowtimesPage />} />
                <Route path="showtimes/create" element={<ShowtimeFormPage />} />
                <Route path="rooms" element={<RoomsPage />} />
                <Route path="seat-map" element={<SeatMapTemplatesPage />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
