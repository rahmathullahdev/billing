'use client';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

export default function ManageEmployeePage() {
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const size = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ employeeId: '', name: '', phone: '', email: '', designation: '', branchName: '', branchId: '', salary: 0 });

  const itemId = (x) => x && (x._id || x.id);

  useEffect(() => { fetchEmployees(); fetchBranches(); }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employees?listAll=true');
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : (data.data?.content || []);
      setEmployees(list);
    } catch (e) { toast.error('Failed to load employees'); setEmployees([]); }
    finally { setLoading(false); }
  };

  const fetchBranches = async () => {
    try { const res = await fetch('/api/branches'); const data = await res.json(); setBranches(Array.isArray(data.data) ? data.data : []); } catch (e) { setBranches([]); }
  };

  const resetForm = () => setFormData({ employeeId: '', name: '', phone: '', email: '', designation: '', branchName: '', branchId: '', salary: 0 });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/employees/${itemId(editingItem)}` : '/api/employees';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { toast.success(`Employee ${editingItem ? 'updated' : 'created'}`); setModalOpen(false); setEditingItem(null); resetForm(); fetchEmployees(); }
      else { toast.error('Failed to save employee'); }
    } catch (e) { toast.error('Error saving employee'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Employee deleted'); fetchEmployees(); }
    } catch (e) { toast.error('Failed to delete employee'); }
  };

  const handleToggle = async (emp) => {
    try {
      const res = await fetch(`/api/employees/${itemId(emp)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...emp, isActive: !emp.isActive }) });
      if (res.ok) { toast.success(emp.isActive ? 'Employee deactivated' : 'Employee activated'); fetchEmployees(); }
    } catch (e) { toast.error('Error updating status'); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter(emp =>
      (statusFilter === 'all' || String(emp.isActive) === String(statusFilter === 'active')) &&
      (!q || (emp.fullName || emp.name || '').toLowerCase().includes(q) || (emp.employeeId || '').toLowerCase().includes(q) || (emp.designation || '').toLowerCase().includes(q) || (emp.branchName || '').toLowerCase().includes(q)));
  }, [employees, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const paged = filtered.slice(page * size, page * size + size);

  return (
    <div className="employees-page fade-in text-dark p-3">
      <div className="manage-header-card mb-3 d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: 44, height: 44, backgroundColor: '#002142' }}>
            <i className="bi bi-people fs-5"></i>
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: '#002142' }}>Manage Employees</h4>
            <p className="mb-0 text-muted small">Add and administer staff profiles, salaries and branches</p>
          </div>
        </div>
        <button className="btn text-white fw-semibold d-flex align-items-center gap-2" style={{ backgroundColor: '#002142', borderRadius: '8px' }} onClick={() => { setEditingItem(null); resetForm(); setModalOpen(true); }}>
          <i className="bi bi-plus-lg"></i><span>Add Employee</span>
        </button>
      </div>

      <div className="branch-banner position-relative text-center text-white mb-4 rounded px-4 py-4 shadow-sm" style={{ backgroundColor: '#002142' }}>
        <div className="position-absolute top-0 end-0 m-3 px-3 py-1 badge bg-light text-dark shadow-sm fw-bold">Total Employees: {filtered.length}</div>
        <h3 className="fw-bold mb-2 text-uppercase tracking-wider">Employees Management</h3>
        <p className="mb-0 text-white-50 small">Administer staff records, designations and salaries</p>
      </div>

      <div className="bg-white p-3 rounded shadow-sm mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="input-group" style={{ maxWidth: '350px' }}>
          <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
          <input type="text" placeholder="Search name, ID, designation or branch..." className="form-control border-start-0 shadow-none" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <div className="btn-group">
          {['all', 'active', 'inactive'].map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => { setStatusFilter(s); setPage(0); }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="table-responsive rounded shadow-sm bg-white border-0">
        <table className="particulars-table data-table w-100">
          <thead><tr style={{ backgroundColor: '#002142' }}>
            <th className="text-center" style={{ width: '60px' }}>#</th>
            <th>EMP ID</th>
            <th>FULL NAME</th>
            <th>PHONE</th>
            <th>EMAIL</th>
            <th>DESIGNATION</th>
            <th>BRANCH</th>
            <th>SALARY</th>
            <th className="text-center">STATUS</th>
            <th className="text-center">ACTIONS</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="10" className="text-center py-5">Loading...</td></tr>
              : paged.length === 0 ? <tr><td colSpan="10" className="text-center py-5 text-muted">No employees found.</td></tr>
                : paged.map((emp, i) => (
                  <tr key={itemId(emp) || i}>
                    <td className="text-center fw-bold">{page * size + i + 1}</td>
                    <td className="fw-bold text-primary">{emp.employeeId || '-'}</td>
                    <td className="fw-bold" style={{ color: '#002142' }}>{emp.fullName || emp.name}</td>
                    <td>{emp.phone || '-'}</td>
                    <td>{emp.email || '-'}</td>
                    <td><span className="badge bg-light text-dark border">{emp.designation || 'Staff'}</span></td>
                    <td>{emp.branchName || '-'}</td>
                    <td className="text-success fw-bold">₹{Number(emp.salary || 0).toFixed(2)}</td>
                    <td className="text-center">
                      <button className={`btn btn-sm rounded-pill px-3 ${emp.isActive === false ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(emp)}>{emp.isActive === false ? 'Inactive' : 'Active'}</button>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(emp); setFormData({ employeeId: emp.employeeId || '', name: emp.fullName || emp.name || '', phone: emp.phone || '', email: emp.email || '', designation: emp.designation || '', branchName: emp.branchName || '', branchId: emp.branchId || '', salary: emp.salary || 0 }); setModalOpen(true); }}>
                        <i className="bi bi-pencil me-1"></i> Edit
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(itemId(emp))}>
                        <i className="bi bi-trash me-1"></i> Delete
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {filtered.length > size && (
        <div className="d-flex justify-content-between align-items-center bg-white rounded shadow-sm p-2 mt-3">
          <small className="text-muted">Showing {page * size + 1}-{Math.min((page + 1) * size, filtered.length)} of {filtered.length}</small>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-outline-dark" disabled={page === 0} onClick={() => setPage(page - 1)}><i className="bi bi-chevron-left"></i></button>
            <span className="align-self-center px-2 fw-bold">{page + 1} / {totalPages}</span>
            <button className="btn btn-sm btn-outline-dark" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}><i className="bi bi-chevron-right"></i></button>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal-backdrop-custom" onClick={() => setModalOpen(false)}>
          <div className="modal-box-custom" onClick={e => e.stopPropagation()}>
            <h5 className="fw-bold" style={{ color: '#002142' }}>{editingItem ? 'Edit Employee' : 'Add New Employee'}</h5>
            <hr />
            <form onSubmit={handleSave}>
              <div className="row g-2">
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">EMP ID</label><input type="text" className="form-control" value={formData.employeeId} onChange={e => setFormData({ ...formData, employeeId: e.target.value })} /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">FULL NAME</label><input type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">PHONE</label><input type="text" className="form-control" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">EMAIL</label><input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">DESIGNATION</label><input type="text" className="form-control" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">BRANCH</label>
                  <select className="form-control" value={formData.branchId || ''} onChange={e => { const b = branches.find(b => itemId(b) === e.target.value); setFormData({ ...formData, branchId: e.target.value, branchName: b ? (b.name || '') : '' }); }}>
                    <option value="">-- Select Branch --</option>
                    {branches.map(b => <option key={itemId(b)} value={itemId(b)}>{b.name}</option>)}
                  </select>
                </div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">SALARY (₹)</label><input type="number" step="0.01" className="form-control" value={formData.salary} onChange={e => setFormData({ ...formData, salary: Number(e.target.value) })} /></div></div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#002142', borderColor: '#002142' }}>Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}