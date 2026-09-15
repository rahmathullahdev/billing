'use client';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

export default function ManagePaperPage() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [formData, setFormData] = useState({ name: '', paperCategory: '', paperCategoryId: '', paperGroup: '', paperGroupId: '', readingCount: 0, isActive: true });

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

  const resetForm = () => setFormData({ name: '', paperCategory: '', paperCategoryId: '', paperGroup: '', paperGroupId: '', readingCount: 0, isActive: true });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/papers/${itemId(editingItem)}` : '/api/papers';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) {
        toast.success(`Paper ${editingItem ? 'updated' : 'created'} successfully`);
        setShowAddForm(false); setEditingItem(null); resetForm(); fetchPapers();
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return papers.filter(p => !q || (p.name || '').toLowerCase().includes(q) || (p.paperCategory || '').toLowerCase().includes(q) || (p.paperGroup || '').toLowerCase().includes(q));
  }, [papers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const paged = filtered.slice(page * size, page * size + size);

  return (
    <div className="fade-in p-3" style={{ backgroundColor: '#f8fafc', minHeight: '100%' }}>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm border mb-3">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded d-flex align-items-center justify-content-center text-white" style={{ width: 44, height: 44, backgroundColor: '#002142' }}>
            <i className="bi bi-file-earmark-text-fill fs-5"></i>
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: '#002142' }}>Paper Management</h4>
            <p className="mb-0 text-muted small">Comprehensive oversight and administration of paper stock</p>
          </div>
        </div>
        {!showAddForm && (
          <button className="btn text-white fw-semibold d-flex align-items-center gap-2" style={{ backgroundColor: '#002142', borderRadius: '8px' }} onClick={() => { setEditingItem(null); resetForm(); setShowAddForm(true); }}>
            <i className="bi bi-plus-lg"></i><span>Add Paper</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white rounded shadow-sm border mb-4">
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <h6 className="mb-0 fw-bold" style={{ color: '#002142' }}><i className="bi bi-file-earmark-plus me-2"></i>{editingItem ? 'Edit Paper' : 'Add New Paper'}</h6>
            <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={() => setShowAddForm(false)}>
              <i className="bi bi-x-lg"></i> Close
            </button>
          </div>
          
          <div className="p-4">
            <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded border" style={{ backgroundColor: '#f8fafc' }}>
              <div className="rounded d-flex align-items-center justify-content-center text-white" style={{ width: 40, height: 40, backgroundColor: '#002142' }}>
                <i className="bi bi-file-earmark-text-fill fs-5"></i>
              </div>
              <div>
                <h6 className="mb-0 fw-bold" style={{ color: '#002142' }}>{editingItem ? 'Edit Paper Stock' : 'Create New Paper Stock'}</h6>
                <p className="mb-0 text-muted small" style={{ fontSize: '0.8rem' }}>Configure paper specifications and group assignments</p>
              </div>
            </div>

            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label className="fw-bold small text-danger mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>PAPER NAME *</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-file-earmark"></i></span>
                  <input type="text" className="form-control border-start-0 ps-0 shadow-none" placeholder="e.g. A4 80gsm Bond Paper" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <label className="fw-bold small text-danger mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>PAPER CATEGORY *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-layers"></i></span>
                    <select className="form-select border-start-0 ps-0 shadow-none" value={formData.paperCategoryId || ''} onChange={e => { const c = categories.find(c => itemId(c) === e.target.value); setFormData({ ...formData, paperCategoryId: e.target.value, paperCategory: c ? (c.name || '') : '' }); }} required>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={itemId(c)} value={itemId(c)}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold small text-danger mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>PAPER GROUP *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-briefcase"></i></span>
                    <select className="form-select border-start-0 ps-0 shadow-none" value={formData.paperGroupId || ''} onChange={e => { const g = groups.find(g => itemId(g) === e.target.value); setFormData({ ...formData, paperGroupId: e.target.value, paperGroup: g ? (g.name || '') : '' }); }} required>
                      <option value="">Select Group</option>
                      {groups.map(g => <option key={itemId(g)} value={itemId(g)}>{g.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="row g-4 mb-4 align-items-center">
                <div className="col-md-6">
                  <label className="fw-bold small text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>READING COUNT</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-speedometer2"></i></span>
                    <input type="number" className="form-control border-start-0 ps-0 shadow-none" value={formData.readingCount || 0} onChange={e => setFormData({ ...formData, readingCount: Number(e.target.value) })} />
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
                  <i className="bi bi-check-circle"></i> {editingItem ? 'Update Paper' : 'Save Paper'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List Section */}
      <div className="bg-white rounded shadow-sm border p-3">
        <div className="d-flex justify-content-between align-items-center text-white p-3 rounded mb-4 shadow-sm" style={{ backgroundColor: '#002142' }}>
          <h6 className="mb-0 fw-bold text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.9rem' }}>PAPER INVENTORY MANAGEMENT <span className="ms-2 fw-normal text-white-50 text-capitalize" style={{ fontSize: '0.75rem', letterSpacing: '0' }}>Comprehensive oversight and administration of all paper stock</span></h6>
          <span className="badge bg-white text-dark py-2 px-3 rounded-pill fw-bold" style={{ fontSize: '0.75rem' }}>TOTAL PAPERS: {filtered.length}</span>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0 fw-bold" style={{ color: '#002142' }}>Paper Stock Directory</h6>
          <div className="input-group" style={{ maxWidth: '300px' }}>
            <span className="input-group-text bg-white border-end-0 text-muted rounded-start-pill ps-3"><i className="bi bi-search"></i></span>
            <input type="text" placeholder="Search paper name, category, group..." className="form-control border-start-0 shadow-none rounded-end-pill py-2" style={{ fontSize: '0.85rem' }} value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle border">
            <thead>
              <tr>
                <th className="text-white fw-bold py-3 text-center border-0" style={{ backgroundColor: '#002142', fontSize: '0.75rem', width: '50px' }}>#</th>
                <th className="text-white fw-bold py-3 border-0" style={{ backgroundColor: '#002142', fontSize: '0.75rem' }}>PAPER NAME</th>
                <th className="text-white fw-bold py-3 border-0 text-center" style={{ backgroundColor: '#002142', fontSize: '0.75rem' }}>CATEGORY</th>
                <th className="text-white fw-bold py-3 border-0 text-center" style={{ backgroundColor: '#002142', fontSize: '0.75rem' }}>GROUP</th>
                <th className="text-white fw-bold py-3 border-0 text-center" style={{ backgroundColor: '#002142', fontSize: '0.75rem' }}>READING COUNT</th>
                <th className="text-white fw-bold py-3 border-0 text-center" style={{ backgroundColor: '#002142', fontSize: '0.75rem' }}>STATUS</th>
                <th className="text-white fw-bold py-3 text-end pe-4 border-0" style={{ backgroundColor: '#002142', fontSize: '0.75rem', width: '120px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="7" className="text-center py-5 text-muted">Loading papers...</td></tr>
                : paged.length === 0 ? <tr><td colSpan="7" className="text-center py-5 text-muted">No papers found.</td></tr>
                  : paged.map((p, i) => (
                    <tr key={itemId(p) || i} className="table-row-hover">
                      <td className="text-center text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>{page * size + i + 1}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded d-flex align-items-center justify-content-center text-white shadow-sm" style={{ width: 32, height: 32, backgroundColor: '#002142' }}>
                            <i className="bi bi-file-earmark-text-fill" style={{ fontSize: '0.8rem' }}></i>
                          </div>
                          <span className="fw-bold" style={{ color: '#002142', fontSize: '0.9rem' }}>{p.name}</span>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="badge rounded-pill fw-semibold" style={{ backgroundColor: '#f0f5ff', color: '#3b82f6', border: '1px solid #bfdbfe', fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>
                          <i className="bi bi-layers me-1"></i>{p.paperCategory || '-'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge rounded-pill fw-semibold" style={{ backgroundColor: '#f0fdf4', color: '#22c55e', border: '1px solid #bbf7d0', fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>
                          <i className="bi bi-briefcase me-1"></i>{p.paperGroup || '-'}
                        </span>
                      </td>
                      <td className="text-center text-muted" style={{ fontSize: '0.85rem' }}>
                        <i className="bi bi-speedometer2 me-1"></i>{p.readingCount || 0}
                      </td>
                      <td className="text-center">
                        <span style={{ fontSize: '0.8rem', color: p.isActive === false ? '#ef4444' : '#22c55e' }} className="fw-semibold">
                          <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem' }}></i>{p.isActive === false ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                      <td className="text-end pe-3">
                        <button className="btn btn-sm btn-outline-secondary me-2 p-1" style={{ width: '28px', height: '28px' }} onClick={() => { setEditingItem(p); setFormData({ ...p, name: p.name || p.paperName, isActive: p.isActive !== false }); setShowAddForm(true); }} title="Edit"><i className="bi bi-pencil-square" style={{ fontSize: '0.8rem' }}></i></button>
                        <button className="btn btn-sm btn-outline-danger p-1" style={{ width: '28px', height: '28px', color: '#ff6b6b', borderColor: '#ffe3e3', backgroundColor: '#fff5f5' }} onClick={() => handleDelete(itemId(p))} title="Delete"><i className="bi bi-trash" style={{ fontSize: '0.8rem' }}></i></button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
          <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.85rem' }}>
            <span>Rows per page:</span>
            <select className="form-select form-select-sm shadow-none" style={{ width: '70px', fontSize: '0.85rem' }} disabled>
              <option>10</option>
            </select>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <button className="btn btn-sm text-muted fw-semibold d-flex align-items-center gap-1 border-0" disabled={page === 0} onClick={() => setPage(page - 1)} style={{ fontSize: '0.8rem' }}><i className="bi bi-chevron-left"></i> PREVIOUS</button>
            <span className="rounded d-flex align-items-center justify-content-center text-white fw-bold shadow-sm" style={{ width: '28px', height: '28px', backgroundColor: '#002142', fontSize: '0.85rem' }}>{page + 1}</span>
            <button className="btn btn-sm text-muted fw-semibold d-flex align-items-center gap-1 border-0" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} style={{ fontSize: '0.8rem' }}>NEXT <i className="bi bi-chevron-right"></i></button>
          </div>
        </div>
      </div>
    </div>
  );
}