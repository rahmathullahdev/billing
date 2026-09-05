'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ReceiptPopup from '@/components/ReceiptPopup';

export default function TodayBillsPage() {
  const router = useRouter();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [printBill, setPrintBill] = useState(null);

  useEffect(() => {
    fetchTodayBills();
  }, []);

  const fetchTodayBills = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bills?filter=today&limit=100');
      const data = await res.json();
      if (data.data) setBills(data.data);
    } catch (e) {
      toast.error("Failed to load today's bills");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (bill) => {
    let particulars = [];
    try {
      particulars = typeof bill.particulars === 'string' ? JSON.parse(bill.particulars) : (bill.particulars || []);
    } catch (e) {}

    setPrintBill({
      invoiceNumber: bill.billNumber,
      orderId: bill.id,
      createdAt: bill.createdAt || bill.date,
      username: bill.employee,
      customerName: bill.customerName || 'CASH CUSTOMER',
      grandTotal: bill.total || 0,
      paidAmount: bill.totalPaid || 0,
      items: particulars.map(p => ({ name: p.name || p.particularId || 'ITEM', quantity: p.qty || 1, price: p.price || 0 })),
      creditType: bill.creditAmount > 0 ? 'CREDIT' : 'CASH',
      pendingAmount: bill.creditAmount || 0,
      taxPercent: bill.billNumber && String(bill.billNumber).endsWith('-E') ? 0 : 18
    });
  };

  return (
    <div className="fade-in">
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm" style={{ background: 'linear-gradient(135deg, #002142, #059669)' }}>
        <h4 className="fw-bold mb-0 text-uppercase">Today's Bills</h4>
        <p className="mb-0 text-white-50 small mt-1">Overview of all bills issued today</p>
      </div>

      <div className="table-responsive rounded shadow-sm bg-white p-3">
        <table className="data-table w-100">
          <thead>
            <tr>
              <th>#</th>
              <th>Bill Number</th>
              <th>Customer</th>
              <th>Total Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-4">Loading today's bills...</td></tr>
            ) : bills.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-4 text-muted">No bills generated today yet.</td></tr>
            ) : (
              bills.map((bill, i) => (
                <tr key={bill.id}>
                  <td>{i + 1}</td>
                  <td className="fw-bold text-primary">{bill.billNumber}</td>
                  <td>{bill.customerName || 'Cash Customer'}</td>
                  <td className="fw-semibold text-success">₹{Number(bill.total || 0).toFixed(2)}</td>
                  <td><span className="badge bg-secondary">{bill.payment || 'Cash'}</span></td>
                  <td>
                    {bill.creditAmount > 0 ? (
                      <span className="badge bg-warning text-dark">Credit (₹{bill.creditAmount})</span>
                    ) : (
                      <span className="badge bg-success">Paid</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => handlePrint(bill)}>🖨️ Print</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => router.push(`/bills/create?id=${bill.id}`)}>✏️ Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {printBill && <ReceiptPopup orderDetails={printBill} onClose={() => setPrintBill(null)} />}
    </div>
  );
}
