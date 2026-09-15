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
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', email: '', role: 'User', dateOfJoining: '', dateOfResign: '', designation: '', branchName: '', branchId: '', salary: 0, photo: '', resume: '' });

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

  const resetForm = () => setFormData({ firstName: '', lastName: '', phone: '', email: '', role: 'User', dateOfJoining: '', dateOfResign: '', designation: '', branchName: '', branchId: '', salary: 0, photo: '', resume: '' });

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

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
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Employee deleted'); fetchEmployees(); }
    } catch (e) { toast.error('Failed to delete employee'); }
    setDeleteConfirmId(null);
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
      (!q || ((emp.firstName || '') + ' ' + (emp.lastName || '')).toLowerCase().includes(q) || (emp.name || '').toLowerCase().includes(q) || (emp.designation || '').toLowerCase().includes(q) || (emp.branchName || '').toLowerCase().includes(q)));
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
          <input type="text" placeholder="Search name, designation or branch..." className="form-control border-start-0 shadow-none" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
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
            {loading ? <tr><td colSpan="9" className="text-center py-5">Loading...</td></tr>
              : paged.length === 0 ? <tr><td colSpan="9" className="text-center py-5 text-muted">No employees found.</td></tr>
                : paged.map((emp, i) => (
                  <tr key={itemId(emp) || i}>
                    <td className="text-center fw-bold">{page * size + i + 1}</td>
                    <td className="fw-bold" style={{ color: '#002142' }}>{emp.firstName ? `${emp.firstName} ${emp.lastName || ''}` : (emp.name || '-')}</td>
                    <td>{emp.phone || '-'}</td>
                    <td>{emp.email || '-'}</td>
                    <td><span className="badge bg-light text-dark border">{emp.designation || 'Staff'}</span></td>
                    <td>{emp.branchName || '-'}</td>
                    <td className="text-success fw-bold">₹{Number(emp.salary || 0).toFixed(2)}</td>
                    <td className="text-center">
                      <button className={`btn btn-sm rounded-pill px-3 ${emp.isActive === false ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(emp)}>{emp.isActive === false ? 'Inactive' : 'Active'}</button>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(emp); setFormData({ firstName: emp.firstName || (emp.name ? emp.name.split(' ')[0] : ''), lastName: emp.lastName || (emp.name ? emp.name.split(' ').slice(1).join(' ') : ''), phone: emp.phone || '', email: emp.email || '', role: emp.role || 'User', dateOfJoining: emp.dateOfJoining || '', dateOfResign: emp.dateOfResign || '', designation: emp.designation || '', branchName: emp.branchName || '', branchId: emp.branchId || '', salary: emp.salary || 0, photo: emp.photo || '', resume: emp.resume || '' }); setModalOpen(true); }}>
                        <i className="bi bi-pencil me-1"></i> Edit
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteConfirmId(itemId(emp))}>
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

      {deleteConfirmId && (
        <div className="d-flex align-items-center justify-content-center modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-white p-4 text-center modal-content-animated shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="icon-container mx-auto mb-3 d-flex align-items-center justify-content-center bg-danger bg-opacity-10 rounded-circle" style={{ width: '80px', height: '80px' }}>
              <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: '3.5rem' }}></i>
            </div>
            <h4 className="fw-bold mb-2 text-dark">Delete Employee?</h4>
            <p className="text-muted mb-4 px-2" style={{ fontSize: '1rem' }}>
              Are you sure you want to delete this employee?<br/>
              This action cannot be undone.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <button className="btn btn-secondary px-4 py-2 fw-semibold btn-hover-effect border-0" style={{ borderRadius: '8px', backgroundColor: '#64748b' }} onClick={() => setDeleteConfirmId(null)}>No</button>
              <button className="btn btn-danger px-4 py-2 fw-semibold btn-hover-effect border-0 shadow-sm" style={{ borderRadius: '8px', backgroundColor: '#ef4444' }} onClick={() => handleDelete(deleteConfirmId)}>Yes, delete it</button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center bg-dark bg-opacity-50" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1050 }} onClick={() => setModalOpen(false)}>
          <div className="bg-white p-4 rounded shadow-lg" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold d-flex align-items-center gap-2 m-0" style={{ color: '#002142' }}>
                <i className="bi bi-person-badge text-primary"></i>
                {editingItem ? 'Edit Employee Details' : 'Add New Employee'}
              </h5>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setModalOpen(false)}>
                <i className="bi bi-x-lg me-1"></i> Close
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="fw-bold small text-muted mb-1">FIRST NAME <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-white"><i className="bi bi-person text-muted"></i></span>
                    <input type="text" className="form-control border-start-0 ps-0" placeholder="Enter first name" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small text-muted mb-1">LAST NAME <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-white"><i className="bi bi-person text-muted"></i></span>
                    <input type="text" className="form-control border-start-0 ps-0" placeholder="Enter last name" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small text-muted mb-1">EMAIL <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-white"><i className="bi bi-envelope text-muted"></i></span>
                    <input type="email" className="form-control border-start-0 ps-0" placeholder="Enter email address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small text-muted mb-1">ROLE <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-white"><i className="bi bi-shield-check text-muted"></i></span>
                    <select className="form-select border-start-0 ps-0" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                      <option value="User">User</option>
                      <option value="Admin">Admin</option>
                      <option value="Employee">Employee</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small text-muted mb-1">DATE OF JOINING</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white"><i className="bi bi-calendar3 text-muted"></i></span>
                    <input type="date" className="form-control border-start-0 ps-0" value={formData.dateOfJoining} onChange={e => setFormData({ ...formData, dateOfJoining: e.target.value })} />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small text-muted mb-1">BRANCH <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-white"><i className="bi bi-building text-muted"></i></span>
                    <select className="form-select border-start-0 ps-0" value={formData.branchId || ''} onChange={e => { const b = branches.find(b => itemId(b) === e.target.value); setFormData({ ...formData, branchId: e.target.value, branchName: b ? (b.name || '') : '' }); }} required>
                      <option value="">Select Branch</option>
                      {branches.map(b => <option key={itemId(b)} value={itemId(b)}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small text-muted mb-1">DESIGNATION</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white"><i className="bi bi-briefcase text-muted"></i></span>
                    <input type="text" className="form-control border-start-0 ps-0" placeholder="Enter designation" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small text-muted mb-1">SALARY (₹)</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white">₹</span>
                    <input type="number" step="0.01" className="form-control border-start-0 ps-0" placeholder="0.00" value={formData.salary || ''} onChange={e => setFormData({ ...formData, salary: Number(e.target.value) })} />
                  </div>
                </div>
                
                {editingItem && (
                  <div className="col-md-6">
                    <label className="fw-bold small text-muted mb-1">DATE OF RESIGN</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white"><i className="bi bi-calendar-x text-muted"></i></span>
                      <input type="date" className="form-control border-start-0 ps-0" value={formData.dateOfResign || ''} onChange={e => setFormData({ ...formData, dateOfResign: e.target.value })} />
                    </div>
                  </div>
                )}
                
                <div className="col-12 mt-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="fw-bold small text-muted mb-1">EMPLOYEE PHOTO</label>
                      <div className="border border-primary border-dashed rounded p-2 text-center" style={{ borderStyle: 'dashed', backgroundColor: '#f8f9fa' }}>
                        <input type="file" id="photoUpload" className="d-none" accept="image/*" onChange={(e) => handleFileChange(e, 'photo')} />
                        <label htmlFor="photoUpload" className="d-flex align-items-center justify-content-between w-100 m-0" style={{ cursor: 'pointer' }}>
                           <i className="bi bi-image text-danger ms-2 fs-5"></i>
                           <span className="text-primary fw-semibold me-2">CHOOSE PHOTO</span>
                        </label>
                        {formData.photo && <div className="mt-2 text-success small"><i className="bi bi-check-circle-fill"></i> Photo selected</div>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="fw-bold small text-muted mb-1">EMPLOYEE RESUME (PDF/WORD)</label>
                      <div className="border border-info border-dashed rounded p-2 text-center" style={{ borderStyle: 'dashed', backgroundColor: '#f8f9fa' }}>
                        <input type="file" id="resumeUpload" className="d-none" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => handleFileChange(e, 'resume')} />
                        <label htmlFor="resumeUpload" className="d-flex align-items-center justify-content-between w-100 m-0" style={{ cursor: 'pointer' }}>
                           <i className="bi bi-file-earmark-text text-danger ms-2 fs-5"></i>
                           <span className="text-info fw-semibold me-2">CHOOSE RESUME FILE</span>
                        </label>
                        {formData.resume && <div className="mt-2 text-success small"><i className="bi bi-check-circle-fill"></i> Resume selected</div>}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="submit" className="btn btn-primary px-4 py-2" style={{ backgroundColor: '#0d6efd', borderRadius: '4px' }}>
                  <i className="bi bi-save me-1"></i> Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1100;
          background-color: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          animation: fadeIn 0.3s ease-out forwards;
        }
        .modal-content-animated {
          max-width: 450px;
          width: 90%;
          border-radius: 16px;
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: center center;
        }
        .icon-container {
          animation: pulseRed 2s infinite;
        }
        .btn-hover-effect {
          transition: all 0.2s ease-in-out;
        }
        .btn-hover-effect:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .btn-danger.btn-hover-effect:hover {
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4) !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulseRed {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}} />
    </div>
  );
}