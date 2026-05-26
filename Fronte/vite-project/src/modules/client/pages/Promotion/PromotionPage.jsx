import React from 'react';
import { Link } from 'react-router-dom';
import './PromotionPage.css';

const PromotionPage = () => {
    const promotions = [
        {
            id: 1,
            title: "Ưu đãi 5% khi tích điểm thành viên",
            description: "Thanh toán ngay nhận liền tay 5% giá trị quy đổi thành điểm thưởng.",
            imageUrl: "https://www.bhdstar.vn/wp-content/uploads/2024/08/BHD-Star-Mmember.jpg",
            tag: "Nổi bật"
        },
        {
            id: 2,
            title: "Thứ 2 vui vẻ - Đồng giá vé 65K",
            description: "Đồng giá vé 65K cho mọi suất chiếu vào thứ 2 hàng tuần (trừ ngày Lễ/Tết).",
            imageUrl: "https://www.bhdstar.vn/wp-content/uploads/2023/10/U22.jpg",
            tag: "Hàng tuần"
        },
        {
            id: 3,
            title: "Combo sinh viên - Chỉ 99K",
            description: "Bao gồm 1 vé xem phim và 1 nước ngọt (Cỡ vừa) dành cho HSSV có thẻ.",
            imageUrl: "https://www.bhdstar.vn/wp-content/uploads/2023/08/C-MONDAY.jpg",
            tag: "Ưu đãi HS-SV"
        }
    ];

    return (
        <div className="promotion-page">
            <div className="promo-header">
                <h2>KHUYẾN MÃI & ƯU ĐÃI MỚI NHẤT</h2>
                <p>Khám phá ngay hàng ngàn ưu đãi hấp dẫn dành riêng cho bạn tại MYCINEMA!</p>
            </div>

            <div className="promo-grid">
                {promotions.map(promo => (
                    <div className="promo-card" key={promo.id}>
                        <div className="promo-image">
                            <img src={promo.imageUrl} alt={promo.title} />
                            <span className="promo-tag">{promo.tag}</span>
                        </div>
                        <div className="promo-content">
                            <h3 className="promo-title">{promo.title}</h3>
                            <p className="promo-desc">{promo.description}</p>
                            <Link to="/lichchieu" className="btn-book-now">Mua Vé Ngay</Link>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="loyalty-banner">
                <div className="loyalty-banner-content">
                    <h3>Bạn đã biết chưa?</h3>
                    <p>Giờ đây bạn có thể <strong>tích điểm tự động</strong> với mỗi giao dịch mua vé và dùng điểm đó để trừ trực tiếp vào hóa đơn cho các lần đặt vé sau!</p>
                    <p><strong>1 Điểm = 1.000 VNĐ</strong></p>
                    <Link to="/profile" className="btn-check-points">Kiểm tra điểm của bạn</Link>
                </div>
            </div>
        </div>
    );
};

export default PromotionPage;
