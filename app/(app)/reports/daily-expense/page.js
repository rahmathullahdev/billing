'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function DailyExpenseReportPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchReport();
  }, [filterDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/daily-expenses');
      const data = await res.json();
      if (data.data) {
        const filtered = data.data.filter(e => !filterDate || e.date === filterDate);
        setExpenses(filtered);
      }
    } catch (e) {
      toast.error('Error fetching report');
    } finally {
      setLoading(false);
    }
  };

  const totalExpense = expenses.reduce((a, b) => a + (Number(b.amount) || 0), 0);

  return (
    <div className="fade-in">
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm" style={{ background: 'linear-gradient(135deg, #002142, #475569)' }}>
        <h4 className="fw-bold mb-0 text-uppercase">Daily Expense Report</h4>
      </div>

      <div className="bg-white p-3 rounded shadow-sm mb-3 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <label className="fw-bold">Select Date:</label>
          <input type="date" className="form-control" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: '180px' }} />
        </div>
        <div>
          <span className="text-muted me-2">Total Expense for Day:</span>
          <strong className="text-danger fs-5">₹{totalExpense.toFixed(2)}</strong>
        </div>
      </div>

      <div className="table-responsive rounded shadow-sm bg-white p-3">
        <table className="data-table w-100">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Expense Item</th>
              <th>Amount</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5" className="text-center py-3">Loading...</td></tr> : expenses.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-3 text-muted">No expenses recorded for this date.</td></tr>
            ) : expenses.map((ex, i) => (
              <tr key={ex.id}>
                <td>{i + 1}</td>
                <td>{ex.date}</td>
                <td className="fw-bold">{ex.expenseItem}</td>
                <td className="text-danger fw-bold">₹{Number(ex.amount || 0).toFixed(2)}</td>
                <td>{ex.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
