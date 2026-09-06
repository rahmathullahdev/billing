'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

export default function EmployeeViewPage() {
  const [employeesData, setEmployeesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(15);

  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');

  const [employeeNames, setEmployeeNames] = useState([]);

  useEffect(() => {
    const getEmployees = async () => {
      try {
        const res = await fetch('/api/employees');
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : (json.data?.content || []);
        setEmployeeNames(list);
      } catch (err) {
        console.error('Error fetching employee names:', err);
      }
    };
    getEmployees();
  }, []);

  const loadEmployeeData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString(),
        dateFilter,
        startDate,
        endDate,
        employeeName: employeeFilter,
      });

      const response = await fetch(`/api/bills/employee-wise-data?${params.toString()}`);
      const json = await response.json();
      const data = json.data || json;

      if (data) {
        setEmployeesData(data.content || []);
        setTotalPages(data.totalPages || data.page?.totalPages || 0);
        setTotalElements(data.totalElements || data.page?.totalElements || data.content?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching employee wise data:', error);
      toast.error('Failed to load employee wise data');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, dateFilter, startDate, endDate, employeeFilter]);

  useEffect(() => {
    loadEmployeeData();
  }, [loadEmployeeData]);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
    if (e.target.value !== 'custom_range') {
      setStartDate('');
      setEndDate('');
    }
    setPage(0);
  };

  const kpis = useMemo(() => {
    let sales = 0;
    let bills = 0;
    let credits = 0;
    let creditOrders = 0;
    (employeesData || []).forEach((emp) => {
      sales += Number(emp.totalAmount) || 0;
      bills += Number(emp.totalBillsCount) || 0;
      credits += Number(emp.creditAmount) || 0;
      creditOrders += Number(emp.creditOrderCount) || 0;
    });
    return { sales, bills, credits, creditOrders };
  }, [employeesData]);

  return (
    <div className="employee-view-container fade-in">
      <div className="employee-view-header mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 position-relative z-1">
          <div className="header-text-content">
            <div className="header-badge-title">
              <span className="header-icon-box">
                <i className="bi bi-people-fill"></i>
              </span>
              <h2 className="mb-0">EMPLOYEE PERFORMANCE & INSIGHTS</h2>
            </div>
            <p className="mb-0 text-blue-light">
              Comprehensive overview of employee-wise billing, revenue, and credit tracking
            </p>
          </div>
          <div className="header-quick-stats">
            <div className="quick-stat-item">
              <span className="stat-label">Active Records</span>
              <span className="stat-value">{totalElements}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="emp-kpi-card kpi-blue">
            <div className="kpi-icon-wrapper">
              <i className="bi bi-currency-rupee"></i>
            </div>
            <div className="kpi-content">
              <span className="kpi-label">TOTAL REVENUE (SALES)</span>
              <h4 className="kpi-value text-blue-dark">
                ₹{kpis.sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h4>
              <span className="kpi-subtext">Sum of sales for displayed data</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="emp-kpi-card kpi-emerald">
            <div className="kpi-icon-wrapper">
              <i className="bi bi-receipt"></i>
            </div>
            <div className="kpi-content">
              <span className="kpi-label">TOTAL BILLS PROCESSED</span>
              <h4 className="kpi-value text-emerald">
                {kpis.bills.toLocaleString('en-IN')}
              </h4>
              <span className="kpi-subtext">Completed bill transactions</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="emp-kpi-card kpi-amber">
            <div className="kpi-icon-wrapper">
              <i className="bi bi-journal-bookmark-fill"></i>
            </div>
            <div className="kpi-content">
              <span className="kpi-label">CREDIT ORDERS</span>
              <h4 className="kpi-value text-amber">
                {kpis.creditOrders.toLocaleString('en-IN')}
              </h4>
              <span className="kpi-subtext">Orders recorded as credit</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="emp-kpi-card kpi-rose">
            <div className="kpi-icon-wrapper">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div className="kpi-content">
              <span className="kpi-label">CREDIT AMOUNT</span>
              <h4 className="kpi-value text-rose">
                ₹{kpis.credits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h4>
              <span className="kpi-subtext">Outstanding customer credit balance</span>
            </div>
          </div>
        </div>
      </div>

      <div className="filter-card-container mb-4">
        <div className="filter-header-bar">
          <i className="bi bi-funnel-fill me-2" style={{ color: '#002142' }}></i>
          <span className="fw-bold text-dark">Filter Employee Records</span>
        </div>
        <div className="d-flex flex-wrap gap-3 align-items-end p-3">
          <div className="filter-group">
            <label htmlFor="dateFilter" className="form-label mb-1 fw-bold text-secondary small">
              <i className="bi bi-calendar-event me-1"></i> Date Filter:
            </label>
            <select
              id="dateFilter"
              className="form-select form-select-sm ops-select shadow-sm"
              value={dateFilter}
              onChange={handleDateFilterChange}
              style={{ minWidth: '170px' }}
            >
              <option value="all">All Time</option>
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

          {dateFilter === 'custom_range' && (
            <>
              <div className="filter-group">
                <label htmlFor="startDate" className="form-label mb-1 fw-bold text-secondary small">
                  Start Date:
                </label>
                <input
                  type="date"
                  id="startDate"
                  className="form-control form-control-sm ops-input shadow-sm"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(0);
                  }}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="endDate" className="form-label mb-1 fw-bold text-secondary small">
                  End Date:
                </label>
                <input
                  type="date"
                  id="endDate"
                  className="form-control form-control-sm ops-input shadow-sm"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(0);
                  }}
                />
              </div>
            </>
          )}

          <div className="filter-group">
            <label htmlFor="employeeFilter" className="form-label mb-1 fw-bold text-secondary small">
              <i className="bi bi-person-badge me-1"></i> Select Employee:
            </label>
            <select
              id="employeeFilter"
              className="form-select form-select-sm ops-select shadow-sm"
              value={employeeFilter}
              onChange={(e) => {
                setEmployeeFilter(e.target.value);
                setPage(0);
              }}
              style={{ minWidth: '200px' }}
            >
              <option value="">All Employees</option>
              {employeeNames.map((emp, idx) => {
                const name = emp.fullName || emp.name;
                return (
                  <option key={emp._id || emp.id || idx} value={name}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="emp-table-card shadow-sm mb-4">
        <div className="table-responsive">
          <table className="emp-custom-table w-100 align-middle mb-0">
            <thead>
              <tr>
                <th className="text-center" style={{ width: '70px' }}>S.NO</th>
                <th>EMPLOYEE NAME</th>
                <th className="text-center">TOTAL BILLS</th>
                <th className="text-end">TOTAL AMOUNT (₹)</th>
                <th className="text-center">CREDIT ORDERS</th>
                <th className="text-end">CREDIT AMOUNT (₹)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-0">
                    <div className="premium-loader-container py-5 text-center">
                      <div className="premium-loader mx-auto"></div>
                      <span className="loader-text mt-3 fw-bold d-block" style={{ color: '#002142' }}>
                        Loading Employee Insights...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : employeesData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <div className="empty-state-box">
                      <i className="bi bi-person-x fs-1 d-block mb-3 text-secondary"></i>
                      <h6 className="fw-bold text-dark mb-1">No Data Available</h6>
                      <p className="small text-muted mb-0">
                        No employee billing records match your specified criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                employeesData.map((emp, index) => (
                  <tr key={emp.employeeName || index} className="emp-table-row">
                    <td className="text-center fw-bold text-secondary">
                      {page * pageSize + index + 1}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="emp-avatar-icon">
                          <i className="bi bi-person"></i>
                        </div>
                        <span className="fw-bold" style={{ color: '#002142' }}>
                          {emp.employeeName || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="badge badge-bills">
                        {emp.totalBillsCount}
                      </span>
                    </td>
                    <td className="text-end fw-bold text-success font-monospace fs-6">
                      ₹{emp.totalAmount ? Number(emp.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge ${
                          emp.creditOrderCount > 0 ? 'badge-credit-active' : 'badge-credit-zero'
                        }`}
                      >
                        {emp.creditOrderCount}
                      </span>
                    </td>
                    <td
                      className={`text-end fw-bold font-monospace fs-6 ${
                        emp.creditAmount > 0 ? 'text-danger' : 'text-muted'
                      }`}
                    >
                      ₹{emp.creditAmount ? Number(emp.creditAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="custom-pagination-container d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 bg-white rounded shadow-sm">
        <div className="d-flex align-items-center gap-2">
          <label htmlFor="pageSize" className="form-label mb-0 small fw-bold text-secondary">
            Rows per page:
          </label>
          <select
            id="pageSize"
            className="form-select form-select-sm ops-select shadow-sm"
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
            Total Records: <strong style={{ color: '#002142' }}>{totalElements}</strong>
          </span>
        </div>

        {totalPages > 0 && (
          <div className="custom-pagination d-flex align-items-center gap-1">
            <button
              className="page-nav-btn btn btn-sm btn-outline-navy fw-bold"
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
                    return (
                      <span key={idx} className="text-muted px-1 align-self-center">
                        ...
                      </span>
                    );
                  return null;
                }

                return (
                  <button
                    key={idx}
                    className={`btn btn-sm ${page === idx ? 'btn-navy-active shadow-sm' : 'btn-outline-navy-num'} fw-bold`}
                    style={{ width: '34px', height: '34px', padding: '0' }}
                    onClick={() => handlePageChange(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <button
              className="page-nav-btn btn btn-sm btn-outline-navy fw-bold"
              disabled={page >= totalPages - 1}
              onClick={() => handlePageChange(page + 1)}
            >
              NEXT <i className="bi bi-chevron-right ms-1"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
