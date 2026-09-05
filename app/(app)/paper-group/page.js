'use client';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

export default function PaperGroupPage() {
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const size = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', paperCategory: '', paperCategoryId: '' });

  const itemId = (x) => x && (x._id || x.id);

  useEffect(() => { fetchGroups(); fetchCategories(); }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/paper-groups?listAll=true');
      const data = await res.json();
      setGroups(Array.isArray(data.data) ? data.data : (data.data?.content || []));
    } catch (e) { toast.error('Failed to load groups'); setGroups([]); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try { const res = await fetch('/api/paper-categories?listAll=true'); const data = await res.json(); setCategories(Array.isArray(data.data) ? data.data : []); } catch (e) { setCategories([]); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/paper-groups/${itemId(editingItem)}` : '/api/paper-groups';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { toast.success(`Paper group ${editingItem ? 'updated' : 'created'}`); setModalOpen(false); setEditingItem(null); setFormData({ name: '', paperCategory: '', paperCategoryId: '' }); fetchGroups(); }
      else { toast.error('Failed to save group'); }
    } catch (e) { toast.error('Error saving group'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this paper group?')) return;
    try {
      const res = await fetch(`/api/paper-groups/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Group deleted'); fetchGroups(); }
    } catch (e) { toast.error('Failed to delete group'); }
  };

  const handleToggle = async (g) => {
    try {
      const res = await fetch(`/api/paper-groups/${itemId(g)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...g, isActive: !g.isActive }) });
      if (res.ok) { toast.success(g.isActive ? 'Group deactivated' : 'Group activated'); fetchGroups(); }
    } catch (e) { toast.error('Error updating status'); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return groups.filter(g =>
      (statusFilter === 'all' || String(g.isActive) === String(statusFilter === 'active')) &&
      (!q || (g.name || '').toLowerCase().includes(q)));
  }, [groups, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const paged = filtered.slice(page * size, page * size + size);

  return (
    <div className="paper-group-page fade-in text-dark p-3">
      <div className="manage-header-card mb-3 d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: 44, height: 44, backgroundColor: '#0369a1' }}>
            <i className="bi bi-collection fs-5"></i>
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: '#002142' }}>Manage Paper Groups</h4>
            <p className="mb-0 text-muted small">Group paper stock under category families</p>
          </div>
        </div>
        <button className="btn text-white fw-semibold d-flex align-items-center gap-2" style={{ backgroundColor: '#002142', borderRadius: '8px' }} onClick={() => { setEditingItem(null); setFormData({ name: '', paperCategory: '', paperCategoryId: '' }); setModalOpen(true); }}>
          <i className="bi bi-plus-lg"></i><span>Add Group</span>
        </button>
      </div>

      <div className="branch-banner position-relative text-center text-white mb-4 rounded px-4 py-4 shadow-sm" style={{ backgroundColor: '#0369a1' }}>
        <div className="position-absolute top-0 end-0 m-3 px-3 py-1 badge bg-light text-dark shadow-sm fw-bold">Total Groups: {filtered.length}</div>
        <h3 className="fw-bold mb-2 text-uppercase tracking-wider">Paper Groups</h3>
        <p className="mb-0 text-white-50 small">Group paper stocks under their product family</p>
      </div>

      <div className="bg-white p-3 rounded shadow-sm mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="input-group" style={{ maxWidth: '350px' }}>
          <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
          <input type="text" placeholder="Search group..." className="form-control border-start-0 shadow-none" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <div className="btn-group">
          {['all', 'active', 'inactive'].map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => { setStatusFilter(s); setPage(0); }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="table-responsive rounded shadow-sm bg-white border-0">
        <table className="particulars-table data-table w-100">
          <thead><tr style={{ backgroundColor: '#0369a1' }}>
            <th className="text-center" style={{ width: '60px' }}>#</th>
            <th>GROUP ID</th>
            <th>GROUP NAME</th>
            <th>CATEGORY</th>
            <th className="text-center">STATUS</th>
            <th className="text-center">ACTIONS</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="text-center py-5">Loading...</td></tr>
              : paged.length === 0 ? <tr><td colSpan="6" className="text-center py-5 text-muted">No groups found.</td></tr>
                : paged.map((g, i) => (
                  <tr key={itemId(g) || i}>
                    <td className="text-center fw-bold">{page * size + i + 1}</td>
                    <td className="fw-bold text-primary">{g.groupId || '-'}</td>
                    <td className="fw-bold" style={{ color: '#002142' }}>{g.name}</td>
                    <td><span className="badge bg-light text-dark border">{g.paperCategory || '-'}</span></td>
                    <td className="text-center">
                      <button className={`btn btn-sm rounded-pill px-3 ${g.isActive === false ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(g)}>{g.isActive === false ? 'Inactive' : 'Active'}</button>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(g); setFormData({ name: g.name, paperCategory: g.paperCategory || '', paperCategoryId: g.paperCategoryId || '' }); setModalOpen(true); }}><i className="bi bi-pencil me-1"></i> Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(itemId(g))}><i className="bi bi-trash me-1"></i> Delete</button>
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
            <h5 className="fw-bold" style={{ color: '#002142' }}>{editingItem ? 'Edit Group' : 'Add New Group'}</h5>
            <hr />
            <form onSubmit={handleSave}>
              <div className="form-group my-2"><label className="fw-bold small text-muted">GROUP NAME</label><input type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div className="form-group my-2"><label className="fw-bold small text-muted">CATEGORY</label>
                <select className="form-control" value={formData.paperCategoryId || ''} onChange={e => { const c = categories.find(c => itemId(c) === e.target.value); setFormData({ ...formData, paperCategoryId: e.target.value, paperCategory: c ? (c.name || '') : '' }); }}>
                  <option value="">-- Select Category --</option>
                  {categories.map(c => <option key={itemId(c)} value={itemId(c)}>{c.name}</option>)}
                </select>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#002142', borderColor: '#002142' }}>Save Group</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}