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
  const [modalOpen, setModalOpen] = useState(false);
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
      if (res.ok) { toast.success(`Machine ${editingItem ? 'updated' : 'created'} successfully`); setModalOpen(false); setEditingItem(null); resetForm(); fetchMachines(); }
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
          <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: 44, height: 44, backgroundColor: '#7c3aed' }}>
            <i className="bi bi-printer fs-5"></i>
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: '#002142' }}>Manage Machines</h4>
            <p className="mb-0 text-muted small">Configure print machines, readings and contact persons</p>
          </div>
        </div>
        <button className="btn text-white fw-semibold d-flex align-items-center gap-2" style={{ backgroundColor: '#002142', borderRadius: '8px' }} onClick={() => { setEditingItem(null); resetForm(); setModalOpen(true); }}>
          <i className="bi bi-plus-lg"></i><span>Add Machine</span>
        </button>
      </div>

      <div className="branch-banner position-relative text-center text-white mb-4 rounded px-4 py-4 shadow-sm" style={{ backgroundColor: '#7c3aed' }}>
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
          <thead><tr style={{ backgroundColor: '#7c3aed' }}>
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
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(m); setFormData({ ...m, isActive: m.isActive !== false }); setModalOpen(true); }}><i className="bi bi-pencil me-1"></i> Edit</button>
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

      {modalOpen && (
        <div className="modal-backdrop-custom" onClick={() => setModalOpen(false)}>
          <div className="modal-box-custom" onClick={e => e.stopPropagation()}>
            <h5 className="fw-bold" style={{ color: '#002142' }}>{editingItem ? 'Edit Machine' : 'Add New Machine'}</h5>
            <hr />
            <form onSubmit={handleSave}>
              <div className="row g-2">
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">MACHINE NAME</label><input type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">CATEGORY</label>
                  <select className="form-control" value={formData.categoryId || ''} onChange={e => { const c = categories.find(c => itemId(c) === e.target.value); setFormData({ ...formData, categoryId: e.target.value, machineCategory: c ? (c.name || '') : '' }); }}>
                    <option value="">-- Select Category --</option>
                    {categories.map(c => <option key={itemId(c)} value={itemId(c)}>{c.name}</option>)}
                  </select>
                </div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">SERIAL NUMBER</label><input type="text" className="form-control" value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">READING</label><input type="text" className="form-control" value={formData.reading} onChange={e => setFormData({ ...formData, reading: e.target.value })} /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">CONTACT MOBILE</label><input type="text" className="form-control" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">CONTACT EMAIL</label><input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">TONER REQUEST MOBILE</label><input type="text" className="form-control" value={formData.tonerRequestMobile} onChange={e => setFormData({ ...formData, tonerRequestMobile: e.target.value })} /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">TONER REQUEST EMAIL</label><input type="email" className="form-control" value={formData.tonerRequestEmail} onChange={e => setFormData({ ...formData, tonerRequestEmail: e.target.value })} /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">BRANCH</label>
                  <select className="form-control" value={formData.branchId || ''} onChange={e => { const b = branches.find(b => itemId(b) === e.target.value); setFormData({ ...formData, branchId: e.target.value, branchName: b ? (b.name || '') : '' }); }}>
                    <option value="">-- Select Branch --</option>
                    {branches.map(b => <option key={itemId(b)} value={itemId(b)}>{b.name}</option>)}
                  </select>
                </div></div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#002142', borderColor: '#002142' }}>Save Machine</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}