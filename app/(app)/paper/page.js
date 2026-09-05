'use client';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

export default function ManagePaperPage() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const size = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [formData, setFormData] = useState({ name: '', paperName: '', paperCategory: '', paperCategoryId: '', paperGroup: '', paperGroupId: '', reamPrice: 0, sheetRate: 0, isActive: true });

  const itemId = (x) => x && (x._id || x.id);

  useEffect(() => { fetchPapers(); fetchCategories(); fetchGroups(); }, []);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/papers?listAll=true');
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : (data.data?.content || []);
      setPapers(list);
    } catch (e) { toast.error('Failed to load papers'); setPapers([]); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try { const res = await fetch('/api/paper-categories?listAll=true'); const data = await res.json(); setCategories(Array.isArray(data.data) ? data.data : []); } catch (e) { setCategories([]); }
  };

  const fetchGroups = async () => {
    try { const res = await fetch('/api/paper-groups?listAll=true'); const data = await res.json(); setGroups(Array.isArray(data.data) ? data.data : []); } catch (e) { setGroups([]); }
  };

  const resetForm = () => setFormData({ name: '', paperName: '', paperCategory: '', paperCategoryId: '', paperGroup: '', paperGroupId: '', reamPrice: 0, sheetRate: 0, isActive: true });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/papers/${itemId(editingItem)}` : '/api/papers';
      const method = editingItem ? 'PUT' : 'POST';
      const name = formData.name || formData.paperName;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, name }) });
      if (res.ok) {
        toast.success(`Paper ${editingItem ? 'updated' : 'created'} successfully`);
        setModalOpen(false); setEditingItem(null); resetForm(); fetchPapers();
      } else { toast.error('Failed to save paper'); }
    } catch (e) { toast.error('Error saving paper'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this paper?')) return;
    try {
      const res = await fetch(`/api/papers/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Paper deleted'); fetchPapers(); }
    } catch (e) { toast.error('Failed to delete paper'); }
  };

  const handleToggle = async (p) => {
    try {
      const res = await fetch(`/api/papers/${itemId(p)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...p, isActive: !p.isActive }) });
      if (res.ok) { toast.success(p.isActive ? 'Paper deactivated' : 'Paper activated'); fetchPapers(); }
      else { toast.error('Failed to update status'); }
    } catch (e) { toast.error('Error updating status'); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return papers.filter(p =>
      (statusFilter === 'all' || String(p.isActive) === String(statusFilter === 'active')) &&
      (!q || (p.name || '').toLowerCase().includes(q) || (p.paperName || '').toLowerCase().includes(q) || (p.paperId || '').toLowerCase().includes(q))
    );
  }, [papers, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const paged = filtered.slice(page * size, page * size + size);

  return (
    <div className="paper-page fade-in text-dark p-3">
      <div className="manage-header-card mb-3 d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: 44, height: 44, backgroundColor: '#0d9488' }}>
            <i className="bi bi-files fs-5"></i>
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: '#002142' }}>Manage Paper</h4>
            <p className="mb-0 text-muted small">Configure paper stock, categories, groups and rates</p>
          </div>
        </div>
        <button className="btn text-white fw-semibold d-flex align-items-center gap-2" style={{ backgroundColor: '#002142', borderRadius: '8px' }} onClick={() => { setEditingItem(null); resetForm(); setModalOpen(true); }}>
          <i className="bi bi-plus-lg"></i><span>Add Paper</span>
        </button>
      </div>

      <div className="branch-banner position-relative text-center text-white mb-4 rounded px-4 py-4 shadow-sm" style={{ backgroundColor: '#0d9488' }}>
        <div className="position-absolute top-0 end-0 m-3 px-3 py-1 badge bg-light text-dark shadow-sm fw-bold">Total Papers: {filtered.length}</div>
        <h3 className="fw-bold mb-2 text-uppercase tracking-wider">Paper Stock &amp; Rates</h3>
        <p className="mb-0 text-white-50 small">Manage paper stock, rates and pricing categories</p>
      </div>

      <div className="bg-white p-3 rounded shadow-sm mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="input-group" style={{ maxWidth: '350px' }}>
          <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
          <input type="text" placeholder="Search Paper Name or ID..." className="form-control border-start-0 shadow-none" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <div className="btn-group">
          {['all', 'active', 'inactive'].map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => { setStatusFilter(s); setPage(0); }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="table-responsive rounded shadow-sm bg-white border-0">
        <table className="particulars-table data-table w-100">
          <thead>
            <tr style={{ backgroundColor: '#0d9488' }}>
              <th className="text-center" style={{ width: '60px' }}>#</th>
              <th>PAPER ID</th>
              <th>PAPER NAME</th>
              <th>CATEGORY</th>
              <th>GROUP</th>
              <th>REAM PRICE</th>
              <th>SHEET RATE</th>
              <th className="text-center">STATUS</th>
              <th className="text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="9" className="text-center py-5"><div className="spinner-border text-primary me-2"></div>Loading papers...</td></tr>
              : paged.length === 0 ? <tr><td colSpan="9" className="text-center py-5 text-muted"><i className="bi bi-folder-x fs-1 d-block mb-2 text-secondary"></i>No papers found.</td></tr>
                : paged.map((p, i) => (
                  <tr key={itemId(p) || i}>
                    <td className="text-center fw-bold">{page * size + i + 1}</td>
                    <td className="fw-bold text-primary">{p.paperId || '-'}</td>
                    <td className="fw-bold" style={{ color: '#002142' }}>{p.name || p.paperName}</td>
                    <td><span className="badge bg-light text-dark border">{p.paperCategory || '-'}</span></td>
                    <td><span className="badge bg-light text-dark border">{p.paperGroup || '-'}</span></td>
                    <td className="text-success fw-bold">₹{Number(p.reamPrice || 0).toFixed(2)}</td>
                    <td className="text-success fw-bold">₹{Number(p.sheetRate || 0).toFixed(2)}</td>
                    <td className="text-center">
                      <button className={`btn btn-sm rounded-pill px-3 ${p.isActive === false ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(p)}>
                        {p.isActive === false ? 'Inactive' : 'Active'}
                      </button>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(p); setFormData({ ...p, paperName: p.paperName || p.name, isActive: p.isActive !== false }); setModalOpen(true); }}>
                        <i className="bi bi-pencil me-1"></i> Edit
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(itemId(p))}>
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
            <h5 className="fw-bold" style={{ color: '#002142' }}>{editingItem ? 'Edit Paper' : 'Add New Paper'}</h5>
            <hr />
            <form onSubmit={handleSave}>
              <div className="row g-2">
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">PAPER ID / CODE</label><input type="text" className="form-control" value={formData.paperId || ''} onChange={e => setFormData({ ...formData, paperId: e.target.value })} /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">PAPER NAME</label><input type="text" className="form-control" value={formData.name || formData.paperName || ''} onChange={e => setFormData({ ...formData, name: e.target.value, paperName: e.target.value })} required /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">CATEGORY</label>
                  <select className="form-control" value={formData.paperCategoryId || ''} onChange={e => { const c = categories.find(c => itemId(c) === e.target.value); setFormData({ ...formData, paperCategoryId: e.target.value, paperCategory: c ? (c.name || '') : '' }); }}>
                    <option value="">-- Select Category --</option>
                    {categories.map(c => <option key={itemId(c)} value={itemId(c)}>{c.name}</option>)}
                  </select>
                </div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">GROUP</label>
                  <select className="form-control" value={formData.paperGroupId || ''} onChange={e => { const g = groups.find(g => itemId(g) === e.target.value); setFormData({ ...formData, paperGroupId: e.target.value, paperGroup: g ? (g.name || '') : '' }); }}>
                    <option value="">-- Select Group --</option>
                    {groups.map(g => <option key={itemId(g)} value={itemId(g)}>{g.name}</option>)}
                  </select>
                </div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">REAM PRICE (₹)</label><input type="number" step="0.01" className="form-control" value={formData.reamPrice || 0} onChange={e => setFormData({ ...formData, reamPrice: Number(e.target.value) })} /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">SHEET RATE (₹)</label><input type="number" step="0.01" className="form-control" value={formData.sheetRate || 0} onChange={e => setFormData({ ...formData, sheetRate: Number(e.target.value) })} /></div></div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#002142', borderColor: '#002142' }}>Save Paper</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}