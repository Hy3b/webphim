import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { CircleDollarSign, Ticket, User, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminReportApi } from '../../../../services/adminReportApi';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalTicketsSold: 0,
        newCustomersThisMonth: 0,
        dailyRevenue: []
    });
    const [loading, setLoading] = useState(true);
    
    // Default name based on the screenshot
    const displayName = user?.fullName || 'Hoàn Trần';

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const data = await adminReportApi.getOverview();
                setStats({
                    totalRevenue: data.totalRevenue || 0,
                    totalTicketsSold: data.totalTicketsSold || 0,
                    newCustomersThisMonth: data.newCustomersThisMonth || 0,
                    dailyRevenue: data.dailyRevenue || []
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOverview();
    }, []);

    // Format currency
    const formatCurrency = (value) => {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(2) + 'tr';
        }
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    // Current Month/Year for display
    const currentMonthYear = new Date().toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' });

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h1 className="welcome-text">Xin chào, {displayName}!</h1>
                <p className="welcome-subtext">Sau đây là những gì đang diễn ra tại hệ thống của bạn.</p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20" style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                    <Loader2 className="animate-spin" size={40} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : (
                <>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-title">Doanh thu</span>
                                <div className="stat-icon" style={{backgroundColor: '#e0faea'}}>
                                    <CircleDollarSign size={20} color="#10b981" />
                                </div>
                            </div>
                            <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
                            <div className="stat-footer positive">
                                <span>Tích lũy hệ thống</span>
                                <span className="trend">Toàn thời gian</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-title">Tổng vé</span>
                                <div className="stat-icon" style={{backgroundColor: '#e6f0ff'}}>
                                    <Ticket size={20} color="#3b82f6" />
                                </div>
                            </div>
                            <div className="stat-value">{stats.totalTicketsSold}</div>
                            <div className="stat-footer positive">
                                <span>Vé đã bán thành công</span>
                                <span className="trend">Toàn thời gian</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-title">Khách hàng mới</span>
                                <div className="stat-icon" style={{backgroundColor: '#fffbeb'}}>
                                    <User size={20} color="#f59e0b" />
                                </div>
                            </div>
                            <div className="stat-value">{stats.newCustomersThisMonth}</div>
                            <div className="stat-footer positive">
                                <span>Đăng ký mới</span>
                                <span className="trend">Tháng {currentMonthYear}</span>
                            </div>
                        </div>
                    </div>


                    <div className="chart-container">
                        <h3 className="chart-title">Doanh thu theo thời gian</h3>
                        
                        <div style={{ height: 350, width: '100%', marginTop: '20px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={stats.dailyRevenue}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => {
                                            if(!value) return "";
                                            const date = new Date(value);
                                            return date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' });
                                        }} 
                                    />
                                    <YAxis 
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => formatCurrency(value)} 
                                        width={80} 
                                    />
                                    <Tooltip 
                                        formatter={(value) => [formatCurrency(value), 'Doanh thu']} 
                                        labelFormatter={(label) => {
                                            if(!label) return "";
                                            const date = new Date(label);
                                            return date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
                                        }} 
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stroke="#06b6d4" 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorRevenue)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
