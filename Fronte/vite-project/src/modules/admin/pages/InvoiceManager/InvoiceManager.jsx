import React, { useEffect, useMemo, useState } from 'react';
import { Filter, ReceiptText, RotateCcw, Search, X } from 'lucide-react';
import api from '../../../../services/api';
import './InvoiceManager.css';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;

const InvoiceManager = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [filters, setFilters] = useState({
        searchTerm: '',
        fromDate: '',
        toDate: '',
        minAmount: '',
        maxAmount: '',
    });

    const fetchInvoices = async (query) => {
        setLoading(true);
        try {
            const params = {};
            if (query.searchTerm.trim()) params.searchTerm = query.searchTerm.trim();
            if (query.fromDate) params.fromDate = new Date(`${query.fromDate}T00:00:00`).toISOString();
            if (query.toDate) params.toDate = new Date(`${query.toDate}T23:59:59`).toISOString();
            if (query.minAmount !== '') params.minAmount = Number(query.minAmount);
            if (query.maxAmount !== '') params.maxAmount = Number(query.maxAmount);
            const res = await api.get('/admin/invoices', { params });
            setInvoices(res.data || []);
        } catch {
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchInvoices(filters);
        }, 400);

        return () => clearTimeout(debounce);
    }, [filters]);

    const totalPaid = useMemo(
        () => invoices.reduce((sum, item) => sum + Number(item.finalAmount || 0), 0),
        [invoices]
    );

    const resetFilters = () => {
        setFilters({
            searchTerm: '',
            fromDate: '',
            toDate: '',
            minAmount: '',
            maxAmount: '',
        });
    };

    return (
        <div className="invoice-page">
            <div className="invoice-header">
                <div className="invoice-title-wrap">
                    <ReceiptText size={20} />
                    <div>
                        <h2>Quản lý hóa đơn thành công</h2>
                        <p>{invoices.length} hóa đơn paid - Tổng cộng: {formatCurrency(totalPaid)}</p>
                    </div>
                </div>
                <div className="invoice-filters">
                    <div className="filter-input-group search-group">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Tìm theo mã đơn, tên khách hoặc email..."
                            value={filters.searchTerm}
                            onChange={(e) => setFilters((p) => ({ ...p, searchTerm: e.target.value }))}
                        />
                    </div>
                    <div className="filter-input-group">
                        <Filter size={16} />
                        <input
                            type="date"
                            value={filters.fromDate}
                            onChange={(e) => setFilters((p) => ({ ...p, fromDate: e.target.value }))}
                        />
                    </div>
                    <div className="filter-input-group">
                        <Filter size={16} />
                        <input
                            type="date"
                            value={filters.toDate}
                            onChange={(e) => setFilters((p) => ({ ...p, toDate: e.target.value }))}
                        />
                    </div>
                    <div className="filter-input-group">
                        <input
                            type="number"
                            min="0"
                            placeholder="Giá từ"
                            value={filters.minAmount}
                            onChange={(e) => setFilters((p) => ({ ...p, minAmount: e.target.value }))}
                        />
                    </div>
                    <div className="filter-input-group">
                        <input
                            type="number"
                            min="0"
                            placeholder="Đến giá"
                            value={filters.maxAmount}
                            onChange={(e) => setFilters((p) => ({ ...p, maxAmount: e.target.value }))}
                        />
                    </div>
                    <button className="invoice-reset-btn" onClick={resetFilters}>
                        <RotateCcw size={14} />
                        <span>Làm mới</span>
                    </button>
                </div>
            </div>

            <div className="invoice-table-wrap">
                {loading ? (
                    <div className="invoice-empty">Đang tải danh sách hóa đơn...</div>
                ) : (
                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th>Mã ĐH</th>
                                <th>Khách hàng</th>
                                <th>Email</th>
                                <th>Tổng tiền</th>
                                <th>Ngày thanh toán</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 ? (
                                <tr>
                                    <td className="invoice-empty" colSpan={5}>Không tìm thấy hóa đơn nào.</td>
                                </tr>
                            ) : (
                                invoices.map((invoice) => (
                                    <tr key={invoice.orderCode} onClick={() => setSelectedInvoice(invoice)}>
                                        <td>{invoice.orderCode}</td>
                                        <td>{invoice.customerName || 'Khách lẻ'}</td>
                                        <td>{invoice.customerEmail || '—'}</td>
                                        <td>{formatCurrency(invoice.finalAmount)}</td>
                                        <td>{new Date(invoice.paidAt).toLocaleString('vi-VN')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedInvoice && (
                <div className="invoice-modal-overlay" onClick={() => setSelectedInvoice(null)}>
                    <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="invoice-close-btn" onClick={() => setSelectedInvoice(null)}>
                            <X size={16} />
                        </button>
                        <h3>Chi tiết hóa đơn {selectedInvoice.orderCode}</h3>
                        <p><strong>Tên phim:</strong> {selectedInvoice.movieTitle}</p>
                        <p><strong>Suất chiếu:</strong> {new Date(selectedInvoice.showtime).toLocaleString('vi-VN')}</p>
                        <p><strong>Phòng:</strong> {selectedInvoice.roomName}</p>
                        <p><strong>Ghế:</strong> {selectedInvoice.seats?.map((s) => s.seatLabel).join(', ') || '—'}</p>
                        <p><strong>Email:</strong> {selectedInvoice.customerEmail || '—'}</p>
                        <p><strong>Phương thức thanh toán:</strong> {selectedInvoice.paymentMethod || '—'}</p>
                        <p><strong>Tổng tiền:</strong> {formatCurrency(selectedInvoice.finalAmount)}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceManager;
