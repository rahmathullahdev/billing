'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const paymentTypes = ['Cash', 'Bank Transfer', 'Online Payment', 'Check', 'UPI'];

export default function MonthlyExpensesPage() {
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyExpenseItems, setMonthlyExpenseItems] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    async function initData() {
      setInitialLoading(true);
      await Promise.all([loadBranches(), loadMonthlyExpenseItems()]);
      setInitialLoading(false);
    }
    initData();
  }, []);

  const loadBranches = async () => {
    try {
      const res = await fetch('/api/branches?page=0&size=100');
      const json = await res.json();
      const pageData = json?.data?.content ? json.data : json?.data?.page || json?.data || {};
      setBranches(Array.isArray(json?.data) ? json.data : (pageData.content || []));
    } catch (error) {
      console.error(error);
    }
  };

  const loadMonthlyExpenseItems = async () => {
    try {
      const res = await fetch('/api/expense-items?page=0&size=200');
      const json = await res.json();
      const items = (json?.data?.content || json?.data || []).filter((item) =>
        !item.type || String(item.type).toUpperCase() === 'MONTHLY'
      );
      setMonthlyExpenseItems(items);
      setExpenseData(items.map((item) => ({
        name: item.name,
        amount: '',
        paymentType: 'Cash',
        isPaid: false
      })));
    } catch (error) {
      console.error(error);
      toast.error('Failed to load monthly expense items');
    }
  };

  const preventNegativeAndExpKeys = (e) => {
    if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
  };

  const updateExpenseData = (index, field, value) => {
    if (field === 'amount' && value !== '' && parseFloat(value) < 0) return;
    setExpenseData((prev) => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const resetForm = () => {
    setCurrentDate(new Date().toISOString().split('T')[0]);
    setSelectedBranch('');
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedYear(new Date().getFullYear());
    setExpenseData(monthlyExpenseItems.map((item) => ({
      name: item.name,
      amount: '',
      paymentType: 'Cash',
      isPaid: false
    })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const expensive = expenseData
        .filter((exp) => exp.name && exp.amount)
        .map((exp) => ({
          name: exp.name,
          amount: parseFloat(exp.amount) || 0,
          paymentType: exp.paymentType,
          isPaid: exp.isPaid
        }));

      const res = await fetch('/api/monthly-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: selectedBranch || null,
          date: currentDate,
          month: parseInt(selectedMonth, 10) || 0,
          year: parseInt(selectedYear, 10) || 0,
          expensive
        })
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success('Monthly expenses saved successfully!');
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save monthly expenses');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="add-monthly-expenses-container p-4">
        <div className="loading-state">
          <i className="bi bi-hourglass-split"></i>
          Initializing monthly recurring expense catalog...
        </div>
      </div>
    );
  }

  return (
    <div className="add-monthly-expenses-container fade-in">
      <div className="monthly-expenses-header">
        <div className="d-flex align-items-center gap-3">
          <div className="banner-icon-box">
            <i className="bi bi-calendar-month-fill"></i>
          </div>
          <div>
            <h2 className="mb-1">Monthly Recurring Expense Ledger</h2>
            <p className="mb-0">Record and track monthly operational overheads, rent, utilities & bill settlements</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="monthly-expenses-form">
        <div className="ops-card mb-4">
          <h4 className="ops-card-title">
            <i className="bi bi-info-circle-fill ops-card-icon"></i>
            Ledger Period & Branch Selection
          </h4>
          <div className="row g-3">
            <div className="col-md-3">
              <div className="rich-form-group">
                <label className="rich-form-label">Ledger Date <span className="text-danger">*</span></label>
                <div className="rich-input-group">
                  <i className="bi bi-calendar-date-fill rich-input-icon ops-icon"></i>
                  <input type="date" className="rich-form-control" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} required />
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="rich-form-group">
                <label className="rich-form-label">Operating Branch <span className="text-danger">*</span></label>
                <div className="rich-input-group">
                  <i className="bi bi-building-fill rich-input-icon ops-icon"></i>
                  <select className="rich-form-control" value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} required>
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.branchId || branch._id || branch.id} value={branch.branchName || branch.name || branch.branchId}>
                        {branch.branchName || branch.name || branch.branchId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="rich-form-group">
                <label className="rich-form-label">Target Month <span className="text-danger">*</span></label>
                <div className="rich-input-group">
                  <i className="bi bi-calendar-event-fill rich-input-icon ops-icon"></i>
                  <select className="rich-form-control" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} required>
                    {months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="rich-form-group">
                <label className="rich-form-label">Year <span className="text-danger">*</span></label>
                <div className="rich-input-group">
                  <i className="bi bi-calendar2-range-fill rich-input-icon ops-icon"></i>
                  <input type="number" onKeyDown={preventNegativeAndExpKeys} onWheel={(e) => e.currentTarget.blur()} className="rich-form-control" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} min="2020" max="2030" required />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ops-card mb-4">
          <h4 className="ops-card-title">
            <i className="bi bi-list-check ops-card-icon"></i>
            Monthly Recurring Expense Items
          </h4>
          {monthlyExpenseItems.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox text-muted display-4 mb-3"></i>
              <p className="text-muted fw-bold">No Monthly Expense Items Found in Catalog.</p>
            </div>
          ) : (
            <div className="monthly-expenses-grid">
              {monthlyExpenseItems.map((item, index) => (
                <div key={item.expenseItemId || item._id || index} className="ops-monthly-item-card">
                  <div className="ops-card-header-bar">
                    <h6 className="ops-item-title mb-0">
                      <i className="bi bi-tag-fill me-2 text-emerald"></i>
                      {item.name}
                    </h6>
                    <span className={`status-pill ${expenseData[index]?.isPaid ? 'paid' : 'unpaid'}`}>
                      {expenseData[index]?.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                  <div className="ops-card-body-content">
                    <div className="row g-3 align-items-center">
                      <div className="col-md-5">
                        <label className="rich-form-label small mb-1">Amount</label>
                        <div className="ops-amount-group">
                          <span className="ops-amount-addon">Rs.</span>
                          <input type="number" min="0" onKeyDown={preventNegativeAndExpKeys} onWheel={(e) => e.currentTarget.blur()} className="ops-amount-input" placeholder="0.00" value={expenseData[index]?.amount || ''} onChange={(e) => updateExpenseData(index, 'amount', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <label className="rich-form-label small mb-1">Payment Method</label>
                        <select className="rich-form-control form-control-sm" value={expenseData[index]?.paymentType || 'Cash'} onChange={(e) => updateExpenseData(index, 'paymentType', e.target.value)}>
                          {paymentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                        </select>
                      </div>
                      <div className="col-md-3 text-end">
                        <label className="rich-form-label small mb-1 d-block">Status Toggle</label>
                        <div className="form-check form-switch custom-status-switch d-inline-block">
                          <input className="form-check-input" type="checkbox" id={`paid-${index}`} checked={expenseData[index]?.isPaid || false} onChange={(e) => updateExpenseData(index, 'isPaid', e.target.checked)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="d-flex align-items-center justify-content-end gap-3 my-4">
          <button type="button" className="btn btn-light border px-4 py-2 fw-bold" onClick={resetForm} disabled={loading}>
            <i className="bi bi-arrow-counterclockwise me-1"></i> Reset Form
          </button>
          <button type="submit" className="btn btn-ops-primary btn-lg px-5 shadow" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving Ledger...
              </>
            ) : (
              <>
                <i className="bi bi-cloud-check-fill me-2"></i>
                Save Monthly Expenses Ledger
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
