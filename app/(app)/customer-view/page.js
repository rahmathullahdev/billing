'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function CustomerViewPage() {
  const [customers, setCustomers] = useState([]);
  const [selectedCust, setSelectedCust] = useState(null);
  const [custBills, setCustBills] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(d => {
      if (d.data) setCustomers(d.data);
    });
  }, []);

  const handleSelectCustomer = async (cust) => {
    setSelectedCust(cust);
    setLoading(true);
    try {
      const res = await fetch(`/api/bills?customerName=${encodeURIComponent(cust.name)}&limit=100`);
      const data = await res.json();
      if (data.data) setCustBills(data.data);
    } catch (e) {
      toast.error('Failed to load customer bills');
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = custBills.reduce((a, b) => a + (Number(b.total) || 0), 0);
  const totalCredit = custBills.reduce((a, b) => a + (Number(b.creditAmount) || 0), 0);

  return (
    <div className="fade-in">
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm" style={{ background: 'linear-gradient(135deg, #002142, #0891b2)' }}>
        <h4 className="fw-bold mb-0 text-uppercase">Customer 360 View</h4>
        <p className="mb-0 text-white-50 small mt-1">Deep analytics and history for individual customers</p>
      </div>

      <div className="row">
        <div className="col-md-4 mb-3">
          <div className="bg-white p-3 rounded shadow-sm">
            <h6>Select Customer</h6>
            <div className="list-group max-h-400 overflow-auto">
              {customers.map(c => (
                <button
                  key={c.id}
                  className={`list-group-item list-group-item-action ${selectedCust?.id === c.id ? 'active' : ''}`}
                  onClick={() => handleSelectCustomer(c)}
                >
                  <div className="fw-bold">{c.name}</div>
                  <div className="small opacity-75">{c.phoneNumber || 'No Mobile'}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-md-8">
          {selectedCust ? (
            <div className="bg-white p-4 rounded shadow-sm">
              <h4>{selectedCust.name}</h4>
              <p className="text-muted">Mobile: {selectedCust.phoneNumber || 'N/A'} | Email: {selectedCust.email || 'N/A'} | GST: {selectedCust.taxNumber || 'N/A'}</p>

              <div className="d-flex gap-3 my-3">
                <div className="p-3 bg-light rounded flex-fill">
                  <span className="text-muted small">Total Spent</span>
                  <h4 className="text-success mb-0">₹{totalSpent.toFixed(2)}</h4>
                </div>
                <div className="p-3 bg-light rounded flex-fill">
                  <span className="text-muted small">Pending Credit</span>
                  <h4 className="text-danger mb-0">₹{totalCredit.toFixed(2)}</h4>
                </div>
                <div className="p-3 bg-light rounded flex-fill">
                  <span className="text-muted small">Total Orders</span>
                  <h4 className="text-primary mb-0">{custBills.length}</h4>
                </div>
              </div>

              <h5>Bill History</h5>
              <div className="table-responsive">
                <table className="data-table w-100">
                  <thead>
                    <tr>
                      <th>Bill #</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Credit</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? <tr><td colSpan="5" className="text-center py-3">Loading history...</td></tr> : custBills.map(b => (
                      <tr key={b.id}>
                        <td className="fw-bold text-primary">{b.billNumber}</td>
                        <td>₹{Number(b.total || 0).toFixed(2)}</td>
                        <td className="text-success">₹{Number(b.totalPaid || 0).toFixed(2)}</td>
                        <td className="text-danger">₹{Number(b.creditAmount || 0).toFixed(2)}</td>
                        <td className="small text-muted">{new Date(b.createdAt || b.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded shadow-sm text-center text-muted">
              Select a customer from the left list to view their 360 profile and bill history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
