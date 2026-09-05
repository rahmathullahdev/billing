'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function EmployeeViewPage() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empBills, setEmpBills] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(d => {
      if (d.data) setEmployees(d.data);
    });
  }, []);

  const handleSelect = async (emp) => {
    setSelectedEmp(emp);
    setLoading(true);
    try {
      const name = emp.fullName || emp.name;
      const res = await fetch(`/api/bills?limit=100`);
      const data = await res.json();
      if (data.data) {
        const filtered = data.data.filter(b => b.employee?.toLowerCase() === name.toLowerCase());
        setEmpBills(filtered);
      }
    } catch (e) { toast.error('Error'); } finally { setLoading(false); }
  };

  const totalBilled = empBills.reduce((a, b) => a + (Number(b.total) || 0), 0);

  return (
    <div className="fade-in">
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm" style={{ background: 'linear-gradient(135deg, #002142, #4f46e5)' }}>
        <h4 className="fw-bold mb-0 text-uppercase">Employee Performance View</h4>
      </div>

      <div className="row">
        <div className="col-md-4 mb-3">
          <div className="bg-white p-3 rounded shadow-sm">
            <h6>Select Employee</h6>
            <div className="list-group">
              {employees.map(e => (
                <button key={e.id} className={`list-group-item list-group-item-action ${selectedEmp?.id === e.id ? 'active' : ''}`} onClick={() => handleSelect(e)}>
                  <div className="fw-bold">{e.fullName || e.name}</div>
                  <div className="small opacity-75">{e.employeeId} - {e.role || 'Staff'}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-md-8">
          {selectedEmp ? (
            <div className="bg-white p-4 rounded shadow-sm">
              <h4>{selectedEmp.fullName || selectedEmp.name}</h4>
              <p className="text-muted">Branch: {selectedEmp.branch || 'Main'} | Phone: {selectedEmp.phone || 'N/A'}</p>

              <div className="d-flex gap-3 my-3">
                <div className="p-3 bg-light rounded flex-fill">
                  <span className="text-muted small">Total Billed</span>
                  <h4 className="text-success mb-0">₹{totalBilled.toFixed(2)}</h4>
                </div>
                <div className="p-3 bg-light rounded flex-fill">
                  <span className="text-muted small">Total Bills Created</span>
                  <h4 className="text-primary mb-0">{empBills.length}</h4>
                </div>
              </div>

              <h5>Recent Activity</h5>
              <table className="data-table w-100">
                <thead><tr><th>Bill #</th><th>Customer</th><th>Amount</th><th>Date</th></tr></thead>
                <tbody>{loading ? <tr><td colSpan="4">Loading...</td></tr> : empBills.map(b => (
                  <tr key={b.id}>
                    <td className="fw-bold text-primary">{b.billNumber}</td>
                    <td>{b.customerName || '-'}</td>
                    <td className="text-success">₹{Number(b.total || 0).toFixed(2)}</td>
                    <td className="small text-muted">{new Date(b.createdAt || b.date).toLocaleDateString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white p-5 rounded shadow-sm text-center text-muted">
              Select an employee to view performance metrics and bills processed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
