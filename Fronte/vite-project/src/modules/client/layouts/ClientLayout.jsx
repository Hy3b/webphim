import React, { useEffect } from 'react';
import TopBarComponent from '../components/Header/header.jsx';
import Footer from '../components/Footer/Footer.jsx';
import { Outlet } from 'react-router-dom';

const ClientLayout = () => {
    useEffect(() => {
        document.title = "MyCinema - Đặt vé xem phim";
    }, []);

    return (
        <div className="client-layout">
            <TopBarComponent />
            <main>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default ClientLayout;
