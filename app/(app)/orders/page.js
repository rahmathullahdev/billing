'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        setOrders(Array.isArray(data?.data) ? data.data : []);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const formatItems = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) return '-';
    return items.map((item) => `${item.name || item.particularName || 'Item'} x ${item.quantity || item.qty || 1}`).join(', ');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = orders.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
    const end = Math.min(totalPages, start + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  if (loading) {
    return (
      <div className="orders-history-container">
        <div className="loading-state">
          <i className="bi bi-hourglass-split"></i>
          Loading orders...
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="orders-history-container">
        <div className="empty-state">
          <i className="bi bi-inbox"></i>
          No orders found
        </div>
      </div>
    );
  }

  return (
    <div className="orders-history-container">
      <h2>
        <i className="bi bi-clock-history"></i>
        Order History
      </h2>

      <div className="table-responsive border rounded-3 shadow-sm bg-white mb-3">
        <table className="table app-table align-middle mb-0" style={{ minWidth: '850px' }}>
          <thead>
            <tr>
              <th className="th-left" style={{ width: '130px' }}>Order Id</th>
              <th className="th-left" style={{ minWidth: '180px' }}>Customer</th>
              <th className="th-left" style={{ minWidth: '200px' }}>Items</th>
              <th className="th-right" style={{ width: '120px' }}>Total (₹)</th>
              <th className="th-center" style={{ width: '120px' }}>Payment</th>
              <th className="th-center" style={{ width: '110px' }}>Status</th>
              <th className="th-left" style={{ width: '150px' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((order) => {
              const status = order.paymentDetails?.status || order.paymentStatus || 'PENDING';
              return (
                <tr key={order.orderId || order._id || order.id} className="table-row-hover">
                  <td className="td-left fw-bold text-primary font-monospace">{order.orderId || order.billNumber || order.invoiceNumber}</td>
                  <td className="td-left">
                    <div className="fw-bold" style={{ color: '#002142' }}>{order.customerName || '-'}</div>
                    <small className="text-muted">{order.phoneNumber || order.customerMobileNo || ''}</small>
                  </td>
                  <td className="td-left text-muted small">{formatItems(order.items)}</td>
                  <td className="td-right fw-bold text-success">₹ {Number(order.grandTotal || order.total || 0).toFixed(2)}</td>
                  <td className="td-center"><span className="badge-pill-slate">{order.paymentMethod || order.payment || '-'}</span></td>
                  <td className="td-center">
                    <span className={status === 'COMPLETED' || status === 'PAID' ? 'badge-pill-success' : 'badge-pill-cyan'}>
                      {status}
                    </span>
                  </td>
                  <td className="td-left text-muted small">{formatDate(order.createdAt || order.date)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="pagination-btn">
            <i className="bi bi-chevron-left"></i> Previous
          </button>
          <div className="page-numbers">
            {getPageNumbers().map((page) => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`page-number ${currentPage === page ? 'active' : ''}`}>
                {page}
              </button>
            ))}
          </div>
          <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="pagination-btn">
            Next <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}
