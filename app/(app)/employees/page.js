'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ManageEmployeePage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ employeeId: '', fullName: '', phone: '', email: '', branch: '', role: 'Staff' });

  useEffect(() => { fetchEmployees(); }, []);
  const fetchEmployees = async () => {
    setLoading(true);
    try { const res = await fetch('/api/employees'); const data = await res.json(); if (data.data) setEmployees(data.data); } catch(e) { toast.error('Error'); } finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/employees/${editingItem.id}` : '/api/employees';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { toast.success('Saved'); setModalOpen(false); fetchEmployees(); }
    } catch(e) { toast.error('Error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete employee?')) return;
    try { const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' }); if (res.ok) { toast.success('Deleted'); fetchEmployees(); } } catch(e) { toast.error('Failed'); }
  };

  return (
    <div className="fade-in">
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm" style={{ background: 'linear-gradient(135deg, #002142, #4338ca)' }}>
        <h4 className="fw-bold mb-0 text-uppercase">Employees Management</h4>
      </div>
      <div className="d-flex justify-content-end mb-3"><button className="btn btn-primary" onClick={() => { setEditingItem(null); setFormData({ employeeId: '', fullName: '', phone: '', email: '', branch: '', role: 'Staff' }); setModalOpen(true); }}>+ Add Employee</button></div>
      <div className="table-responsive rounded shadow-sm bg-white p-3">
        <table className="data-table w-100">
          <thead><tr><th>#</th><th>Emp ID</th><th>Full Name</th><th>Phone</th><th>Branch</th><th>Role</th><th>Actions</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan="7">Loading...</td></tr> : employees.map((emp, i) => (
            <tr key={emp.id}>
              <td>{i+1}</td>
              <td className="fw-bold text-primary">{emp.employeeId}</td>
              <td>{emp.fullName || emp.name}</td>
              <td>{emp.phone || '-'}</td>
              <td><span className="badge bg-light text-dark border">{emp.branch || 'Main'}</span></td>
              <td><span className="badge bg-info">{emp.role || 'Staff'}</span></td>
              <td>
                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(emp); setFormData({ employeeId: emp.employeeId, fullName: emp.fullName || emp.name, phone: emp.phone || '', email: emp.email || '', branch: emp.branch || '', role: emp.role || 'Staff' }); setModalOpen(true); }}>✏️ Edit</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(emp.id)}>🗑️ Delete</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-box p-4 bg-white rounded shadow-lg" style={{ maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h5>{editingItem ? 'Edit Employee' : 'Add Employee'}</h5>
            <form onSubmit={handleSave}>
              <div className="form-group my-2"><label>Emp ID</label><input type="text" className="form-control" value={formData.employeeId} onChange={e => setFormData({ ...formData, employeeId: e.target.value })} required /></div>
              <div className="form-group my-2"><label>Full Name</label><input type="text" className="form-control" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} required /></div>
              <div className="form-group my-2"><label>Phone</label><input type="text" className="form-control" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
              <div className="form-group my-2"><label>Branch</label><input type="text" className="form-control" value={formData.branch} onChange={e => setFormData({ ...formData, branch: e.target.value })} /></div>
              <div className="d-flex justify-content-end gap-2 mt-3"><button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary btn-sm">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
