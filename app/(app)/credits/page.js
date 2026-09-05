'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function CreditManagementPage() {
  const [creditBills, setCreditBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchCreditBills();
  }, []);

  const fetchCreditBills = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bills/credit-bills');
      const data = await res.json();
      if (data.data) setCreditBills(data.data);
    } catch (e) {
      toast.error('Failed to load credit bills');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;
    const addPay = Number(payAmount) || 0;
    if (addPay <= 0) return toast.error('Enter valid payment amount');

    setIsUpdating(true);
    try {
      const newPaid = (selectedBill.totalPaid || 0) + addPay;
      const newCredit = Math.max(0, (selectedBill.total || 0) - newPaid);

      const res = await fetch(`/api/bills/credit-bills/${selectedBill.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalPaid: newPaid,
          creditAmount: newCredit
        })
      });

      if (res.ok) {
        toast.success('Payment recorded successfully!');
        setSelectedBill(null);
        setPayAmount('');
        fetchCreditBills();
      } else {
        toast.error('Failed to update payment');
      }
    } catch (err) {
      toast.error('Error updating payment');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm" style={{ background: 'linear-gradient(135deg, #002142, #d97706)' }}>
        <h4 className="fw-bold mb-0 text-uppercase">Credit Management</h4>
        <p className="mb-0 text-white-50 small mt-1">Track pending customer credits and collect payments</p>
      </div>

      <div className="table-responsive rounded shadow-sm bg-white p-3">
        <table className="data-table w-100">
          <thead>
            <tr>
              <th>#</th>
              <th>Bill Number</th>
              <th>Customer</th>
              <th>Total Bill</th>
              <th>Amount Paid</th>
              <th>Credit Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-4">Loading credit bills...</td></tr>
            ) : creditBills.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-4 text-muted">No pending credit bills.</td></tr>
            ) : (
              creditBills.map((bill, i) => (
                <tr key={bill.id}>
                  <td>{i + 1}</td>
                  <td className="fw-bold text-primary">{bill.billNumber}</td>
                  <td>{bill.customerName || '-'}</td>
                  <td className="fw-semibold">₹{Number(bill.total || 0).toFixed(2)}</td>
                  <td className="text-success">₹{Number(bill.totalPaid || 0).toFixed(2)}</td>
                  <td className="fw-bold text-danger">₹{Number(bill.creditAmount || 0).toFixed(2)}</td>
                  <td>
                    <button className="btn btn-sm btn-success" onClick={() => { setSelectedBill(bill); setPayAmount(bill.creditAmount || ''); }}>
                      💵 Collect Payment
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedBill && (
        <div className="modal-backdrop" onClick={() => setSelectedBill(null)}>
          <div className="modal-box p-4 bg-white rounded shadow-lg" style={{ maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h5 className="fw-bold">Collect Payment - Bill #{selectedBill.billNumber}</h5>
            <p className="text-muted small">Customer: {selectedBill.customerName}</p>
            <p className="text-danger fw-bold">Current Pending: ₹{Number(selectedBill.creditAmount || 0).toFixed(2)}</p>

            <form onSubmit={handleCollectPayment}>
              <div className="form-group mb-3">
                <label className="form-label">Payment Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                />
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedBill(null)}>Cancel</button>
                <button type="submit" className="btn btn-success btn-sm" disabled={isUpdating}>{isUpdating ? 'Saving...' : 'Record Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
