'use client';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

export default function ManageBranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const size = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({ branchId: '', name: '', code: '', address: '', phone: '', email: '' });

  const itemId = (x) => x && (x._id || x.id);

  useEffect(() => { fetchBranches(); }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : (data?.data?.content || []);
      setBranches(list);
    } catch (e) { toast.error('Failed to load branches'); setBranches([]); }
    finally { setLoading(false); }
  };

  const resetForm = () => setFormData({ branchId: '', name: '', code: '', address: '', phone: '', email: '' });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/branches/${itemId(editingItem)}` : '/api/branches';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, branchId: formData.branchId || formData.code, code: formData.branchId || formData.code }) });
      if (res.ok) {
        toast.success(`Branch ${editingItem ? 'updated' : 'created'}`);
        setModalOpen(false); setEditingItem(null); resetForm(); fetchBranches();
      } else { toast.error('Failed to save branch'); }
    } catch (e) { toast.error('Error saving branch'); }
  };

  const handleDelete = (id) => {
    setConfirmDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/branches/${confirmDelete}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Branch deleted'); fetchBranches(); }
    } catch (e) { toast.error('Failed to delete branch'); }
    setConfirmDelete(null);
  };

  const handleToggle = async (b) => {
    try {
      const res = await fetch(`/api/branches/${itemId(b)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...b, isActive: !b.isActive }) });
      if (res.ok) { toast.success(b.isActive ? 'Branch deactivated' : 'Branch activated'); fetchBranches(); }
    } catch (e) { toast.error('Error updating status'); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return branches.filter(b =>
      (statusFilter === 'all' || String(b.isActive) === String(statusFilter === 'active')) &&
      (!q || (b.name || '').toLowerCase().includes(q) || (b.branchId || '').toLowerCase().includes(q) || (b.address || '').toLowerCase().includes(q)));
  }, [branches, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const paged = filtered.slice(page * size, page * size + size);

  return (
    <div className="branches-page fade-in text-dark p-3">
      <div className="manage-header-card mb-3 d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: 44, height: 44, backgroundColor: '#002142' }}>
            <i className="bi bi-building fs-5"></i>
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: '#002142' }}>Manage Branches</h4>
            <p className="mb-0 text-muted small">Add, update and oversee organizational branches</p>
          </div>
        </div>
        <button className="btn text-white fw-semibold d-flex align-items-center gap-2" style={{ backgroundColor: '#002142', borderRadius: '8px' }} onClick={() => { setEditingItem(null); resetForm(); setModalOpen(true); }}>
          <i className="bi bi-plus-lg"></i><span>Add Branch</span>
        </button>
      </div>

      <div className="branch-banner position-relative text-center text-white mb-4 rounded px-4 py-4 shadow-sm" style={{ backgroundColor: '#002142' }}>
        <div className="position-absolute top-0 end-0 m-3 px-3 py-1 badge bg-light text-dark shadow-sm fw-bold">Total Branches: {filtered.length}</div>
        <h3 className="fw-bold mb-2 text-uppercase tracking-wider">Branch Management</h3>
        <p className="mb-0 text-white-50 small">Comprehensive oversight and administration of all organizational branches</p>
      </div>

      <div className="bg-white p-3 rounded shadow-sm mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="input-group" style={{ maxWidth: '350px' }}>
          <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
          <input type="text" placeholder="Search branch name, code or address..." className="form-control border-start-0 shadow-none" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
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
            <th>BRANCH CODE</th>
            <th>BRANCH NAME</th>
            <th>ADDRESS</th>
            <th>PHONE</th>
            <th>EMAIL</th>
            <th className="text-center">STATUS</th>
            <th className="text-center">ACTIONS</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="8" className="text-center py-5">Loading...</td></tr>
              : paged.length === 0 ? <tr><td colSpan="8" className="text-center py-5 text-muted">No branches found.</td></tr>
                : paged.map((b, i) => (
                  <tr key={itemId(b) || i}>
                    <td className="text-center fw-bold">{page * size + i + 1}</td>
                    <td><span className="badge bg-light text-dark border">{b.branchId || '-'}</span></td>
                    <td className="fw-bold" style={{ color: '#002142' }}>{b.name}</td>
                    <td>{b.address || '-'}</td>
                    <td>{b.phone || '-'}</td>
                    <td>{b.email || '-'}</td>
                    <td className="text-center">
                      <button className={`btn btn-sm rounded-pill px-3 ${b.isActive === false ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(b)}>{b.isActive === false ? 'Inactive' : 'Active'}</button>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(b); setFormData({ branchId: b.branchId || '', name: b.name || '', code: b.branchId || '', address: b.address || '', phone: b.phone || '', email: b.email || '' }); setModalOpen(true); }}>
                        <i className="bi bi-pencil me-1"></i> Edit
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(itemId(b))}>
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
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center p-3" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded shadow-sm w-100 position-relative" style={{ maxWidth: '900px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center p-4">
              <h4 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#1e293b' }}>
                <i className="bi bi-building-add fs-4"></i> {editingItem ? 'Edit Branch' : 'Add New Branch'}
              </h4>
              <button className="btn btn-secondary btn-sm d-flex align-items-center gap-1 text-white shadow-sm" style={{ backgroundColor: '#64748b', border: 'none' }} onClick={() => setModalOpen(false)}>
                <i className="bi bi-x"></i> Close
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 pt-2">
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <input type="text" className="form-control p-3 shadow-none" style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }} placeholder="Branch Name *" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="col-md-6">
                  <input type="text" className="form-control p-3 shadow-none" style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }} placeholder="Branch Code *" value={formData.branchId} onChange={e => setFormData({ ...formData, branchId: e.target.value })} required />
                </div>
                <div className="col-md-6">
                  <input type="text" className="form-control p-3 shadow-none" style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }} placeholder="Phone Number *" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                </div>
                <div className="col-md-6">
                  <input type="email" className="form-control p-3 shadow-none" style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }} placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="col-12">
                  <textarea className="form-control p-3 shadow-none" rows="4" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', resize: 'none' }} placeholder="Address *" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required></textarea>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-3 border-top pt-4">
                <button type="button" className="btn btn-light px-4 fw-semibold shadow-sm text-dark" style={{ border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }} onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary px-4 fw-semibold shadow-sm d-flex align-items-center gap-2" style={{ backgroundColor: '#1d4ed8', border: 'none' }}>
                  <i className="bi bi-check-circle"></i> {editingItem ? 'Update Branch' : 'Save Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center p-3" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }} onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded shadow-sm text-center p-4 position-relative" style={{ maxWidth: '400px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '3.5rem', color: '#ef4444', marginBottom: '1rem', lineHeight: '1' }}>
              <i className="bi bi-exclamation-circle"></i>
            </div>
            <h4 className="fw-bold mb-2 text-dark">Delete Branch?</h4>
            <p className="text-muted mb-4 pb-2">Are you sure you want to delete this branch? This action cannot be undone.</p>
            <div className="d-flex justify-content-center gap-3">
              <button className="btn btn-light px-4 fw-semibold shadow-sm text-dark" style={{ border: '1px solid #e2e8f0' }} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger px-4 fw-semibold shadow-sm" onClick={handleConfirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}