'use client';
import { useEffect, useState } from 'react';

export default function BillDetailsModal({ bill, onClose }) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!bill) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300); // match animation duration
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    };
    const formatted = new Date(dateString).toLocaleDateString('en-GB', options);
    return formatted.replace(',', '');
  };

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

  const totalAmount = bill.totalWithGst || bill.total || 0;
  const netAmount = bill.total || totalAmount;
  const totalPaid = bill.totalPaid || 0;
  const balanceDue = (bill.creditAmount !== undefined && bill.creditAmount !== null)
    ? bill.creditAmount
    : Math.max(0, netAmount - totalPaid);

  return (
    <div className={`bill-modal-overlay ${isClosing ? 'fade-out' : 'fade-in'}`} onClick={handleClose}>
      <div className={`bill-modal-content ${isClosing ? 'scale-out' : 'scale-in'}`} onClick={(e) => e.stopPropagation()}>

        <div className="modal-top-ribbon"></div>

        <div className="bill-modal-header">
          <div className="d-flex align-items-center gap-2">
            <div className="icon-circle bg-primary-subtle text-primary">
              <i className="bi bi-receipt-cutoff"></i>
            </div>
            <h5 className="mb-0 fw-bold text-dark tracking-wide">Bill Details</h5>
          </div>
          <button className="btn-close-modal" onClick={handleClose} aria-label="Close">
            <i className="bi bi-x"></i>
          </button>
        </div>

        <div className="bill-modal-body">
          <div className="bill-info-grid mb-4">
            <div className="info-card">
              <span className="info-label">Bill Number</span>
              <span className="info-value text-primary fw-bold">{bill.billNumber}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Date & Time</span>
              <span className="info-value">{formatDate(bill.createdAt || bill.date)}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Customer Name</span>
              <span className="info-value">{bill.customerName || 'CASH CUSTOMER'}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Attended By</span>
              <span className="info-value">
                <span className="badge bg-light text-secondary border">{bill.employee || 'N/A'}</span>
              </span>
            </div>
          </div>

          <div className="table-responsive modal-table-container rounded border mb-4">
            <table className="bill-items-table">
              <thead>
                <tr>
                  <th className="text-start ps-4">ITEM DESCRIPTION</th>
                  <th className="text-center">QTY</th>
                  <th className="text-end">RATE (₹)</th>
                  <th className="text-end pe-4">AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody>
                {particulars.length > 0 ? (
                  particulars.map((item, idx) => (
                    <tr key={idx} className="item-row">
                      <td className="text-start ps-4 fw-medium text-dark">{item.name || item.particularName}</td>
                      <td className="text-center">
                        <span className="qty-badge">{item.qty || 1}</span>
                      </td>
                      <td className="text-end text-muted">₹{item.price?.toFixed(2) || '0.00'}</td>
                      <td className="text-end pe-4 fw-semibold text-dark">
                        ₹{((item.qty || 1) * (item.price || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted font-italic">
                      No items found for this bill.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bill-summary-section mt-3">
            <div className="summary-card horizontal-summary">
              <div className="summary-col">
                <span className="summary-label text-muted">Net Amount</span>
                <span className="summary-value fw-semibold text-dark fs-5">₹ {netAmount.toFixed(2)}</span>
              </div>
              <div className="summary-divider-vertical"></div>
              <div className="summary-col">
                <span className="summary-label text-muted">Total Paid</span>
                <span className="summary-value fw-bold text-success fs-5">₹ {totalPaid.toFixed(2)}</span>
              </div>
              {(bill.billStatus?.toUpperCase() === 'CREDIT' || balanceDue > 0.01) && (
                <>
                  <div className="summary-divider-vertical"></div>
                  <div className="summary-col">
                    <span className="summary-label text-muted">Balance</span>
                    <span className="summary-value fw-bold text-danger fs-5">₹ {balanceDue.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}