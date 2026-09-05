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

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Order Id</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((order) => {
              const status = order.paymentDetails?.status || order.paymentStatus || 'PENDING';
              return (
                <tr key={order.orderId || order._id || order.id}>
                  <td>{order.orderId || order.billNumber || order.invoiceNumber}</td>
                  <td>
                    {order.customerName || '-'} <br />
                    <small className="text-muted">{order.phoneNumber || order.customerMobileNo || ''}</small>
                  </td>
                  <td>{formatItems(order.items)}</td>
                  <td>Rs. {Number(order.grandTotal || order.total || 0).toFixed(2)}</td>
                  <td>{order.paymentMethod || order.payment || '-'}</td>
                  <td>
                    <span className={`badge ${status === 'COMPLETED' || status === 'PAID' ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {status}
                    </span>
                  </td>
                  <td>{formatDate(order.createdAt || order.date)}</td>
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
