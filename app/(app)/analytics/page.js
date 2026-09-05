'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, [filter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?filter=${filter}`);
      const result = await res.json();
      if (result) setData(result);
    } catch (e) {
      toast.error('Error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm" style={{ background: 'linear-gradient(135deg, #002142, #0d9488)' }}>
        <h4 className="fw-bold mb-0 text-uppercase">Analytics & Business Intelligence</h4>
        <p className="mb-0 text-white-50 small mt-1">Real-time charts, revenue breakdown, and trends</p>
      </div>

      <div className="bg-white p-3 rounded shadow-sm mb-4 d-flex justify-content-between align-items-center">
        <span className="fw-bold">Timeframe:</span>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="form-select" style={{ width: '160px' }}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-5">Loading analytics data...</div>
      ) : data ? (
        <div className="row g-3">
          <div className="col-md-4">
            <div className="p-4 bg-white rounded shadow-sm border-start border-4 border-success">
              <span className="text-muted small">Total Revenue</span>
              <h3 className="text-success fw-bold mb-0">₹{(data.totalRevenue || 0).toFixed(2)}</h3>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-4 bg-white rounded shadow-sm border-start border-4 border-primary">
              <span className="text-muted small">Total Orders</span>
              <h3 className="text-primary fw-bold mb-0">{data.totalOrders || 0}</h3>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-4 bg-white rounded shadow-sm border-start border-4 border-danger">
              <span className="text-muted small">Pending Credit</span>
              <h3 className="text-danger fw-bold mb-0">₹{(data.totalCredit || 0).toFixed(2)}</h3>
            </div>
          </div>

          <div className="col-md-6 mt-4">
            <div className="p-4 bg-white rounded shadow-sm">
              <h5>Payment Method Breakdown</h5>
              <hr />
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between">
                  <span>Cash Payments</span>
                  <strong className="text-success">₹{(data.cashTotal || 0).toFixed(2)}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <span>UPI / GPay</span>
                  <strong className="text-primary">₹{(data.upiTotal || 0).toFixed(2)}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <span>Card / Bank Transfer</span>
                  <strong className="text-info">₹{(data.cardTotal || 0).toFixed(2)}</strong>
                </li>
              </ul>
            </div>
          </div>

          <div className="col-md-6 mt-4">
            <div className="p-4 bg-white rounded shadow-sm">
              <h5>Top Performing Employees</h5>
              <hr />
              <ul className="list-group list-group-flush">
                {(data.topEmployees || []).map((emp, idx) => (
                  <li key={idx} className="list-group-item d-flex justify-content-between">
                    <span>{emp.name}</span>
                    <strong className="text-dark">₹{Number(emp.total || 0).toFixed(2)} ({emp.count} bills)</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
