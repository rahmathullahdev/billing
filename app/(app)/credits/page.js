'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ReceiptPopup from '@/components/ReceiptPopup';
import BillDetailsModal from '@/components/BillDetailsModal';

const CreditManagement = () => {
  // State for list and pagination
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters state
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('CREDIT');
  const [customerSearch, setCustomerSearch] = useState('');
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState('');

  // Modals state
  const [settleModalBill, setSettleModalBill] = useState(null);
  const [receiptBill, setReceiptBill] = useState(null);
  const [selectedBillDetails, setSelectedBillDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settle Form State
  const [settleStatus, setSettleStatus] = useState('PAID');
  const [settleAmount, setSettleAmount] = useState('');
  const [settlePaymentMode, setSettlePaymentMode] = useState('Cash');

  // Debounce customer search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCustomerSearch(customerSearch);
      setPage(0); // Reset to page 0 when searching
    }, 400);

    return () => clearTimeout(handler);
  }, [customerSearch]);

  // Fetch Credit Bills
  const fetchCreditBills = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(pageSize),
        dateFilter,
      });
      if (dateFilter === 'custom_range') {
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
      }
      const trimmedSearch = debouncedCustomerSearch.trim();
      if (trimmedSearch) params.set('customerName', trimmedSearch);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/bills/credit-bills?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load credit bills');
      const json = await res.json();
      const pageData = json.data;

      if (pageData) {
        const contentList = Array.isArray(pageData) ? pageData : (pageData.content || []);
        setBills(contentList);
        setTotalPages(pageData.totalPages || 1);
        const count = (pageData.totalElements !== undefined && pageData.totalElements !== null && pageData.totalElements > 0)
          ? pageData.totalElements
          : contentList.length;
        setTotalElements(count);
      } else {
        setBills([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error('Error fetching credit bills:', error);
      toast.error('Failed to load credit bills');
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, dateFilter, startDate, endDate, statusFilter, debouncedCustomerSearch]);

  // Calculate summary metrics for current loaded bills
  const totalBillAmount = bills.reduce((sum, b) => sum + (b.total || 0), 0);
  const totalPaidAmount = bills.reduce((sum, b) => sum + (b.totalPaid || 0), 0);
  const totalBalanceDue = bills.reduce((sum, b) => {
    const total = b.total || 0;
    const paid = b.totalPaid || 0;
    return sum + Math.max(0, total - paid);
  }, 0);

  // Open Settle Modal
  const handleOpenSettleModal = (bill) => {
    setSettleModalBill(bill);
    const total = bill.total || 0;
    const paid = bill.totalPaid || 0;
    const balance = Math.max(0, total - paid);

    setSettleStatus('PAID');
    setSettleAmount(balance > 0 ? balance.toFixed(2) : '0.00');

    let defaultMode = 'Cash';
    if (bill.payment) {
      const p = bill.payment.toUpperCase();
      if (p.includes('UPI')) defaultMode = 'UPI';
      else if (p.includes('CARD')) defaultMode = 'Card';
      else if (p.includes('CHEQUE')) defaultMode = 'Cheque';
      else if (p.includes('CASH')) defaultMode = 'Cash';
    }
    setSettlePaymentMode(defaultMode);
  };

  // Close Settle Modal
  const handleCloseSettleModal = () => {
    setSettleModalBill(null);
    setSettleAmount('');
    setIsSubmitting(false);
  };

  // Handle Full Settlement Quick Action
  const handleQuickFullPay = () => {
    if (!settleModalBill) return;
    const total = settleModalBill.total || 0;
    const paid = settleModalBill.totalPaid || 0;
    const balance = Math.max(0, total - paid);

    setSettleStatus('PAID');
    setSettleAmount(balance.toFixed(2));
  };

  // Submit Status Update
  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    if (!settleModalBill) return;

    const amountNum = parseFloat(settleAmount);
    if (isNaN(amountNum) || amountNum < 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const requestPayload = {
        billStatus: settleStatus,
        paidAmount: amountNum,
        payment: settlePaymentMode,
      };

      const res = await fetch(`/api/bills/credit-bills/${settleModalBill.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.data) {
        throw new Error(json.error || 'Failed to update credit bill status');
      }

      toast.success(`Bill #${settleModalBill.billNumber} credit status updated successfully!`);
      handleCloseSettleModal();
      fetchCreditBills();
    } catch (error) {
      console.error('Error updating credit bill status:', error);
      toast.error(error.message || 'Failed to update credit bill status');
      setIsSubmitting(false);
    }
  };

  // Handle Receipt Popup
  const handleViewReceipt = (bill) => {
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
      name: p.name || p.particularName || 'Item',
      quantity: p.qty || 1,
      price: p.price || 0,
    }));

    const orderDetails = {
      invoiceNumber: bill.billNumber,
      orderId: bill.id,
      createdAt: bill.createdAt || bill.date,
      username: bill.employee,
      customerName: bill.customerName || 'CASH CUSTOMER',
      grandTotal: bill.total || 0,
      paidAmount: bill.totalPaid || 0,
      tax: bill.totalWithGst ? Math.max(0, (bill.total || 0) - (bill.totalWithGst || 0)) : 0,
      items: items,
      creditType: bill.billStatus === 'CREDIT' ? 'CREDIT' : 'CASH',
      pendingAmount: Math.max(0, (bill.total || 0) - (bill.totalPaid || 0)),
      taxPercent: bill.gstPercentage ? bill.gstPercentage : (bill.billNumber && String(bill.billNumber).toUpperCase().endsWith('-E') ? 0 : 18),
      subtotal: bill.total || 0,
      gstin: bill.customerGstNo || '',
    };

    setReceiptBill(orderDetails);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="credit-mgmt-container fade-in">
      {/* Page Header Banner */}
      <div className="credit-header-card">
        <div className="credit-header-info">
          <h2>
            <i className="bi bi-credit-card-2-front me-2"></i> Credit Management
          </h2>
          <p>
            Track outstanding customer credit bills, receive credit settlements, and manage payments with real-time balance tracking.
          </p>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="credit-kpi-grid">
        <div className="kpi-card total-bills-kpi">
          <div className="kpi-icon">
            <i className="bi bi-receipt"></i>
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Total Credit Bills</span>
            <h3 className="kpi-value">{totalElements > 0 ? totalElements : bills.length}</h3>

          </div>
        </div>

        <div className="kpi-card total-amount-kpi">
          <div className="kpi-icon">
            <i className="bi bi-wallet2"></i>
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Total Bill Amount</span>
            <h3 className="kpi-value">₹{totalBillAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="kpi-card paid-amount-kpi">
          <div className="kpi-icon">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Amount Paid</span>
            <h3 className="kpi-value text-success">₹{totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="kpi-card balance-kpi">
          <div className="kpi-icon">
            <i className="bi bi-exclamation-triangle-fill"></i>
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Outstanding Balance</span>
            <h3 className="kpi-value text-danger">₹{totalBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="credit-filter-card">
        <div className="filter-item search-filter">
          <label className="filter-label">
            <i className="bi bi-search"></i> Search Customer
          </label>
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by customer name..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
            {customerSearch && (
              <button
                className="clear-search-btn"
                onClick={() => setCustomerSearch('')}
                title="Clear Search"
              >
                <i className="bi bi-x-circle-fill"></i>
              </button>
            )}
          </div>
        </div>

        <div className="filter-item">
          <label className="filter-label">
            <i className="bi bi-calendar-range"></i> Date Filter
          </label>
          <select
            className="form-select form-select-sm"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(0);
            }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="custom_range">Custom Date Range</option>
          </select>
        </div>

        {dateFilter === 'custom_range' && (
          <>
            <div className="filter-item">
              <label className="filter-label">From Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <div className="filter-item">
              <label className="filter-label">To Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Credit Bills Table */}
      <div className="credit-table-card shadow-sm">
        <div className="table-responsive">
          <table className="credit-table">
            <thead>
              <tr>
                <th className="text-center" style={{ width: '60px' }}>S.No</th>
                <th>Bill Number</th>
                <th>Date</th>
                <th>Customer Info</th>
                <th>Payment Mode</th>
                <th className="text-end">Total Bill (₹)</th>
                <th className="text-end">Paid (₹)</th>
                <th className="text-end">Balance (₹)</th>
                <th className="text-center">Status</th>
                <th className="text-center" style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-5">
                    <div className="loading-spinner-container">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 text-muted fw-semibold">Fetching Credit Bills...</p>
                    </div>
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-2 d-block mb-2 text-secondary"></i>
                    No credit bills found for the selected filters.
                  </td>
                </tr>
              ) : (
                bills.map((bill, index) => {
                  const total = bill.total || 0;
                  const paid = bill.totalPaid || 0;
                  const balance = Math.max(0, total - paid);
                  const isPaid = bill.billStatus === 'PAID' || balance <= 0.01;

                  return (
                    <tr key={bill.id} className="credit-row-hover">
                      <td className="text-center fw-semibold text-muted">
                        {page * pageSize + index + 1}
                      </td>
                      <td>
                        <span className="bill-num-badge">{bill.billNumber}</span>
                      </td>
                      <td className="text-muted small">
                        {formatDate(bill.date || bill.createdAt)}
                      </td>
                      <td>
                        <div className="customer-cell">
                          <span className="customer-name">{bill.customerName || 'CASH CUSTOMER'}</span>
                          {bill.customerMobileNo && (
                            <span className="customer-phone">
                              <i className="bi bi-telephone me-1"></i>
                              {bill.customerMobileNo}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {(() => {
                          const p = (bill.payment || 'Credit').toUpperCase();
                          let modeClass = 'payment-credit';
                          if (p.includes('UPI')) modeClass = 'payment-upi';
                          else if (p.includes('CASH')) modeClass = 'payment-cash';
                          else if (p.includes('CARD')) modeClass = 'payment-card';
                          else if (p.includes('CHEQUE')) modeClass = 'payment-cheque';

                          return (
                            <span className={`payment-mode-pill ${modeClass}`}>
                              {bill.payment || 'Credit'}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="text-end fw-bold text-dark">
                        ₹{total.toFixed(2)}
                      </td>
                      <td className="text-end fw-semibold text-success">
                        ₹{paid.toFixed(2)}
                      </td>
                      <td className="text-end fw-bold">
                        <span className={balance > 0 ? 'balance-due-text' : 'balance-settled-text'}>
                          ₹{balance.toFixed(2)}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`status-pill ${isPaid ? 'status-paid' : 'status-credit'}`}>
                          <i className={`bi ${isPaid ? 'bi-check-circle-fill' : 'bi-clock-history'} me-1`}></i>
                          {isPaid ? 'PAID' : 'CREDIT'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-group">
                          <button
                            className="btn btn-action view-btn"
                            title="View Bill Details"
                            onClick={() => setSelectedBillDetails(bill)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className="btn btn-action settle-btn"
                            title="Update Credit / Receive Payment"
                            onClick={() => handleOpenSettleModal(bill)}
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button
                            className="btn btn-action print-icon-btn"
                            title="View Receipt Invoice"
                            onClick={() => handleViewReceipt(bill)}
                          >
                            <i className="bi bi-printer"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        <div className="custom-pagination-container d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <label htmlFor="pageSizeSelect" className="form-label mb-0 small fw-bold text-muted">Rows per page:</label>
            <select
              id="pageSizeSelect"
              className="form-select form-select-sm shadow-sm"
              style={{ width: 'auto' }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>

          <div className="custom-pagination">
            <button
              className="page-nav-btn"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <i className="bi bi-chevron-left me-1"></i> PREVIOUS
            </button>

            <div className="page-numbers">
              {Array.from({ length: totalPages === 0 ? 1 : totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  className={`page-num-btn ${page === idx ? 'active' : ''}`}
                  onClick={() => setPage(idx)}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              className="page-nav-btn"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              NEXT <i className="bi bi-chevron-right ms-1"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Settle / Update Credit Status Modal */}
      {settleModalBill && (
        <div className="modal-overlay fade-in">
          <div className="modal-content-custom settle-modal shadow-lg">
            <div className="modal-header-custom">
              <div className="header-title-container">
                <i className="bi bi-cash-coin header-icon"></i>
                <div>
                  <h4 className="mb-0">Update Credit Status</h4>
                  <span className="sub-header">Bill #{settleModalBill.billNumber} &bull; {settleModalBill.customerName}</span>
                </div>
              </div>
              <button className="btn-close-custom" onClick={handleCloseSettleModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit}>
              <div className="modal-body-custom">
                {/* Financial Summary Breakdown */}
                <div className="settle-summary-cards">
                  <div className="summary-box">
                    <span className="box-title">Total Bill</span>
                    <span className="box-value">₹{(settleModalBill.total || 0).toFixed(2)}</span>
                  </div>
                  <div className="summary-box">
                    <span className="box-title">Paid So Far</span>
                    <span className="box-value text-success">₹{(settleModalBill.totalPaid || 0).toFixed(2)}</span>
                  </div>
                  <div className="summary-box highlight-box">
                    <span className="box-title">Current Balance</span>
                    <span className="box-value text-danger">
                      ₹{Math.max(0, (settleModalBill.total || 0) - (settleModalBill.totalPaid || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="form-group mb-3">
                  <label className="form-label font-semibold">
                    Set Bill Status <span className="text-danger">*</span>
                  </label>
                  <div className="status-selector-grid">
                    <button
                      type="button"
                      className={`btn status-btn ${settleStatus === 'PAID' ? 'active-paid' : ''}`}
                      onClick={() => {
                        setSettleStatus('PAID');
                        const bal = Math.max(0, (settleModalBill.total || 0) - (settleModalBill.totalPaid || 0));
                        setSettleAmount(bal.toFixed(2));
                      }}
                    >
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Mark as PAID (Full Settlement)
                    </button>
                    <button
                      type="button"
                      className={`btn status-btn ${settleStatus === 'CREDIT' ? 'active-credit' : ''}`}
                      onClick={() => setSettleStatus('CREDIT')}
                    >
                      <i className="bi bi-clock-history me-2"></i>
                      Keep as CREDIT (Partial Payment)
                    </button>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label font-semibold mb-0">
                      Payment Amount Received (₹) <span className="text-danger">*</span>
                    </label>
                    <button
                      type="button"
                      className="btn-link-quick"
                      onClick={handleQuickFullPay}
                    >
                      Fill Full Balance
                    </button>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      placeholder="0.00"
                      value={settleAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSettleAmount(val);
                        const amt = parseFloat(val) || 0;
                        const bal = Math.max(0, (settleModalBill.total || 0) - (settleModalBill.totalPaid || 0));
                        if (amt >= bal && bal > 0) {
                          setSettleStatus('PAID');
                        } else if (amt < bal) {
                          setSettleStatus('CREDIT');
                        }
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label font-semibold">
                    Payment Mode
                  </label>
                  <select
                    className="form-select"
                    value={settlePaymentMode}
                    onChange={(e) => setSettlePaymentMode(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                {/* Live Realtime Math Feedback Box */}
                {(() => {
                  const payNow = parseFloat(settleAmount) || 0;
                  const prevPaid = settleModalBill.totalPaid || 0;
                  const totalAmt = settleModalBill.total || 0;
                  const newTotalPaid = prevPaid + payNow;
                  const newRemBalance = Math.max(0, totalAmt - newTotalPaid);

                  return (
                    <div className="live-calc-box mt-3">
                      <div className="calc-row">
                        <span>Payment Now:</span>
                        <span className="fw-bold text-success">+ ₹{payNow.toFixed(2)}</span>
                      </div>
                      <div className="calc-row">
                        <span>New Total Paid:</span>
                        <span className="fw-bold text-dark">₹{newTotalPaid.toFixed(2)}</span>
                      </div>
                      <div className="calc-row text-primary">
                        <span>New Remaining Balance:</span>
                        <span className="fw-bold">₹{newRemBalance.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseSettleModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-1"></i> Save Settlement
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Details Modal Popup */}
      {selectedBillDetails && (
        <BillDetailsModal
          bill={selectedBillDetails}
          onClose={() => setSelectedBillDetails(null)}
        />
      )}

      {/* Receipt Popup */}
      {receiptBill && (
        <ReceiptPopup
          orderDetails={receiptBill}
          onClose={() => setReceiptBill(null)}
        />
      )}
    </div>
  );
};

export default CreditManagement;