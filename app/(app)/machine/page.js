'use client';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

export default function ManageMachinePage() {
  const [machines, setMachines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const size = 10;
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '', machineCategory: '', categoryId: '', serialNumber: '', reading: '',
    mobile: '', email: '', tonerRequestMobile: '', tonerRequestEmail: '', branchName: '', branchId: '', isActive: true,
  });

  const itemId = (x) => x && (x._id || x.id);

  useEffect(() => { fetchMachines(); fetchCategories(); fetchBranches(); }, []);

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/machines?listAll=true');
      const data = await res.json();
      setMachines(Array.isArray(data.data) ? data.data : (data.data?.content || []));
    } catch (e) { toast.error('Failed to load machines'); setMachines([]); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try { const res = await fetch('/api/machine-categories?listAll=true'); const data = await res.json(); setCategories(Array.isArray(data.data) ? data.data : []); } catch (e) { setCategories([]); }
  };

  const fetchBranches = async () => {
    try { const res = await fetch('/api/branches'); const data = await res.json(); setBranches(Array.isArray(data.data) ? data.data : []); } catch (e) { setBranches([]); }
  };

  const resetForm = () => setFormData({ name: '', machineCategory: '', categoryId: '', serialNumber: '', reading: '', mobile: '', email: '', tonerRequestMobile: '', tonerRequestEmail: '', branchName: '', branchId: '', isActive: true });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/machines/${itemId(editingItem)}` : '/api/machines';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { toast.success(`Machine ${editingItem ? 'updated' : 'created'} successfully`); setShowAddForm(false); setEditingItem(null); resetForm(); fetchMachines(); }
      else { toast.error('Failed to save machine'); }
    } catch (e) { toast.error('Error saving machine'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this machine?')) return;
    try {
      const res = await fetch(`/api/machines/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Machine deleted'); fetchMachines(); }
    } catch (e) { toast.error('Failed to delete machine'); }
  };

  const handleToggle = async (m) => {
    try {
      const res = await fetch(`/api/machines/${itemId(m)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...m, isActive: !m.isActive }) });
      if (res.ok) { toast.success(m.isActive ? 'Machine deactivated' : 'Machine activated'); fetchMachines(); }
    } catch (e) { toast.error('Error updating status'); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return machines.filter(m =>
      (statusFilter === 'all' || String(m.isActive) === String(statusFilter === 'active')) &&
      (!q || (m.name || '').toLowerCase().includes(q) || (m.machineId || '').toLowerCase().includes(q) || (m.serialNumber || '').toLowerCase().includes(q) || (m.machineCategory || '').toLowerCase().includes(q)));
  }, [machines, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const paged = filtered.slice(page * size, page * size + size);

  return (
    <div className="machine-page fade-in text-dark p-3">
      <div className="manage-header-card mb-3 d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: 44, height: 44, backgroundColor: '#002142' }}>
            <i className="bi bi-printer fs-5"></i>
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: '#002142' }}>Manage Machines</h4>
            <p className="mb-0 text-muted small">Configure print machines, readings and contact persons</p>
          </div>
        </div>
        {!showAddForm && (
          <button className="btn text-white fw-semibold d-flex align-items-center gap-2" style={{ backgroundColor: '#002142', borderRadius: '8px' }} onClick={() => { setEditingItem(null); resetForm(); setShowAddForm(true); }}>
            <i className="bi bi-plus-lg"></i><span>Add Machine</span>
          </button>
        )}
      </div>

      <div className="branch-banner position-relative text-center text-white mb-4 rounded px-4 py-4 shadow-sm" style={{ backgroundColor: '#002142' }}>
        <div className="position-absolute top-0 end-0 m-3 px-3 py-1 badge bg-light text-dark shadow-sm fw-bold">Total Machines: {filtered.length}</div>
        <h3 className="fw-bold mb-2 text-uppercase tracking-wider">Machines Management</h3>
        <p className="mb-0 text-white-50 small">Configure print machines, readings and click rates</p>
      </div>

      <div className="bg-white p-3 rounded shadow-sm mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="input-group" style={{ maxWidth: '350px' }}>
          <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
          <input type="text" placeholder="Search machine name / serial / category..." className="form-control border-start-0 shadow-none" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
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
            <th>MACHINE ID</th>
            <th>MACHINE NAME</th>
            <th>CATEGORY</th>
            <th>SERIAL NO</th>
            <th>READING</th>
            <th>CONTACT PERSON</th>
            <th>BRANCH</th>
            <th className="text-center">STATUS</th>
            <th className="text-center">ACTIONS</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="10" className="text-center py-5"><div className="spinner-border text-primary me-2"></div>Loading machines...</td></tr>
              : paged.length === 0 ? <tr><td colSpan="10" className="text-center py-5 text-muted"><i className="bi bi-printer fs-1 d-block mb-2 text-secondary"></i>No machines found.</td></tr>
                : paged.map((m, i) => (
                  <tr key={itemId(m) || i}>
                    <td className="text-center fw-bold">{page * size + i + 1}</td>
                    <td className="fw-bold text-primary">{m.machineId || '-'}</td>
                    <td className="fw-bold" style={{ color: '#002142' }}>{m.name}</td>
                    <td><span className="badge bg-light text-dark border">{m.machineCategory || '-'}</span></td>
                    <td>{m.serialNumber || '-'}</td>
                    <td>{m.reading || '0'}</td>
                    <td>
                      {m.mobile && <div className="small"><i className="bi bi-telephone text-primary me-1"></i>{m.mobile}</div>}
                      {!m.mobile && m.name && <span className="text-muted">-</span>}
                    </td>
                    <td><span className="badge bg-light text-dark border">{m.branchName || '-'}</span></td>
                    <td className="text-center">
                      <button className={`btn btn-sm rounded-pill px-3 ${m.isActive === false ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(m)}>{m.isActive === false ? 'Inactive' : 'Active'}</button>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(m); setFormData({ ...m, isActive: m.isActive !== false }); setShowAddForm(true); }}><i className="bi bi-pencil me-1"></i> Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(itemId(m))}><i className="bi bi-trash me-1"></i> Delete</button>
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

      {showAddForm && (
        <div className="bg-white rounded shadow-sm border mb-4">
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <h6 className="mb-0 fw-bold" style={{ color: '#002142' }}><i className="bi bi-printer me-2"></i>{editingItem ? 'Edit Machine' : 'Add New Machine'}</h6>
            <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={() => setShowAddForm(false)}>
              <i className="bi bi-x-lg"></i> Close
            </button>
          </div>
          
          <div className="p-4">
            <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded border" style={{ backgroundColor: '#f8fafc' }}>
              <div className="rounded d-flex align-items-center justify-content-center text-white" style={{ width: 40, height: 40, backgroundColor: '#002142' }}>
                <i className="bi bi-gear-fill fs-5"></i>
              </div>
              <div>
                <h6 className="mb-0 fw-bold" style={{ color: '#002142' }}>{editingItem ? 'Edit Machine Configuration' : 'Create New Machine Configuration'}</h6>
                <p className="mb-0 text-muted small" style={{ fontSize: '0.8rem' }}>Enter the machine specifications, contact details, and location assignment.</p>
              </div>
            </div>

            <form onSubmit={handleSave}>
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <label className="fw-bold small text-danger mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>MACHINE NAME *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-printer"></i></span>
                    <input type="text" className="form-control border-start-0 ps-0 shadow-none" placeholder="e.g. Konica Minolta C1060" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small text-danger mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>CATEGORY *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-tags"></i></span>
                    <select className="form-select border-start-0 ps-0 shadow-none" value={formData.categoryId || ''} onChange={e => { const c = categories.find(c => itemId(c) === e.target.value); setFormData({ ...formData, categoryId: e.target.value, machineCategory: c ? (c.name || '') : '' }); }} required>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={itemId(c)} value={itemId(c)}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>SERIAL NUMBER</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-upc-scan"></i></span>
                    <input type="text" className="form-control border-start-0 ps-0 shadow-none" placeholder="Machine Serial No." value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>INITIAL READING</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-speedometer2"></i></span>
                    <input type="number" className="form-control border-start-0 ps-0 shadow-none" placeholder="0" value={formData.reading} onChange={e => setFormData({ ...formData, reading: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <label className="fw-bold small text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>CONTACT MOBILE</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-telephone"></i></span>
                    <input type="text" className="form-control border-start-0 ps-0 shadow-none" placeholder="Operator Mobile No." value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>CONTACT EMAIL</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-envelope"></i></span>
                    <input type="email" className="form-control border-start-0 ps-0 shadow-none" placeholder="Operator Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>TONER REQUEST MOBILE</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-phone-vibrate"></i></span>
                    <input type="text" className="form-control border-start-0 ps-0 shadow-none" placeholder="Toner Supplier Mobile" value={formData.tonerRequestMobile} onChange={e => setFormData({ ...formData, tonerRequestMobile: e.target.value })} />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>TONER REQUEST EMAIL</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-envelope-paper"></i></span>
                    <input type="email" className="form-control border-start-0 ps-0 shadow-none" placeholder="Toner Supplier Email" value={formData.tonerRequestEmail} onChange={e => setFormData({ ...formData, tonerRequestEmail: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="row g-4 mb-4 align-items-center">
                <div className="col-md-6">
                  <label className="fw-bold small text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>BRANCH ASSIGNMENT</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-geo-alt"></i></span>
                    <select className="form-select border-start-0 ps-0 shadow-none" value={formData.branchId || ''} onChange={e => { const b = branches.find(b => itemId(b) === e.target.value); setFormData({ ...formData, branchId: e.target.value, branchName: b ? (b.name || '') : '' }); }}>
                      <option value="">-- Unassigned --</option>
                      {branches.map(b => <option key={itemId(b)} value={itemId(b)}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small text-muted mb-2 d-block" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>STATUS</label>
                  <div className="form-check form-switch d-flex align-items-center gap-2 pt-1">
                    <input className="form-check-input mt-0 shadow-none" type="checkbox" role="switch" style={{ width: '40px', height: '20px', cursor: 'pointer' }} checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                    <label className={`form-check-label fw-bold mb-0 ${formData.isActive ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.9rem' }}>{formData.isActive ? 'Active' : 'Inactive'}</label>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
                <button type="button" className="btn btn-outline-secondary d-flex align-items-center gap-2 px-4 rounded-pill" onClick={() => setShowAddForm(false)}>
                  <i className="bi bi-x"></i> Cancel
                </button>
                <button type="submit" className="btn text-white d-flex align-items-center gap-2 px-4 rounded-pill fw-semibold" style={{ backgroundColor: '#002142' }}>
                  <i className="bi bi-check-circle"></i> {editingItem ? 'Update Machine' : 'Save Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}