'use client';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

export default function PaperGroupPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState('name_asc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const itemId = (x) => x && (x._id || x.id);

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/paper-groups?listAll=true');
      const data = await res.json();
      setGroups(Array.isArray(data.data) ? data.data : (data.data?.content || []));
    } catch (e) { toast.error('Failed to load groups'); setGroups([]); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/paper-groups/${itemId(editingItem)}` : '/api/paper-groups';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { 
        toast.success(`Paper group ${editingItem ? 'updated' : 'created'} successfully`); 
        setShowAddForm(false); 
        setEditingItem(null); 
        setFormData({ name: '', description: '' }); 
        fetchGroups(); 
      }
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = groups.filter(g => !q || (g.name || '').toLowerCase().includes(q));
    
    result.sort((a, b) => {
      const nameA = String(a.name || '').trim().toLowerCase();
      const nameB = String(b.name || '').trim().toLowerCase();
      
      if (sortBy === 'name_asc') return nameA < nameB ? -1 : (nameA > nameB ? 1 : 0);
      if (sortBy === 'name_desc') return nameA > nameB ? -1 : (nameA < nameB ? 1 : 0);
      
      const timeA = new Date(a.createdAt || a._createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || b._createdAt || 0).getTime();
      if (sortBy === 'newest') return timeB - timeA;
      if (sortBy === 'oldest') return timeA - timeB;
      
      return 0;
    });
    
    return result;
  }, [groups, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const paged = filtered.slice(page * size, page * size + size);

  return (
    <div className="fade-in p-3" style={{ backgroundColor: '#f8fafc', minHeight: '100%' }}>
      {/* Page Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center bg-white p-3 rounded shadow-sm border mb-3 gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded d-flex align-items-center justify-content-center text-white" style={{ width: 44, height: 44, backgroundColor: '#002142' }}>
            <i className="bi bi-briefcase-fill fs-5"></i>
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: '#002142' }}>Paper Groups</h4>
            <p className="mb-0 text-muted small">Manage and organize all paper groups</p>
          </div>
        </div>
        {!showAddForm && (
          <button className="btn text-white fw-semibold d-flex align-items-center gap-2" style={{ backgroundColor: '#002142', borderRadius: '8px' }} onClick={() => { setEditingItem(null); setFormData({ name: '', description: '' }); setShowAddForm(true); }}>
            <i className="bi bi-plus-lg"></i><span>Add Group</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white rounded shadow-sm border mb-4">
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <h6 className="mb-0 fw-bold" style={{ color: '#002142' }}><i className="bi bi-inboxes me-2"></i>{editingItem ? 'Edit Group' : 'Add New Group'}</h6>
            <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={() => setShowAddForm(false)}>
              <i className="bi bi-x-lg"></i> Close
            </button>
          </div>
          
          <div className="p-4">
            <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded border" style={{ backgroundColor: '#f8fafc' }}>
              <div className="rounded d-flex align-items-center justify-content-center text-white" style={{ width: 40, height: 40, backgroundColor: '#002142' }}>
                <i className="bi bi-briefcase-fill fs-5"></i>
              </div>
              <div>
                <h6 className="mb-0 fw-bold" style={{ color: '#002142' }}>{editingItem ? 'Edit Paper Group' : 'Create New Paper Group'}</h6>
                <p className="mb-0 text-muted small" style={{ fontSize: '0.8rem' }}>Fill in the group details below</p>
              </div>
            </div>

            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label className="fw-bold small text-danger mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>GROUP NAME *</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-inbox"></i></span>
                  <input type="text" className="form-control border-start-0 ps-0 shadow-none" placeholder="e.g. A4 Group, Standard Offset" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
              </div>

              <div className="mb-4">
                <label className="fw-bold small text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>DESCRIPTION</label>
                <div className="input-group" style={{ alignItems: 'flex-start' }}>
                  <span className="input-group-text bg-white border-end-0 text-muted pt-2"><i className="bi bi-card-text"></i></span>
                  <textarea className="form-control border-start-0 ps-0 shadow-none" rows="3" placeholder="Optional description for this paper group" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
                <button type="button" className="btn btn-outline-secondary d-flex align-items-center gap-2 px-4 rounded-pill" onClick={() => setShowAddForm(false)}>
                  <i className="bi bi-x"></i> Cancel
                </button>
                <button type="submit" className="btn text-white d-flex align-items-center gap-2 px-4 rounded-pill fw-semibold" style={{ backgroundColor: '#002142' }}>
                  <i className="bi bi-check-circle"></i> {editingItem ? 'Update Group' : 'Save Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List Section */}
      <div className="bg-white rounded shadow-sm border p-3">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center text-white p-3 rounded mb-4 shadow-sm gap-2" style={{ backgroundColor: '#002142' }}>
          <h6 className="mb-0 fw-bold text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.9rem' }}>PAPER GROUP MANAGEMENT <span className="ms-2 fw-normal text-white-50 text-capitalize" style={{ fontSize: '0.75rem', letterSpacing: '0' }}>Manage and organize all paper groups</span></h6>
          <span className="badge bg-white text-dark py-2 px-3 rounded-pill fw-bold" style={{ fontSize: '0.75rem' }}>TOTAL GROUPS: {filtered.length}</span>
        </div>

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
          <h6 className="mb-0 fw-bold" style={{ color: '#002142' }}>Paper Group Directory</h6>
          <div className="d-flex flex-column flex-sm-row gap-2 w-100 justify-content-md-end">
            <select className="form-select form-select-sm shadow-none rounded-pill flex-shrink-0" style={{ width: 'auto', minWidth: '160px', fontSize: '0.85rem' }} value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(0); }}>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <div className="input-group" style={{ maxWidth: '300px', flex: '1 1 auto' }}>
              <span className="input-group-text bg-white border-end-0 text-muted rounded-start-pill ps-3"><i className="bi bi-search"></i></span>
              <input type="text" placeholder="Search group name..." className="form-control border-start-0 shadow-none rounded-end-pill py-2" style={{ fontSize: '0.85rem' }} value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle border">
            <thead>
              <tr>
                <th className="text-white fw-bold py-3 text-center border-0" style={{ backgroundColor: '#002142', fontSize: '0.75rem', width: '50px' }}>#</th>
                <th className="text-white fw-bold py-3 text-center border-0" style={{ backgroundColor: '#002142', fontSize: '0.75rem' }}>GROUP NAME</th>
                <th className="text-white fw-bold py-3 text-end pe-4 border-0" style={{ backgroundColor: '#002142', fontSize: '0.75rem', width: '120px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="3" className="text-center py-5 text-muted">Loading groups...</td></tr>
                : paged.length === 0 ? <tr><td colSpan="3" className="text-center py-5 text-muted">No groups found.</td></tr>
                  : paged.map((g, i) => (
                    <tr key={itemId(g) || i} className="table-row-hover">
                      <td className="text-center text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>{page * size + i + 1}</td>
                      <td className="text-center">
                        <span className="fw-bold" style={{ color: '#002142', fontSize: '0.9rem' }}>{g.name}</span>
                      </td>
                      <td className="text-end pe-3">
                        <button className="btn btn-sm btn-outline-secondary me-2 p-1" style={{ width: '28px', height: '28px' }} onClick={() => { setEditingItem(g); setFormData({ name: g.name, description: g.description || '' }); setShowAddForm(true); }} title="Edit"><i className="bi bi-pencil-square" style={{ fontSize: '0.8rem' }}></i></button>
                        <button className="btn btn-sm btn-outline-danger p-1" style={{ width: '28px', height: '28px', color: '#ff6b6b', borderColor: '#ffe3e3', backgroundColor: '#fff5f5' }} onClick={() => handleDelete(itemId(g))} title="Delete"><i className="bi bi-trash" style={{ fontSize: '0.8rem' }}></i></button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-3 pt-3 border-top gap-3">
          <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.85rem' }}>
            <span>Rows per page:</span>
            <select className="form-select form-select-sm shadow-none" style={{ width: '70px', fontSize: '0.85rem' }} value={size} onChange={e => { setSize(Number(e.target.value)); setPage(0); }}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
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