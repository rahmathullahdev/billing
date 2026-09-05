'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ReceiptPopup from '@/components/ReceiptPopup';
import BillDetailsModal from '@/components/BillDetailsModal';

export default function TodayBillsPage() {
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState({
    todayBillsTotal: 0,
    todayOrderCount: 0,
    todayCreditOrderCount: 0,
    todayCreditOrdersAmount: 0,
    creditPaidAmount: 0,
    creditBalanceAmount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [selectedBill, setSelectedBill] = useState(null);
  const [printBill, setPrintBill] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBills = bills.filter(bill => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (bill.customerName && bill.customerName.toLowerCase().includes(searchLower)) ||
      (bill.billNumber && bill.billNumber.toLowerCase().includes(searchLower))
    );
  });

  const loadTodayBills = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bills/today?page=${page}&size=${pageSize}`);
      const data = await res.json();
      if (data.data) {
        if (data.data.summary) setSummary(data.data.summary);
        if (data.data.bills) {
          setBills(data.data.bills.content || []);
          setTotalPages(data.data.bills.page?.totalPages || data.data.bills.totalPages || 0);
          setTotalElements(data.data.bills.page?.totalElements || data.data.bills.totalElements || data.data.bills.content?.length || 0);
        }
      }
    } catch (error) {
      console.error("Error fetching today's bills:", error);
      toast.error("Failed to load today's bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const handlePrintClick = (bill) => {
    let particulars = [];
    try {
      if (typeof bill.particulars === 'string') {
        particulars = JSON.parse(bill.particulars);
      } else if (Array.isArray(bill.particulars)) {
        particulars = bill.particulars;
      }
    } catch (error) {
      console.error('Error parsing particulars:', error);
    }

    const items = particulars.map((p) => ({
      name: p.name || p.particularName,
      quantity: p.qty || 1,
      price: p.price || 0,
    }));

    setPrintBill({
      invoiceNumber: bill.billNumber,
      orderId: bill.id,
      createdAt: bill.createdAt || bill.date,
      username: bill.employee,
      customerName: bill.customerName || 'CASH CUSTOMER',
      grandTotal: bill.total || 0,
      paidAmount: bill.totalPaid || 0,
      tax: bill.gstAmount || ((bill.total || 0) - (bill.totalWithGst || 0)),
      items: items,
      creditType: bill.creditAmount > 0 ? 'CREDIT' : 'CASH',
      pendingAmount: bill.creditAmount || 0,
      taxPercent: bill.gstPercentage ? bill.gstPercentage : (bill.billNumber && String(bill.billNumber).toUpperCase().endsWith('-E') ? 0 : 18),
      subtotal: bill.totalWithGst || bill.total || 0,
      gstin: bill.customerGstNo || '',
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="today-bills-container fade-in">
      <div className="today-banner position-relative text-center text-white mb-3 shadow-sm">
        <div className="d-flex align-items-center justify-content-center gap-2">
          <i className="bi bi-calendar2-check fs-4 text-danger"></i>
          <h4 className="fw-bold mb-0 text-uppercase tracking-wider">
            Today's Bills Dashboard
          </h4>
        </div>
        <p className="mb-0 text-white-50 small mt-1">
          Real-time overview of today's sales, credits, and generated bills
        </p>
      </div>

      <div className="kpi-cards-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper icon-green">
            <i className="bi bi-currency-rupee"></i>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">₹{summary.todayBillsTotal.toFixed(2)}</h3>
            <span className="kpi-label">Total Revenue</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper icon-blue">
            <i className="bi bi-receipt"></i>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">{summary.todayOrderCount}</h3>
            <span className="kpi-label">Total Orders</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper icon-purple">
            <i className="bi bi-cart-dash"></i>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">{summary.todayCreditOrderCount}</h3>
            <span className="kpi-label">Credit Orders</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper icon-orange">
            <i className="bi bi-wallet2"></i>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">₹{summary.todayCreditOrdersAmount.toFixed(2)}</h3>
            <span className="kpi-label">Credit Total</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper icon-cyan">
            <i className="bi bi-cash-coin"></i>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">₹{summary.creditPaidAmount.toFixed(2)}</h3>
            <span className="kpi-label">Credit Paid</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper icon-red">
            <i className="bi bi-exclamation-circle"></i>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">₹{summary.creditBalanceAmount.toFixed(2)}</h3>
            <span className="kpi-label">Credit Balance</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Card */}
      <div className="filter-card mb-3 bg-white rounded-3 shadow-sm border p-2 px-3">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-funnel-fill text-danger fs-6"></i>
            <span className="fw-bold text-nowrap" style={{ color: '#002142', fontSize: '0.88rem' }}>
              Filter Today's Bills:
            </span>
          </div>

          <div className="flex-grow-1 ms-2" style={{ maxWidth: '450px' }}>
            <input
              type="text"
              className="form-control form-control-sm fw-semibold shadow-none"
              style={{ border: '1px solid #cbd5e1', borderRadius: '6px', color: '#002142', fontSize: '0.85rem' }}
              placeholder="Search customer name or bill number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-responsive rounded shadow-sm bg-white pb-2">
        <table className="bills-table data-table w-100 mb-0">
          <thead>
            <tr>
              <th className="text-center" style={{ width: '60px' }}>S.No</th>
              <th>Bill Number</th>
              <th>Customer Name</th>
              <th>Amount (₹)</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Employee</th>
              <th className="text-center" style={{ width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-0">
                  <div className="premium-loader-container">
                    <div className="premium-loader"></div>
                    <span className="loader-text mt-3">Fetching Today's Bills...</span>
                  </div>
                </td>
              </tr>
            ) : filteredBills.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-5 text-muted">
                  <i className="bi bi-folder-x fs-3 d-block mb-2 text-secondary"></i>
                  No bills found matching your search.
                </td>
              </tr>
            ) : (
              filteredBills.map((bill, index) => (
                <tr key={bill.id} className="table-row-hover border-bottom">
                  <td className="text-center fw-semibold text-muted">
                    {page * pageSize + index + 1}
                  </td>
                  <td className="fw-bold text-primary">{bill.billNumber}</td>
                  <td>{bill.customerName || '-'}</td>
                  <td className="fw-semibold text-success">
                    ₹{bill.total ? bill.total.toFixed(2) : '0.00'}
                  </td>
                  <td>
                    <span className={`badge ${bill.billStatus?.toLowerCase() === 'credit' ? 'bg-warning text-dark' : 'bg-success'}`}>
                      {bill.billStatus || 'PAID'}
                    </span>
                  </td>
                  <td className="text-muted small">
                    {formatDate(bill.createdAt || bill.date)}
                  </td>
                  <td>
                    {bill.employee ? (
                      <span className="badge bg-light text-dark border">
                        {bill.employee}
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex justify-content-center gap-2">
                      <button
                        className="btn btn-sm btn-outline-secondary modern-action-btn"
                        title="Print"
                        onClick={() => handlePrintClick(bill)}
                      >
                        <i className="bi bi-printer"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary modern-action-btn"
                        title="View"
                        onClick={() => setSelectedBill(bill)}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="custom-pagination-container mt-4 mb-3 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <label htmlFor="pageSize" className="form-label mb-0 small fw-bold text-muted">
            Rows per page:
          </label>
          <select
            id="pageSize"
            className="form-select form-select-sm shadow-sm"
            style={{ width: 'auto' }}
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
          >
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="50">50</option>
          </select>
          <span className="text-muted small ms-2">
            Total records: <strong>{searchTerm ? filteredBills.length : totalElements}</strong>
          </span>
        </div>

        {totalPages > 0 && (
          <div className="custom-pagination d-flex align-items-center gap-1">
            <button
              className="page-nav-btn btn btn-sm btn-light border fw-semibold"
              disabled={page === 0}
              onClick={() => handlePageChange(page - 1)}
            >
              <i className="bi bi-chevron-left me-1"></i> PREV
            </button>

            <div className="page-numbers d-flex gap-1 mx-2">
              {Array.from({ length: totalPages }).map((_, idx) => {
                if (
                  totalPages > 7 &&
                  idx !== 0 &&
                  idx !== totalPages - 1 &&
                  Math.abs(page - idx) > 1
                ) {
                  if (idx === 1 || idx === totalPages - 2)
                    return <span key={idx} className="text-muted px-1">...</span>;
                  return null;
                }

                return (
                  <button
                    key={idx}
                    className={`btn btn-sm ${page === idx ? 'btn-primary shadow-sm' : 'btn-light border'} fw-semibold`}
                    style={{ width: '32px', height: '32px', padding: '0' }}
                    onClick={() => handlePageChange(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <button
              className="page-nav-btn btn btn-sm btn-light border fw-semibold"
              disabled={page >= totalPages - 1}
              onClick={() => handlePageChange(page + 1)}
            >
              NEXT <i className="bi bi-chevron-right ms-1"></i>
            </button>
          </div>
        )}
      </div>

      {selectedBill && (
        <BillDetailsModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
        />
      )}

      {printBill && (
        <ReceiptPopup
          orderDetails={printBill}
          onClose={() => setPrintBill(null)}
        />
      )}
    </div>
  );
}