import TopBarComponent from '../components/Header/header.jsx';
import Footer from '../components/Footer/Footer.jsx';
import { Outlet } from 'react-router-dom';

const ClientLayout = () => {
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
