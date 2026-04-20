import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { CircleDollarSign, Lock, User, CalendarDays } from 'lucide-react';
import api from '../../../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user } = useAuth();
    const displayName = user?.fullName || 'Hoàn Trần';
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalTicketsSold: 0,
        newCustomersThisMonth: 0,
        revenueByDate: [],
        recentInvoices: [],
        recentCustomers: [],
    });
    const [range, setRange] = useState({ from: '', to: '' });
    const [showRevenueFilter, setShowRevenueFilter] = useState(false);

    const fetchOverview = async (filter = range) => {
        setLoading(true);
        try {
            const params = {};
            if (filter.from) params.from = new Date(`${filter.from}T00:00:00`).toISOString();
            if (filter.to) params.to = new Date(`${filter.to}T23:59:59`).toISOString();
            const res = await api.get('/admin/reports/overview', { params });
            setStats(res.data || {});
        } catch {
            setStats({
                totalRevenue: 0,
                totalTicketsSold: 0,
                newCustomersThisMonth: 0,
                revenueByDate: [],
                recentInvoices: [],
                recentCustomers: [],
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverview();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const lastRevenue = useMemo(() => stats.revenueByDate?.slice(-7) || [], [stats.revenueByDate]);
    const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')} ₫`;

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h1 className="welcome-text">Xin chào, {displayName}!</h1>
                <p className="welcome-subtext">Sau đây là những gì đang diễn ra tại hệ thống của bạn.</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Doanh thu</span>
                        <div className="stat-icon revenue-bg">
                            <CircleDollarSign size={20} color="#10b981" />
                        </div>
                    </div>
                    <div className="stat-value">{fmtMoney(stats.totalRevenue)}</div>
                    <div className="stat-footer clickable" onClick={() => setShowRevenueFilter((p) => !p)}>
                        <span>Xem theo khoảng thời gian</span>
                        <span className="trend">Tùy chỉnh</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Tổng vé</span>
                        <div className="stat-icon ticket-bg">
                            <Lock size={20} color="#3b82f6" />
                        </div>
                    </div>
                    <div className="stat-value">{stats.totalTicketsSold || 0}</div>
                    <div className="stat-footer">
                        <span>Số ghế đã bán thành công</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Khách hàng mới tháng này</span>
                        <div className="stat-icon users-bg">
                            <User size={20} color="#f59e0b" />
                        </div>
                    </div>
                    <div className="stat-value">{stats.newCustomersThisMonth || 0}</div>
                    <div className="stat-footer">
                        <span>Dựa theo thời gian đăng ký</span>
                    </div>
                </div>
            </div>

            {showRevenueFilter && (
                <div className="revenue-filter-box">
                    <div className="revenue-filter-row">
                        <CalendarDays size={16} />
                        <input type="date" value={range.from} onChange={(e) => setRange((p) => ({ ...p, from: e.target.value }))} />
                        <input type="date" value={range.to} onChange={(e) => setRange((p) => ({ ...p, to: e.target.value }))} />
                        <button onClick={() => fetchOverview(range)} disabled={loading}>
                            {loading ? 'Đang tải...' : 'Xem doanh thu'}
                        </button>
                    </div>
                    <div className="revenue-points">
                        {lastRevenue.length === 0 && <span>Chưa có dữ liệu doanh thu theo mốc thời gian.</span>}
                        {lastRevenue.map((p) => (
                            <div key={p.date} className="revenue-point">
                                <span>{p.date}</span>
                                <strong>{fmtMoney(p.revenue)}</strong>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="chart-container">
                <h3 className="chart-title">Hóa đơn gần đây</h3>
                <div className="recent-list">
                    {(stats.recentInvoices || []).map((invoice) => (
                        <div className="recent-item" key={invoice.orderCode}>
                            <div>
                                <strong>{invoice.orderCode}</strong>
                                <p>{invoice.customerName || 'Khách lẻ'} - {invoice.movieTitle}</p>
                            </div>
                            <span>{fmtMoney(invoice.finalAmount)}</span>
                        </div>
                    ))}
                    {!stats.recentInvoices?.length && <p className="empty-text">Chưa có hóa đơn gần đây.</p>}
                </div>
            </div>

            <div className="chart-container">
                <h3 className="chart-title">Khách hàng mới nhất</h3>
                <div className="recent-list">
                    {(stats.recentCustomers || []).map((customer) => (
                        <div className="recent-item" key={customer.userId}>
                            <div>
                                <strong>{customer.fullName || 'Khách hàng'}</strong>
                                <p>{customer.email}</p>
                            </div>
                            <span>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN') : '—'}</span>
                        </div>
                    ))}
                    {!stats.recentCustomers?.length && <p className="empty-text">Chưa có khách hàng mới.</p>}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
