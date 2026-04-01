import Header from '../components/layout/Header/header.jsx';
import Footer from '../components/layout/Footer/Footer.jsx';
import { Outlet } from 'react-router-dom';

const ClientLayout = () => {
    return (
        <div className="client-layout">
            <Header />
            <main>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default ClientLayout;
