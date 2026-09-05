'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function MonthlyExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ month: new Date().toISOString().slice(0, 7), expenseItem: '', amount: 0, notes: '' });

  useEffect(() => { fetchExpenses(); }, []);
  const fetchExpenses = async () => {
    setLoading(true);
    try { const res = await fetch('/api/monthly-expenses'); const data = await res.json(); if (data.data) setExpenses(data.data); } catch(e) { toast.error('Error'); } finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/monthly-expenses', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(formData) });
      if (res.ok) { toast.success('Saved'); setModalOpen(false); fetchExpenses(); }
    } catch(e) { toast.error('Error'); }
  };

  return (
    <div className="fade-in">
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm" style={{ background: 'linear-gradient(135deg, #002142, #b91c1c)' }}>
        <h4 className="fw-bold mb-0 text-uppercase">Monthly Expenses</h4>
      </div>
      <div className="d-flex justify-content-end mb-3"><button className="btn btn-primary" onClick={() => { setModalOpen(true); }}>+ Record Monthly Expense</button></div>
      <div className="table-responsive rounded shadow-sm bg-white p-3">
        <table className="data-table w-100">
          <thead><tr><th>#</th><th>Month</th><th>Item</th><th>Amount</th><th>Notes</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan="5">Loading...</td></tr> : expenses.map((ex, i) => (
            <tr key={ex.id}>
              <td>{i+1}</td>
              <td>{ex.month}</td>
              <td className="fw-bold">{ex.expenseItem || 'General'}</td>
              <td className="fw-bold text-danger">₹{Number(ex.amount || 0).toFixed(2)}</td>
              <td>{ex.notes || '-'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-box p-4 bg-white rounded shadow-lg" style={{ maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h5>Record Monthly Expense</h5>
            <form onSubmit={handleSave}>
              <div className="form-group my-2"><label>Month (YYYY-MM)</label><input type="month" className="form-control" value={formData.month} onChange={e => setFormData({ ...formData, month: e.target.value })} required /></div>
              <div className="form-group my-2"><label>Expense Item</label><input type="text" className="form-control" value={formData.expenseItem} onChange={e => setFormData({ ...formData, expenseItem: e.target.value })} required /></div>
              <div className="form-group my-2"><label>Amount (₹)</label><input type="number" step="0.01" className="form-control" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required /></div>
              <div className="d-flex justify-content-end gap-2 mt-3"><button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary btn-sm">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
