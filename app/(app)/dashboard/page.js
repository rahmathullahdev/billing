'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter states matching original React client 100%
  const [presetRange, setPresetRange] = useState('last_30_days');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState([]);

  // Invoice modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Load customers for autocomplete search
  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const json = await res.json();
      setCustomers(Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
    } catch (e) {
      console.error("Error loading customers:", e);
    }
  };

  // Fetch dashboard data
  const loadDashboardData = async (filterVal = presetRange, startDate = dateFrom, endDate = dateTo, paymentType = paymentMode) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterVal) params.set('filter', filterVal);
      if (paymentType) params.set('paymentType', paymentType);
      if (filterVal === 'custom' && startDate && endDate) {
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      }

      const res = await fetch(`/api/dashboard?${params.toString()}`);
      const json = await res.json();
      const resData = json.data || {};
      setData(resData);

      const orders = resData.recentOrders || [];
      filterOrdersList(orders, customerFilter, selectedCustomer);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Filter orders by customer input / selected customer
  const filterOrdersList = (ordersList, custFilter, selCust) => {
    let filtered = ordersList;
    if (custFilter) {
      if (selCust) {
        const cName = (selCust.name || selCust.fullName || "").toLowerCase().trim();
        const cPhone = (selCust.phoneNumber || selCust.mobileNo || "").replace(/\D/g, '');

        filtered = ordersList.filter(order => {
          const oName = (order.customerName || "").toLowerCase().trim();
          const oPhone = (order.phoneNumber || "").replace(/\D/g, '');
          if (cPhone && oPhone && (cPhone === oPhone || cPhone.includes(oPhone) || oPhone.includes(cPhone))) return true;
          if (cName && oName && (cName === oName || oName.includes(cName) || cName.includes(oName))) return true;
          return false;
        });
      } else {
        const query = custFilter.toLowerCase().trim();
        filtered = ordersList.filter(order => {
          const oName = (order.customerName || "").toLowerCase();
          const oPhone = (order.phoneNumber || "").toLowerCase();
          return oName.includes(query) || oPhone.includes(query);
        });
      }
    }
    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadDashboardData('last_30_days', '', '', '');
    loadCustomers();
  }, []);

  // Filter change handlers
  const handlePresetChange = (e) => {
    const value = e.target.value;
    setPresetRange(value);
    if (value !== 'custom') {
      setDateFrom('');
      setDateTo('');
      loadDashboardData(value, '', '', paymentMode);
    }
  };

  const handlePaymentModeChange = (e) => {
    const value = e.target.value;
    setPaymentMode(value);
    loadDashboardData(presetRange, dateFrom, dateTo, value);
  };

  const handleCustomerFilterChange = (e) => {
    const value = e.target.value;
    setCustomerFilter(value);
    setSelectedCustomer(null);
    setShowCustomerSuggestions(true);

    if (data && data.recentOrders) {
      filterOrdersList(data.recentOrders, value, null);
    }
  };

  const handleCustomerSuggestionClick = (customer) => {
    setCustomerFilter(customer.name || customer.fullName || '');
    setSelectedCustomer(customer);
    setShowCustomerSuggestions(false);
    if (data && data.recentOrders) {
      filterOrdersList(data.recentOrders, customer.name || customer.fullName, customer);
    }
  };

  const handleCustomDateFilter = () => {
    if (dateFrom && dateTo) {
      loadDashboardData('custom', dateFrom, dateTo, paymentMode);
    }
  };

  const resetFilter = () => {
    setPresetRange('last_30_days');
    setDateFrom('');
    setDateTo('');
    setPaymentMode('');
    setCustomerFilter('');
    setSelectedCustomer(null);
    setShowCustomerSuggestions(false);
    loadDashboardData('last_30_days', '', '', '');
  };

  // Export functions matching original 100%
  const exportToCSV = () => {
    if (!data) return;
    const csvRows = [];
    csvRows.push("Dashboard Report");
    csvRows.push("Generated on: " + new Date().toLocaleString());
    csvRows.push("");
    csvRows.push("Revenue Summary");
    csvRows.push(`Total Revenue,INR ${(data.totalRevenue || 0).toFixed(2)}`);
    csvRows.push(`Average Daily Revenue,INR ${((data.totalRevenue || 0) / 30).toFixed(2)}`);
    csvRows.push(`Total Orders,${filteredOrders.length}`);
    csvRows.push("");

    csvRows.push("Recent Orders");
    csvRows.push("Bill Number,Employee,Customer,Amount,Payment Method,Status,Date/Time");

    filteredOrders.forEach(o => {
      const bNum = o.billNumber || o.orderId?.substring(0, 8);
      const emp = o.username || '-';
      const cust = `"${(o.customerName || '-').replace(/"/g, '""')}"`;
      const amt = (o.grandTotal || 0).toFixed(2);
      const pay = o.paymentMethod || '-';
      const status = o.paymentDetails?.status || 'PAID';
      const dt = `"${new Date(o.createdAt).toLocaleString()}"`;
      csvRows.push(`${bNum},${emp},${cust},${amt},${pay},${status},${dt}`);
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Dashboard_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    window.print();
  };

  const exportToDOC = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Dashboard Report</title><style>body{font-family:Arial,sans-serif;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ccc;padding:8px;text-align:left;} th{background:#002142;color:#fff;}</style></head>
      <body>
        <h2>Syndicate Prints - Dashboard Report</h2>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <h3>Total Revenue: INR ${(data?.totalRevenue || 0).toFixed(2)}</h3>
        <table>
          <thead>
            <tr><th>Bill #</th><th>Employee</th><th>Customer</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th></tr>
          </thead>
          <tbody>
            ${filteredOrders.map(o => `
              <tr>
                <td>${o.billNumber || o.orderId?.substring(0, 8)}</td>
                <td>${o.username || '-'}</td>
                <td>${o.customerName || '-'} (${o.phoneNumber || ''})</td>
                <td>₹${(o.grandTotal || 0).toFixed(2)}</td>
                <td>${o.paymentMethod || '-'}</td>
                <td>${o.paymentDetails?.status || 'PAID'}</td>
                <td>${new Date(o.createdAt).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Dashboard_Report_${new Date().toISOString().split('T')[0]}.doc`;
    link.click();
  };

  // Customer suggestions filtering
  const filteredCustomerSuggestions = customerFilter
    ? customers.filter(c => {
        const name = (c.name || c.fullName || "").toLowerCase();
        const phone = (c.phoneNumber || c.mobileNo || "").toLowerCase();
        const query = customerFilter.toLowerCase();
        return name.includes(query) || phone.includes(query);
      })
    : [];

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => setCurrentPage(page);
  const goToPrevious = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  const getPageNumbers = () => {
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1);
    let start = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
    let end = Math.min(totalPages, start + 2);
    if (end - start < 2) start = Math.max(1, end - 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const handlePrintInvoice = (order) => {
    setSelectedOrder(order);
    setShowInvoiceModal(true);
  };

  if (initialLoading) {
    return (
      <div className="dashboard-wrapper">
        <div className="dashboard-container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon"><i className="bi bi-currency-rupee"></i></div>
              <div className="stat-content">
                <h3>Today's Sales</h3>
                <p>₹0.00</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><i className="bi bi-cart-check"></i></div>
              <div className="stat-content">
                <h3>Today's Orders</h3>
                <p>0</p>
              </div>
            </div>
          </div>
          <div className="recent-orders-card">
            <div className="loading-spinner-container" style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p style={{ color: '#64748b' }}>Loading data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const todaySalesVal = data?.todayRevenue || 0;
  const todayOrdersVal = data?.todayCount || 0;
  const totalRevenueVal = data?.totalRevenue || 0;
  const avgDailyVal = totalRevenueVal > 0 ? (totalRevenueVal / 30) : 0;

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        {/* Top 2 Stat Cards matching original React Dashboard */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="bi bi-currency-rupee"></i>
            </div>
            <div className="stat-content">
              <h3>Today's Sales</h3>
              <p>₹{todaySalesVal.toFixed(2)}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <i className="bi bi-cart-check"></i>
            </div>
            <div className="stat-content">
              <h3>Today's Orders</h3>
              <p>{todayOrdersVal}</p>
            </div>
          </div>
        </div>

        {/* Recent Orders Card */}
        <div className="recent-orders-card">
          <div className="header-section">
            <h3 className="recent-orders-title">
              <i className="bi bi-clock-history"></i>
              Recent Orders
            </h3>

            <div className="revenue-display">
              <div className="revenue-item">
                <span className="revenue-label">Total Revenue</span>
                <span className="revenue-value">
                  ₹{totalRevenueVal.toFixed(2)}
                </span>
              </div>
              <div className="revenue-item">
                <span className="revenue-label">Avg Daily</span>
                <span className="revenue-value">
                  ₹{avgDailyVal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Export Section */}
          <div className="export-section">
            <div className="export-label">
              <i className="bi bi-download"></i> Export Report
            </div>
            <div className="export-buttons">
              <button onClick={exportToPDF} className="export-btn pdf-btn">
                <i className="bi bi-file-earmark-pdf"></i>
                <span>PDF</span>
              </button>
              <button onClick={exportToDOC} className="export-btn doc-btn">
                <i className="bi bi-file-earmark-word"></i>
                <span>DOC</span>
              </button>
              <button onClick={exportToCSV} className="export-btn csv-btn">
                <i className="bi bi-file-earmark-spreadsheet"></i>
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Date Filter Section */}
          <div className="filter-section">
            <div className="filter-label">
              <i className="bi bi-funnel"></i> Filters
            </div>
            <div className="quick-filters">
              <select
                value={presetRange}
                onChange={handlePresetChange}
                className="filter-select"
              >
                <option value="">Preset Ranges</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last_7_days">This Week</option>
                <option value="last_30_days">Last 30 days</option>
                <option value="this_year">Annual</option>
                <option value="custom">Custom Range</option>
              </select>

              <select
                value={paymentMode}
                onChange={handlePaymentModeChange}
                className="filter-select"
              >
                <option value="">All Payment Modes</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
              </select>

              <div className="customer-search-container">
                <input
                  type="text"
                  value={customerFilter}
                  onChange={handleCustomerFilterChange}
                  onFocus={() => customerFilter && setShowCustomerSuggestions(true)}
                  onBlur={(e) => {
                    if (!e.relatedTarget || !e.relatedTarget.closest('.customer-suggestions')) {
                      setTimeout(() => setShowCustomerSuggestions(false), 200);
                    }
                  }}
                  placeholder="Search customer..."
                  className="customer-search-input"
                  autoComplete="off"
                />
                {customerFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerFilter("");
                      setSelectedCustomer(null);
                      setShowCustomerSuggestions(false);
                      if (data && data.recentOrders) {
                        setFilteredOrders(data.recentOrders);
                      }
                    }}
                    className="customer-search-clear"
                    title="Clear filter"
                  >
                    <i className="bi bi-x-circle"></i>
                  </button>
                )}
                {showCustomerSuggestions && filteredCustomerSuggestions.length > 0 && (
                  <div className="customer-suggestions" onMouseDown={(e) => e.preventDefault()}>
                    {filteredCustomerSuggestions.slice(0, 8).map((customer) => (
                      <div
                        key={customer._id || customer.id || customer.customerId}
                        className="suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleCustomerSuggestionClick(customer);
                        }}
                      >
                        <div className="suggestion-name">{customer.name || customer.fullName}</div>
                        {(customer.phoneNumber || customer.mobileNo) && (
                          <div className="suggestion-phone">{customer.phoneNumber || customer.mobileNo}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="custom-date-filters">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From Date"
                className="date-input"
                disabled={presetRange !== "custom"}
              />
              <span className="date-separator">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To Date"
                className="date-input"
                disabled={presetRange !== "custom"}
              />
              <button
                onClick={handleCustomDateFilter}
                className="apply-btn"
                disabled={presetRange !== "custom"}
              >
                <i className="bi bi-search"></i> Apply
              </button>
              {(dateFrom || dateTo || customerFilter || paymentMode || presetRange !== 'last_30_days') && (
                <button onClick={resetFilter} className="reset-btn">
                  <i className="bi bi-x-circle"></i> Reset
                </button>
              )}
            </div>
          </div>

          {/* Orders Table Container */}
          <div className="orders-table-container">
            {loading ? (
              <div className="loading-spinner-container" style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                <p style={{ color: '#64748b' }}>Loading orders...</p>
              </div>
            ) : (
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order Id</th>
                    <th>Employee name</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Time</th>
                    <th>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.length > 0 ? (
                    paginatedOrders.map((order) => {
                      const displayId = order.billNumber || (order.orderId ? order.orderId.substring(0, 8) + '...' : '-');
                      const payMethod = order.paymentMethod || 'CASH';
                      const payStatus = order.paymentDetails?.status || 'PAID';

                      return (
                        <tr key={order.orderId || order._id}>
                          <td style={{ fontWeight: 700, color: '#002142' }}>{displayId}</td>
                          <td>{order.username || '-'}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{order.customerName || '-'}</div>
                            {order.phoneNumber && (
                              <small className="text-muted" style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                {order.phoneNumber}
                              </small>
                            )}
                          </td>
                          <td style={{ fontWeight: 700 }}>₹{(order.grandTotal || 0).toFixed(2)}</td>
                          <td>
                            <span className={`payment-method ${(payMethod || '').toLowerCase()}`}>
                              {payMethod}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${(payStatus || '').toLowerCase()}`}>
                              {payStatus}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: '#475569' }}>
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: 'short',
                            }) : '-'}
                          </td>
                          <td>
                            <button
                              className="print-invoice-btn"
                              onClick={() => handlePrintInvoice(order)}
                              title="Print Invoice"
                            >
                              <i className="bi bi-printer-fill"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="no-data" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No orders found for the selected date range
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <button
                onClick={goToPrevious}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                <i className="bi bi-chevron-left"></i> Previous
              </button>

              <div className="page-numbers">
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`page-number ${currentPage === page ? "active" : ""}`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={goToNext}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal / Preview */}
      {showInvoiceModal && selectedOrder && (
        <div className="modal-backdrop-custom" onClick={() => setShowInvoiceModal(false)}>
          <div className="modal-box-custom" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <div className="modal-header-custom" style={{ background: '#002142', color: '#fff', padding: '1rem 1.25rem', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                <i className="bi bi-receipt" style={{ color: '#e64051', marginRight: '0.5rem' }}></i>
                Invoice Details - {selectedOrder.billNumber || selectedOrder.orderId}
              </h5>
              <button onClick={() => setShowInvoiceModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: 8 }}>
                <div><strong>Customer:</strong> {selectedOrder.customerName || '-'}</div>
                <div><strong>Phone:</strong> {selectedOrder.phoneNumber || '-'}</div>
                <div><strong>Employee:</strong> {selectedOrder.username || '-'}</div>
                <div><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</div>
                <div><strong>Payment Method:</strong> {selectedOrder.paymentMethod || 'CASH'}</div>
                <div><strong>Status:</strong> {selectedOrder.paymentDetails?.status || 'PAID'}</div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <table className="data-table" style={{ marginBottom: '1.5rem' }}>
                  <thead>
                    <tr>
                      <th>Particular</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.particularName || item.name || 'Item'}</td>
                        <td>{item.quantity || item.qty || 1}</td>
                        <td>₹{(item.rate || item.price || 0).toFixed(2)}</td>
                        <td>₹{(item.amount || item.total || (item.quantity * item.rate) || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed #e2e8f0', paddingTop: '1rem' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#002142' }}>
                  Total Amount: ₹{(selectedOrder.grandTotal || 0).toFixed(2)}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-primary" onClick={() => window.print()}>
                    <i className="bi bi-printer"></i> Print Invoice
                  </button>
                  <button className="btn-outline" onClick={() => setShowInvoiceModal(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
