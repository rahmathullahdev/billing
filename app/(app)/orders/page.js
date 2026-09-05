'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.data) setOrders(data.data);
    } catch (e) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm" style={{ background: 'linear-gradient(135deg, #002142, #7c3aed)' }}>
        <h4 className="fw-bold mb-0 text-uppercase">Order History</h4>
        <p className="mb-0 text-white-50 small mt-1">Track all orders and fulfillment statuses</p>
      </div>

      <div className="table-responsive rounded shadow-sm bg-white p-3">
        <table className="data-table w-100">
          <thead>
            <tr>
              <th>#</th>
              <th>Order / Bill No</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total Amount</th>
              <th>Payment</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-4">Loading order history...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-4 text-muted">No orders found.</td></tr>
            ) : (
              orders.map((ord, i) => (
                <tr key={ord.id}>
                  <td>{i + 1}</td>
                  <td className="fw-bold text-primary">{ord.billNumber}</td>
                  <td>{ord.customerName || '-'}</td>
                  <td>{ord.totalItems || 1} item(s)</td>
                  <td className="fw-semibold text-success">₹{Number(ord.total || 0).toFixed(2)}</td>
                  <td><span className="badge bg-secondary">{ord.payment || 'Cash'}</span></td>
                  <td className="small text-muted">{new Date(ord.createdAt || ord.date).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
