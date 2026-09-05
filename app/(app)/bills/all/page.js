'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ReceiptPopup from '@/components/ReceiptPopup';

export default function ViewBillsPage() {
  const router = useRouter();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [dateFilter, setDateFilter] = useState('today');
  const [customerFilter, setCustomerFilter] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [pageSize, setPageSize] = useState(15);
  const [selectedBill, setSelectedBill] = useState(null);
  const [printBill, setPrintBill] = useState(null);
  const [kpi, setKpi] = useState({
    totalAmount: 0,
    paidAmount: 0,
    creditAmount: 0,
    todayOrderCount: 0,
    completedOrders: 0,
    todayCreditOrderCount: 0
  });

  const fetchBills = async () => {
    setLoading(true);
    try {
      const url = `/api/bills?page=${page}&limit=${pageSize}&filter=${dateFilter}${customerFilter ? `&customerName=${encodeURIComponent(customerFilter)}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.data) {
        setBills(data.data);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.total || data.data.length);
      }
      if (data.kpi) setKpi(data.kpi);
    } catch (e) {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [page, dateFilter, pageSize, customerFilter]);

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(d => {
      if (d.data) setCustomers(d.data);
    });
  }, []);

  const handlePrintClick = (bill) => {
    let particulars = [];
    try {
      particulars = typeof bill.particulars === 'string' ? JSON.parse(bill.particulars) : (bill.particulars || []);
    } catch (e) {}

    const items = particulars.map(p => ({
      name: p.name || p.particularId || 'ITEM',
      quantity: p.qty || 1,
      price: p.price || 0
    }));

    setPrintBill({
      invoiceNumber: bill.billNumber,
      orderId: bill.id,
      createdAt: bill.createdAt || bill.date,
      username: bill.employee,
      customerName: bill.customerName || 'CASH CUSTOMER',
      grandTotal: bill.total || 0,
      paidAmount: bill.totalPaid || 0,
      tax: (bill.total || 0) - (bill.totalWithGst || bill.actualTotal || bill.total || 0),
      items: items,
      creditType: bill.creditAmount > 0 ? 'CREDIT' : 'CASH',
      pendingAmount: bill.creditAmount || 0,
      taxPercent: bill.billNumber && String(bill.billNumber).toUpperCase().endsWith('-E') ? 0 : 18,
      subtotal: bill.actualTotal || bill.total || 0,
      gstin: bill.customerGstNo || ''
    });
  };

  return (
    <div className="view-bills-container fade-in">
      <div className="machine-banner position-relative text-center text-white mb-3 shadow-sm" style={{ background: 'linear-gradient(135deg, #002142, #e64051)', padding: '20px', borderRadius: '12px' }}>
        <h4 className="fw-bold mb-0 text-uppercase">All Bills Management</h4>
        <p className="mb-0 text-white-50 small mt-1">Comprehensive oversight and administration of generated bills</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-cards-grid d-flex flex-wrap gap-3 mb-4">
        <div className="kpi-card p-3 bg-white rounded shadow-sm flex-fill">
          <h3 className="kpi-value text-success">₹{(kpi.totalAmount || 0).toFixed(2)}</h3>
          <span className="kpi-label text-muted small">Total Revenue</span>
        </div>
        <div className="kpi-card p-3 bg-white rounded shadow-sm flex-fill">
          <h3 className="kpi-value text-primary">{kpi.todayOrderCount || 0}</h3>
          <span className="kpi-label text-muted small">Total Orders</span>
        </div>
        <div className="kpi-card p-3 bg-white rounded shadow-sm flex-fill">
          <h3 className="kpi-value text-info">{kpi.completedOrders || 0}</h3>
          <span className="kpi-label text-muted small">Paid Orders</span>
        </div>
        <div className="kpi-card p-3 bg-white rounded shadow-sm flex-fill">
          <h3 className="kpi-value text-warning">{kpi.todayCreditOrderCount || 0}</h3>
          <span className="kpi-label text-muted small">Credit Orders</span>
        </div>
        <div className="kpi-card p-3 bg-white rounded shadow-sm flex-fill">
          <h3 className="kpi-value text-success">₹{(kpi.paidAmount || 0).toFixed(2)}</h3>
          <span className="kpi-label text-muted small">Paid Amount</span>
        </div>
        <div className="kpi-card p-3 bg-white rounded shadow-sm flex-fill">
          <h3 className="kpi-value text-danger">₹{(kpi.creditAmount || 0).toFixed(2)}</h3>
          <span className="kpi-label text-muted small">Credit Balance</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-card mb-4 bg-white p-3 rounded shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-2">
          <label className="fw-bold small text-muted">PERIOD:</label>
          <select value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(0); }} className="form-select form-select-sm" style={{ width: '150px' }}>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
          </select>
        </div>

        <div className="d-flex align-items-center gap-2 position-relative">
          <label className="fw-bold small text-muted">CUSTOMER:</label>
          <input
            type="text"
            placeholder="Search customer..."
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              if (!e.target.value) { setCustomerFilter(''); setPage(0); }
              setShowCustomerDropdown(true);
            }}
            className="form-control form-control-sm"
            style={{ width: '200px' }}
          />
          {showCustomerDropdown && customerSearch && (
            <ul className="customer-dropdown-list">
              {customers.filter(c => c.name?.toLowerCase().includes(customerSearch.toLowerCase())).map((c, idx) => (
                <li key={idx} onMouseDown={() => { setCustomerSearch(c.name); setCustomerFilter(c.name); setShowCustomerDropdown(false); setPage(0); }}>
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Bills Table */}
      <div className="table-responsive rounded shadow-sm bg-white">
        <table className="bills-table data-table w-100">
          <thead>
            <tr>
              <th className="text-center">S.No</th>
              <th>Bill Number</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Employee</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-4">Loading...</td></tr>
            ) : bills.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-4 text-muted">No bills found</td></tr>
            ) : (
              bills.map((bill, index) => (
                <tr key={bill.id}>
                  <td className="text-center">{page * pageSize + index + 1}</td>
                  <td className="fw-bold text-primary">{bill.billNumber}</td>
                  <td>{bill.customerName || '-'}</td>
                  <td className="fw-semibold text-success">₹{Number(bill.total || 0).toFixed(2)}</td>
                  <td className="small text-muted">{new Date(bill.createdAt || bill.date).toLocaleDateString()}</td>
                  <td><span className="badge bg-light text-dark border">{bill.employee || '-'}</span></td>
                  <td>
                    <div className="d-flex justify-content-center gap-2">
                      <button className="btn btn-sm btn-outline-secondary" title="Print" onClick={() => handlePrintClick(bill)}>🖨️</button>
                      <button className="btn btn-sm btn-outline-primary" title="View" onClick={() => setSelectedBill(bill)}>👁️</button>
                      <button className="btn btn-sm btn-outline-danger" title="Edit" onClick={() => router.push(`/bills/create?id=${bill.id}`)}>✏️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <span className="small text-muted">Total records: {totalElements}</span>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-light border" disabled={page === 0} onClick={() => setPage(p => p - 1)}>PREV</button>
          <span className="small px-2 py-1 align-self-center">Page {page + 1} of {totalPages || 1}</span>
          <button className="btn btn-sm btn-light border" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>NEXT</button>
        </div>
      </div>

      {/* Bill View Modal */}
      {selectedBill && (
        <div className="modal-backdrop" onClick={() => setSelectedBill(null)}>
          <div className="modal-box p-4 bg-white rounded shadow-lg" style={{ maxWidth: '500px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h4 className="fw-bold">Bill #{selectedBill.billNumber}</h4>
            <hr />
            <p><strong>Customer:</strong> {selectedBill.customerName || 'N/A'}</p>
            <p><strong>Employee:</strong> {selectedBill.employee || 'N/A'}</p>
            <p><strong>Total Amount:</strong> ₹{Number(selectedBill.total || 0).toFixed(2)}</p>
            <p><strong>Paid Amount:</strong> ₹{Number(selectedBill.totalPaid || 0).toFixed(2)}</p>
            <p><strong>Credit Amount:</strong> ₹{Number(selectedBill.creditAmount || 0).toFixed(2)}</p>
            <div className="mt-3 text-end">
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedBill(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {printBill && <ReceiptPopup orderDetails={printBill} onClose={() => setPrintBill(null)} />}
    </div>
  );
}
