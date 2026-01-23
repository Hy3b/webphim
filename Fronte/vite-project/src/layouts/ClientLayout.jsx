import React from 'react';
import Header from '../../components/layout/Header/header.jsx'; // Adjust path based on actual file name
import { Outlet } from 'react-router-dom';

const ClientLayout = () => {
    return (
        <div className="client-layout">
            <Header />
            <main>
                <Outlet />
            </main>
            <footer>
                {/* Footer content */}
                <p>© 2024 WebPhim</p>
            </footer>
        </div>
    );
};

export default ClientLayout;
