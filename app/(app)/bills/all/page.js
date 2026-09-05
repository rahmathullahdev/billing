'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ReceiptPopup from '@/components/ReceiptPopup';
import BillDetailsModal from '@/components/BillDetailsModal';

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
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [pageSize, setPageSize] = useState(15);
  const [selectedBill, setSelectedBill] = useState(null);
  const [printBill, setPrintBill] = useState(null);
  const [kpi, setKpi] = useState({
    totalAmount: 0,
    paidAmount: 0,
    creditAmount: 0,
    todayOrderCount: 0,
    completedOrders: 0,
    todayCreditOrderCount: 0,
  });

  const fetchBills = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        size: String(pageSize),
        dateFilter,
      });
      if (customerFilter) query.set('customerName', customerFilter);
      const res = await fetch(`/api/bills?${query.toString()}`);
      const data = await res.json();
      if (data.data) {
        const pageData = data.data;
        setBills(pageData.content || []);
        setTotalPages(pageData.totalPages || 0);
        setTotalElements(pageData.totalElements || 0);
      } else {
        setBills(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
      if (data.kpi) setKpi(data.kpi);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, dateFilter, pageSize, customerFilter]);

  useEffect(() => {
    fetch('/api/customers')
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setCustomers(Array.isArray(d.data) ? d.data : (d.data.content || []));
        }
      })
      .catch(err => console.error('Error fetching customers:', err));
  }, []);

  const handleFilterChange = (e) => {
    setDateFilter(e.target.value);
    setPage(0);
  };

  const handleCustomerSearchChange = (e) => {
    const val = e.target.value;
    setCustomerSearch(val);
    if (val === '') {
      setCustomerFilter('');
      setPage(0);
      setShowCustomerDropdown(false);
    } else {
      setShowCustomerDropdown(true);
    }
  };

  const handleCustomerSelect = (customerName) => {
    setCustomerSearch(customerName);
    setCustomerFilter(customerName);
    setShowCustomerDropdown(false);
    setPage(0);
  };

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

    const items = particulars.map(p => ({
      name: p.name || p.particularName,
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
      tax: bill.gstAmount || ((bill.total || 0) - (bill.totalWithGst || 0)),
      items: items,
      creditType: bill.creditAmount > 0 ? 'CREDIT' : 'CASH',
      pendingAmount: bill.creditAmount || 0,
      taxPercent: bill.gstPercentage ? bill.gstPercentage : (bill.billNumber && String(bill.billNumber).toUpperCase().endsWith('-E') ? 0 : 18),
      subtotal: bill.totalWithGst || bill.total || 0,
      gstin: bill.customerGstNo || ''
    });
  };

  const filteredCustomers = customers.filter(c =>
    c.name && c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="view-bills-container fade-in">
      <div className="machine-banner position-relative text-center text-white mb-3 shadow-sm">
        <div className="d-flex align-items-center justify-content-center gap-2">
          <i className="bi bi-receipt-cutoff fs-4 text-danger"></i>
          <h4 className="fw-bold mb-0 text-uppercase tracking-wider">All Bills Management</h4>
        </div>
        <p className="mb-0 text-white-50 small mt-1">Comprehensive oversight, filtering, and administration of all your generated bills</p>
      </div>

      <div className="kpi-cards-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper icon-green">
            <i className="bi bi-currency-rupee"></i>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">₹{(kpi.totalAmount || 0).toFixed(2)}</h3>
            <span className="kpi-label">Total Revenue</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper icon-blue">
            <i className="bi bi-receipt"></i>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">{kpi.todayOrderCount || 0}</h3>
            <span className="kpi-label">Total Orders</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper icon-cyan">
            <i className="bi bi-check-circle"></i>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">{kpi.completedOrders || 0}</h3>
            <span className="kpi-label">Paid Orders</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper icon-purple">
            <i className="bi bi-cart-dash"></i>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">{kpi.todayCreditOrderCount || 0}</h3>
            <span className="kpi-label">Credit Orders</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper icon-orange">
            <i className="bi bi-cash-coin"></i>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">₹{(kpi.paidAmount || 0).toFixed(2)}</h3>
            <span className="kpi-label">Paid Amount</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper icon-red">
            <i className="bi bi-exclamation-circle"></i>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">₹{(kpi.creditAmount || 0).toFixed(2)}</h3>
            <span className="kpi-label">Credit Balance</span>
          </div>
        </div>
      </div>

      {/* Filter Card (Fully Responsive for All Devices) */}
      <div className="filter-card mb-4 bg-white rounded shadow-sm border-0 overflow-hidden">
        <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between p-3" style={{ borderLeft: '4px solid #e64051' }}>
          <div className="d-flex align-items-center mb-3 mb-md-0 me-md-3">
            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0" style={{ width: '40px', height: '40px', color: '#e64051' }}>
              <i className="bi bi-funnel-fill fs-5"></i>
            </div>
            <div>
              <h6 className="mb-0 fw-bold" style={{ color: '#002142', fontSize: '0.95rem' }}>Filter & Search Bills</h6>
              <small className="text-muted" style={{ fontSize: '0.78rem' }}>Filter by date period and customer name</small>
            </div>
          </div>

          <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2 gap-sm-3 w-100 w-md-auto">
            <div className="d-flex align-items-center flex-grow-1">
              <label htmlFor="dateFilter" className="text-muted fw-bold me-2 mb-0 text-nowrap" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <i className="bi bi-calendar-event me-1 text-danger"></i> PERIOD:
              </label>
              <select
                id="dateFilter"
                className="form-select fw-semibold shadow-none cursor-pointer py-1 px-2 w-100"
                style={{ border: '1px solid #cbd5e1', borderRadius: '8px', color: '#002142', fontSize: '0.85rem' }}
                value={dateFilter}
                onChange={handleFilterChange}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="last_week">Last Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_year">This Year</option>
                <option value="custom_range">Custom Range</option>
              </select>
            </div>

            <div className="vr d-none d-md-block mx-1" style={{ height: '26px', opacity: 0.15 }}></div>

            <div className="d-flex align-items-center flex-grow-1">
              <label htmlFor="customerSearch" className="text-muted fw-bold me-2 mb-0 text-nowrap" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <i className="bi bi-person-badge me-1 text-danger"></i> CUSTOMER:
              </label>
              <div className="customer-search-wrapper w-100">
                <input
                  id="customerSearch"
                  type="text"
                  className="form-control fw-semibold shadow-none py-1 px-2 w-100"
                  style={{ border: '1px solid #cbd5e1', borderRadius: '8px', color: '#002142', fontSize: '0.85rem' }}
                  placeholder="Search customer..."
                  value={customerSearch}
                  onChange={handleCustomerSearchChange}
                  onFocus={() => { if (customerSearch.trim().length > 0) setShowCustomerDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                />
                {customerSearch && (
                  <i
                    className="bi bi-x-circle-fill text-muted position-absolute"
                    style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '0.85rem' }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setCustomerSearch('');
                      setCustomerFilter('');
                      setPage(0);
                      setShowCustomerDropdown(false);
                    }}
                  ></i>
                )}
                {showCustomerDropdown && customerSearch.trim().length > 0 && (
                  <ul className="customer-dropdown-list">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((cust, idx) => (
                        <li
                          key={idx}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleCustomerSelect(cust.name);
                          }}
                        >
                          {cust.name}
                        </li>
                      ))
                    ) : (
                      <li className="no-results">No customers found</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive rounded shadow-sm bg-white pb-2">
        <table className="bills-table data-table">
          <thead>
            <tr>
              <th className="text-center" style={{ width: '60px' }}>S.No</th>
              <th>Bill Number</th>
              <th>Customer Name</th>
              <th>Amount (₹)</th>
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
                    <span className="loader-text mt-3">Fetching Bills...</span>
                  </div>
                </td>
              </tr>
            ) : bills.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-5 text-muted">
                  <i className="bi bi-folder-x fs-3 d-block mb-2 text-secondary"></i>
                  No bills found for the selected filter.
                </td>
              </tr>
            ) : (
              bills.map((bill, index) => (
                <tr key={bill.id} className="table-row-hover">
                  <td className="text-center fw-semibold text-muted">{page * pageSize + index + 1}</td>
                  <td className="fw-bold text-primary">{bill.billNumber}</td>
                  <td>{bill.customerName || '-'}</td>
                  <td className="fw-semibold text-success">₹{bill.total ? bill.total.toFixed(2) : '0.00'}</td>
                  <td className="text-muted small">{formatDate(bill.createdAt || bill.date)}</td>
                  <td>
                    {bill.employee ? (
                      <span className="badge bg-light text-dark border">{bill.employee}</span>
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
                      <button
                        className="btn btn-sm btn-outline-danger modern-action-btn"
                        title="Edit"
                        onClick={() => router.push(`/bills/create?id=${bill.id}`)}
                      >
                        <i className="bi bi-pencil"></i>
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
          <label htmlFor="pageSize" className="form-label mb-0 small fw-bold text-muted">Rows per page:</label>
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
          <span className="text-muted small ms-2">Total records: <strong>{totalElements}</strong></span>
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
                if (totalPages > 7 && (idx !== 0 && idx !== totalPages - 1 && Math.abs(page - idx) > 1)) {
                  if (idx === 1 || idx === totalPages - 2) return <span key={idx} className="text-muted px-1">...</span>;
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