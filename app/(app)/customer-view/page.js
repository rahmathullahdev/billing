'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

export default function CustomerViewPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');

  const loadCustomerData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bills/customer-wise-data?page=${page}&size=${pageSize}`);
      const json = await response.json();
      const data = json.data || json;

      if (data) {
        setCustomers(data.content || []);
        setTotalPages(data.totalPages || data.page?.totalPages || 0);
        setTotalElements(data.totalElements || data.page?.totalElements || data.content?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching customer wise data:', error);
      toast.error('Failed to load customer wise data');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  const filteredCustomers = customers.filter((customer) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return customer.customerName && customer.customerName.toLowerCase().includes(searchLower);
  });

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="customer-view-container fade-in">
      <div className="customer-banner position-relative text-center text-white mb-4 rounded px-3 py-4 shadow-sm">
        <h4 className="fw-bold mb-2 text-uppercase tracking-wider">
          Customer Insights
        </h4>
        <p className="mb-0 text-white-50" style={{ fontSize: '0.9rem' }}>
          Comprehensive overview of customer-wise billing, revenue, and credits
        </p>
      </div>

      <div className="filter-card mb-4 bg-white p-3 rounded shadow-sm">
        <div className="d-flex align-items-center">
          <label htmlFor="customerSearch" className="form-label mb-0 me-3 fw-bold text-muted text-nowrap">
            <i className="bi bi-search me-2" style={{ color: '#002142' }}></i> Search Customers:
          </label>
          <input
            id="customerSearch"
            type="text"
            className="form-control form-control-sm shadow-sm"
            placeholder="Search by customer name..."
            style={{ maxWidth: '300px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive rounded shadow-sm bg-white pb-2">
        <table className="customers-table data-table w-100 table mb-0">
          <thead>
            <tr>
              <th className="text-center" style={{ width: '60px' }}>S.No</th>
              <th>Customer Name</th>
              <th>Total Bills</th>
              <th>Total Amount (₹)</th>
              <th>Credit Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="p-0">
                  <div className="premium-loader-container py-5 text-center">
                    <div className="premium-loader mx-auto"></div>
                    <span className="loader-text mt-3 d-block fw-bold" style={{ color: '#002142' }}>Fetching Customer Data...</span>
                  </div>
                </td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-5 text-muted">
                  <i className="bi bi-person-x fs-3 d-block mb-2 text-secondary"></i>
                  No customers found matching your search.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer, index) => (
                <tr key={customer.customerName || index} className="table-row-hover border-bottom">
                  <td className="text-center fw-semibold text-muted">
                    {page * pageSize + index + 1}
                  </td>
                  <td className="fw-bold" style={{ color: '#002142' }}>{customer.customerName || 'Unknown'}</td>
                  <td className="fw-semibold">{customer.totalBillsCount}</td>
                  <td className="fw-semibold text-success">
                    ₹{customer.totalBuyAmount ? Number(customer.totalBuyAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                  </td>
                  <td className={`fw-semibold ${Number(customer.creditBalanceAmount) > 0 ? 'text-danger' : 'text-muted'}`}>
                    ₹{customer.creditBalanceAmount ? Number(customer.creditBalanceAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="custom-pagination-container mt-4 mb-3 d-flex justify-content-between align-items-center flex-wrap gap-3">
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
            Total records: <strong>{searchTerm ? filteredCustomers.length : totalElements}</strong>
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
                    style={{ width: '32px', height: '32px', padding: '0', backgroundColor: page === idx ? '#002142' : undefined, borderColor: page === idx ? '#002142' : undefined }}
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
    </div>
  );
}
