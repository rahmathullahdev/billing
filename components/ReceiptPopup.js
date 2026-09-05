'use client';

export default function ReceiptPopup({ orderDetails, onClose }) {
  if (!orderDetails) return null;

  const SHOP_NAME = "SYNDICATE PRINTERS";
  const SHOP_LOGO = "/logo2.png";
  const SHOP_ADDRESS_LINE1 = "BHARATHY SALAI, OPP JAMBAZAR POLICE STATION,";
  const SHOP_ADDRESS_LINE2 = "ROYAPETTAH, CHENNAI - 14";
  const SHOP_CONTACT = "PH: +91 9840031990";
  const SHOP_GSTIN = "33ALSPS7215E1ZW";

  const handlePrintReceipt = () => {
    window.print();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return new Date().toLocaleString();
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const calculateTaxPercent = () => {
    if (orderDetails.taxPercent !== undefined && orderDetails.taxPercent !== null) {
      const percent = Number(orderDetails.taxPercent);
      return isNaN(percent) || percent < 0 ? 0 : percent;
    }
    if (orderDetails.subtotal && orderDetails.subtotal > 0 && orderDetails.tax !== undefined && orderDetails.tax !== null) {
      const calculatedPercent = (orderDetails.tax / orderDetails.subtotal) * 100;
      return isNaN(calculatedPercent) || calculatedPercent < 0 ? 0 : calculatedPercent;
    }
    return 0;
  };

  const billNumber = orderDetails.invoiceNumber || orderDetails.orderId || "N/A";
  const calculatedTax = calculateTaxPercent();
  const isNonGst = String(billNumber).toUpperCase().endsWith("-E") || (calculatedTax < 1 && (!orderDetails.tax || orderDetails.tax < 0.01));
  const taxPercent = isNonGst ? 0 : (calculatedTax > 0 ? calculatedTax : 18);

  const creditAmount = orderDetails.creditType === "CREDIT" ? orderDetails.pendingAmount || 0 : 0;
  const netAmount = orderDetails.creditType === "CREDIT" && creditAmount > 0 ? orderDetails.grandTotal - creditAmount : orderDetails.grandTotal;
  const totalPaid = orderDetails.creditType === "CREDIT" ? orderDetails.paidAmount || 0 : orderDetails.grandTotal;

  const extractEstNo = (invNum) => {
    if (!invNum) return "N/A";
    const match = invNum.match(/(\d+)-(\d+)/);
    if (match) return match[0];
    return invNum.split("-").slice(-2).join("-") || invNum;
  };

  const estNo = extractEstNo(billNumber);

  return (
    <div className="receipt-popup-overlay">
      <div className={`receipt-popup ${isNonGst ? 'non-gst-receipt' : ''}`}>
        <div id="receipt-print-area" className="receipt-print-area">
          {isNonGst ? (
            <div className="non-gst-header">
              <h1 className="bill-estimate-title">BILL ESTIMATE</h1>
            </div>
          ) : (
            <div className="receipt-company-header">
              <div className="company-logo-name">
                {SHOP_LOGO && (
                  <img src={SHOP_LOGO} alt="Syndicate Printers Logo" className="company-logo" />
                )}
                <h1 className="company-name">{SHOP_NAME.toUpperCase()}</h1>
              </div>
              <p className="company-address">{SHOP_ADDRESS_LINE1}</p>
              <p className="company-address">{SHOP_ADDRESS_LINE2}</p>
              <p className="company-contact">{SHOP_CONTACT}</p>
              <p className="company-gstin"><strong>GSTIN:</strong> {SHOP_GSTIN}</p>
              {orderDetails.gstin && (
                <p className="customer-gstin"><strong>CUSTOMER GSTIN:</strong> {orderDetails.gstin.toUpperCase()}</p>
              )}
            </div>
          )}

          <div className="pos-dashed-line"></div>

          <div className="pos-transaction-details">
            <div className="pos-transaction-row">
              <span className="pos-left"><strong>{isNonGst ? 'EST NO:' : 'BILL NO:'}</strong> {isNonGst ? estNo : billNumber}</span>
              <span className="pos-right"><strong>DATE:</strong> {formatDateTime(orderDetails.createdAt)}</span>
            </div>
            <div className="pos-transaction-row">
              <span className="pos-left"><strong>ATTENDED BY:</strong> {(orderDetails.username || "1").toUpperCase()}</span>
              <span className="pos-right"><strong>CUSTOMER:</strong> {(orderDetails.customerName || "CASH CUSTOMER").toUpperCase()}</span>
            </div>
          </div>

          <div className="pos-dashed-line"></div>

          <div className="pos-items-container">
            <div className="pos-item-row pos-header-row">
              <span className={isNonGst ? "pos-col-item-nongst" : "pos-col-item"}>ITEM</span>
              <span className="pos-col-qty">QTY</span>
              <span className="pos-col-rate">RATE</span>
              {!isNonGst && <span className="pos-col-gst">GST</span>}
              <span className="pos-col-amt">AMT</span>
            </div>
            <div className="pos-dashed-line"></div>

            {orderDetails.items && orderDetails.items.map((item, index) => {
              const itemAmount = (item.price || 0) * (item.quantity || 1);
              return (
                <div key={index} className="pos-item-row">
                  <span className={isNonGst ? "pos-col-item-nongst" : "pos-col-item"}>{(item.name || "").toUpperCase()}</span>
                  <span className="pos-col-qty">{item.quantity}</span>
                  <span className="pos-col-rate">₹{Number(item.price || 0).toFixed(2)}</span>
                  {!isNonGst && <span className="pos-col-gst">{taxPercent > 0 ? `${taxPercent.toFixed(0)}%` : "18%"}</span>}
                  <span className="pos-col-amt">₹{itemAmount.toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          <div className="pos-dashed-line"></div>

          <div className="pos-summary">
            {!isNonGst && (
              <div className="pos-summary-row">
                <span><strong>GST (SGST + CGST):</strong></span>
                <span>₹{orderDetails.tax ? Number(orderDetails.tax).toFixed(2) : "0.00"}</span>
              </div>
            )}
            <div className="pos-summary-row pos-total-row">
              <span><strong>TOTAL AMOUNT:</strong></span>
              <span>₹{Number(orderDetails.grandTotal || 0).toFixed(2)}</span>
            </div>
            {orderDetails.creditType === "CREDIT" && creditAmount > 0 && (
              <div className="pos-summary-row">
                <span><strong>CREDIT:</strong></span>
                <span>₹{creditAmount.toFixed(2)}</span>
              </div>
            )}
            {orderDetails.creditType === "CREDIT" && (
              <div className="pos-summary-row">
                <span><strong>NET AMOUNT:</strong></span>
                <span>₹{netAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="pos-summary-row">
              <span><strong>TOTAL PAID:</strong></span>
              <span>₹{Number(totalPaid || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="pos-dashed-line"></div>

          <div className="pos-footer">
            <p className="pos-footer-message">{isNonGst ? "* GST EXTRA AS APPLICABLE" : "THANKS FOR CHOOSING US..WELCOME AGAIN"}</p>
          </div>
        </div>

        <div className="d-flex justify-content-center gap-3 mt-4 no-print">
          <button className="btn btn-warning" onClick={handlePrintReceipt}>Print Receipt</button>
          <button className="btn btn-danger" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
