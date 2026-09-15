'use client';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

export default function ParticularsPage() {
  const [particulars, setParticulars] = useState([]);
  const [machineCategories, setMachineCategories] = useState([]);
  const [paperGroups, setPaperGroups] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const size = 10;
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ 
    particularId: '', particularName: '', price: '', priceBack: '', commisionRate: '', taxNumber: '', 
    machineCategoryId: '', machineCategory: '', paperGroupId: '', paperGroup: '', paperId: '', paper: '', isActive: true 
  });

  const itemId = (x) => x && (x._id || x.id);
  const displayName = (p) => p.name || p.particularName || '';

  useEffect(() => { 
    fetchParticulars(); 
    fetchMachineCategories();
    fetchPaperGroups();
    fetchPapers();
  }, []);

  const fetchParticulars = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/particulars?listAll=true');
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : (data.data?.content || []);
      setParticulars(list);
    } catch (e) { toast.error('Failed to load particulars'); setParticulars([]); }
    finally { setLoading(false); }
  };

  const fetchMachineCategories = async () => {
    try { const res = await fetch('/api/machine-categories?listAll=true'); const data = await res.json(); setMachineCategories(Array.isArray(data.data) ? data.data : []); } catch (e) {}
  };
  const fetchPaperGroups = async () => {
    try { const res = await fetch('/api/paper-groups?listAll=true'); const data = await res.json(); setPaperGroups(Array.isArray(data.data) ? data.data : []); } catch (e) {}
  };
  const fetchPapers = async () => {
    try { const res = await fetch('/api/papers?listAll=true'); const data = await res.json(); setPapers(Array.isArray(data.data) ? data.data : []); } catch (e) {}
  };

  const resetForm = () => setFormData({ 
    particularId: '', particularName: '', price: '', priceBack: '', commisionRate: '', taxNumber: '', 
    machineCategoryId: '', machineCategory: '', paperGroupId: '', paperGroup: '', paperId: '', paper: '', isActive: true 
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/particulars/${itemId(editingItem)}` : '/api/particulars';
      const method = editingItem ? 'PUT' : 'POST';
      const body = { ...formData, name: formData.particularName, particularName: formData.particularName };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        toast.success(`Particular ${editingItem ? 'updated' : 'created'} successfully`);
        setShowAddForm(false); setEditingItem(null); resetForm(); fetchParticulars();
      } else { toast.error('Failed to save particular'); }
    } catch (e) { toast.error('Error saving particular'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this particular?')) return;
    try {
      const res = await fetch(`/api/particulars/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Particular deleted'); fetchParticulars(); }
    } catch (e) { toast.error('Failed to delete particular'); }
  };

  const handleToggle = async (p) => {
    try {
      const res = await fetch(`/api/particulars/${itemId(p)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...p, name: displayName(p), isActive: !p.isActive }) });
      if (res.ok) { toast.success(p.isActive ? 'Particular deactivated' : 'Particular activated'); fetchParticulars(); }
    } catch (e) { toast.error('Error updating status'); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return particulars.filter(p =>
      (statusFilter === 'all' || String(p.isActive) === String(statusFilter === 'active')) &&
      (!q || displayName(p).toLowerCase().includes(q) || (p.particularId || '').toLowerCase().includes(q)));
  }, [particulars, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const paged = filtered.slice(page * size, page * size + size);

  return (
    <div className="fade-in p-3" style={{ backgroundColor: '#f8fafc', minHeight: '100%' }}>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm border mb-3">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded d-flex align-items-center justify-content-center text-white" style={{ width: 44, height: 44, backgroundColor: '#002142' }}>
            <i className="bi bi-list-columns-reverse fs-5"></i>
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: '#002142' }}>Manage Particulars</h4>
            <p className="mb-0 text-muted small">Add, update and oversee billing particulars</p>
          </div>
        </div>
        {!showAddForm && (
          <button className="btn text-white fw-semibold d-flex align-items-center gap-2" style={{ backgroundColor: '#002142', borderRadius: '8px' }} onClick={() => { setEditingItem(null); resetForm(); setShowAddForm(true); }}>
            <i className="bi bi-plus-lg"></i><span>Add Particular</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white rounded shadow-sm border mb-4">
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <h6 className="mb-0 fw-bold" style={{ color: '#002142' }}><i className="bi bi-list-columns-reverse me-2"></i>{editingItem ? 'Edit Particular' : 'Add New Particular'}</h6>
            <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={() => setShowAddForm(false)}>
              <i className="bi bi-x-lg"></i> Close
            </button>
          </div>
          
          <div className="p-4">
            <div className="text-center mb-4">
              <h6 className="fw-bold mb-1" style={{ color: '#002142' }}>{editingItem ? 'Edit Particular' : 'Add New Particular'}</h6>
              <p className="text-muted small mb-0">Fill in the details to {editingItem ? 'update this' : 'create a new'} particular.</p>
            </div>

            <form onSubmit={handleSave}>
              <div className="row g-4 mb-4">
                <div className="col-md-4">
                  <label className="fw-bold small text-muted d-flex justify-content-between mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}><span>PARTICULAR ID</span> <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-hash"></i></span>
                    <input type="text" className="form-control border-start-0 ps-0 shadow-none" placeholder="E.g., PRT-001" value={formData.particularId} onChange={e => setFormData({ ...formData, particularId: e.target.value })} required />
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="fw-bold small text-muted d-flex justify-content-between mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}><span>PRICE</span> <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted fw-bold">₹</span>
                    <input type="number" step="0.01" className="form-control border-start-0 ps-0 shadow-none" placeholder="0.00" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="fw-bold small text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>BACK TO BACK PRICE</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted fw-bold">₹</span>
                    <input type="number" step="0.01" className="form-control border-start-0 ps-0 shadow-none" placeholder="0.00" value={formData.priceBack} onChange={e => setFormData({ ...formData, priceBack: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-md-4">
                  <label className="fw-bold small text-muted d-flex justify-content-between mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}><span>PARTICULAR NAME</span> <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted fw-bold">T</span>
                    <input type="text" className="form-control border-start-0 ps-0 shadow-none" placeholder="Enter name" value={formData.particularName} onChange={e => setFormData({ ...formData, particularName: e.target.value })} required />
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="fw-bold small text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>COMMISSION RATE</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted fw-bold">%</span>
                    <input type="number" step="0.01" className="form-control border-start-0 ps-0 shadow-none" placeholder="0.00" value={formData.commisionRate} onChange={e => setFormData({ ...formData, commisionRate: e.target.value })} />
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="fw-bold small text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>TAX NUMBER</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-receipt"></i></span>
                    <input type="text" className="form-control border-start-0 ps-0 shadow-none" placeholder="Enter Tax No" value={formData.taxNumber} onChange={e => setFormData({ ...formData, taxNumber: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-md-4">
                  <label className="fw-bold small text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>MACHINE CATEGORY</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-diagram-3"></i></span>
                    <select className="form-select border-start-0 ps-0 shadow-none" value={formData.machineCategoryId || ''} onChange={e => { const c = machineCategories.find(c => itemId(c) === e.target.value); setFormData({ ...formData, machineCategoryId: e.target.value, machineCategory: c ? (c.name || '') : '' }); }}>
                      <option value="">Select Machine Category</option>
                      {machineCategories.map(c => <option key={itemId(c)} value={itemId(c)}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="fw-bold small text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>PAPER GROUP</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-collection"></i></span>
                    <select className="form-select border-start-0 ps-0 shadow-none" value={formData.paperGroupId || ''} onChange={e => { const g = paperGroups.find(g => itemId(g) === e.target.value); setFormData({ ...formData, paperGroupId: e.target.value, paperGroup: g ? (g.name || '') : '' }); }}>
                      <option value="">Select Paper Group</option>
                      {paperGroups.map(g => <option key={itemId(g)} value={itemId(g)}>{g.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="fw-bold small text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>PAPER</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-file-earmark"></i></span>
                    <select className="form-select border-start-0 ps-0 shadow-none" value={formData.paperId || ''} onChange={e => { const p = papers.find(p => itemId(p) === e.target.value); setFormData({ ...formData, paperId: e.target.value, paper: p ? (p.name || '') : '' }); }}>
                      <option value="">Select Paper</option>
                      {papers.map(p => <option key={itemId(p)} value={itemId(p)}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-end mt-5 pt-3 border-top">
                <div className="form-check form-switch d-flex align-items-center gap-2">
                  <input className="form-check-input mt-0 shadow-none" type="checkbox" role="switch" style={{ width: '40px', height: '20px', cursor: 'pointer', backgroundColor: formData.isActive ? '#10b981' : '' }} checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                  <label className="form-check-label fw-bold mb-0" style={{ fontSize: '0.9rem', color: '#002142' }}>Active Status</label>
                </div>
                <div className="d-flex gap-3">
                  <button type="button" className="btn btn-outline-secondary d-flex align-items-center gap-2 px-4 rounded" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn text-white d-flex align-items-center gap-2 px-4 rounded fw-semibold" style={{ backgroundColor: '#2563eb' }}>
                    <i className="bi bi-plus-circle"></i> {editingItem ? 'Update Particular' : 'Save Particular'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List Section */}
      <div className="bg-white rounded shadow-sm border p-3">
        <div className="d-flex justify-content-between align-items-center text-white p-3 rounded mb-4 shadow-sm" style={{ backgroundColor: '#002142' }}>
          <h6 className="mb-0 fw-bold text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.9rem' }}>PARTICULAR MANAGEMENT <span className="ms-2 fw-normal text-white-50 text-capitalize d-none d-md-inline" style={{ fontSize: '0.75rem', letterSpacing: '0' }}>Comprehensive oversight and administration of billing particulars</span></h6>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0 fw-bold" style={{ color: '#002142' }}>Particulars List</h6>
          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-light text-dark py-2 px-3 rounded-pill border fw-bold" style={{ fontSize: '0.75rem' }}>Total Items: {filtered.length}</span>
          </div>
        </div>

        <div className="table-responsive border rounded mb-3">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th className="text-white fw-bold py-3 text-center border-0" style={{ backgroundColor: '#002142', fontSize: '0.75rem', width: '60px' }}>ID</th>
                <th className="text-white fw-bold py-3 border-0" style={{ backgroundColor: '#002142', fontSize: '0.75rem' }}>NAME</th>
                <th className="text-white fw-bold py-3 border-0" style={{ backgroundColor: '#002142', fontSize: '0.75rem' }}>PRICE (₹)</th>
                <th className="text-white fw-bold py-3 border-0" style={{ backgroundColor: '#002142', fontSize: '0.75rem' }}>BACK TO BACK PRICE (₹)</th>
                <th className="text-white fw-bold py-3 border-0" style={{ backgroundColor: '#002142', fontSize: '0.75rem' }}>COMM. RATE (%)</th>
                <th className="text-white fw-bold py-3 border-0 text-center" style={{ backgroundColor: '#002142', fontSize: '0.75rem' }}>MACHINE CATEGORY</th>
                <th className="text-white fw-bold py-3 border-0 text-center" style={{ backgroundColor: '#002142', fontSize: '0.75rem' }}>PAPER GROUP</th>
                <th className="text-white fw-bold py-3 border-0 text-center" style={{ backgroundColor: '#002142', fontSize: '0.75rem' }}>PAPER</th>
                <th className="text-white fw-bold py-3 border-0 text-center" style={{ backgroundColor: '#002142', fontSize: '0.75rem' }}>STATUS</th>
                <th className="text-white fw-bold py-3 text-end pe-4 border-0" style={{ backgroundColor: '#002142', fontSize: '0.75rem', width: '120px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="10" className="text-center py-5 text-muted">Loading particulars...</td></tr>
                : paged.length === 0 ? <tr><td colSpan="10" className="text-center py-5 text-muted">No particulars found.</td></tr>
                  : paged.map((p, i) => (
                    <tr key={itemId(p) || i} className="table-row-hover">
                      <td className="text-center fw-bold" style={{ color: '#002142', fontSize: '0.9rem' }}>{p.particularId || (page * size + i + 1)}</td>
                      <td className="fw-bold" style={{ color: '#002142', fontSize: '0.9rem' }}>{displayName(p)}</td>
                      <td className="text-muted" style={{ fontSize: '0.9rem' }}>{Number(p.price || 0).toFixed(2)}</td>
                      <td className="text-muted" style={{ fontSize: '0.9rem' }}>{Number(p.priceBack || p.price || 0).toFixed(2)}</td>
                      <td className="text-muted" style={{ fontSize: '0.9rem' }}>{Number(p.commisionRate || 0).toFixed(2)}</td>
                      <td className="text-center">
                        <span className="badge border" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>{p.machineCategory || '-'}</span>
                      </td>
                      <td className="text-center">
                        <span className="badge border" style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}>{p.paperGroup || '-'}</span>
                      </td>
                      <td className="text-center">
                        <span className="badge border bg-light text-dark">{p.paper || '-'}</span>
                      </td>
                      <td className="text-center">
                        <span className="fw-semibold" style={{ color: p.isActive !== false ? '#10b981' : '#ef4444', fontSize: '0.85rem' }}>
                          {p.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-end pe-3">
                        <button className="btn btn-sm btn-outline-secondary me-2 p-1" style={{ width: '28px', height: '28px' }} onClick={() => { 
                          setEditingItem(p); 
                          setFormData({ 
                            particularId: p.particularId || '', particularName: displayName(p), price: p.price || '', priceBack: p.priceBack || '', commisionRate: p.commisionRate || '', taxNumber: p.taxNumber || '', 
                            machineCategoryId: p.machineCategoryId || '', machineCategory: p.machineCategory || '', paperGroupId: p.paperGroupId || '', paperGroup: p.paperGroup || '', paperId: p.paperId || '', paper: p.paper || '', isActive: p.isActive !== false 
                          }); 
                          setShowAddForm(true); 
                        }} title="Edit"><i className="bi bi-pencil-square" style={{ fontSize: '0.8rem' }}></i></button>
                        <button className="btn btn-sm btn-outline-danger p-1" style={{ width: '28px', height: '28px', color: '#ff6b6b', borderColor: '#ffe3e3', backgroundColor: '#fff5f5' }} onClick={() => handleDelete(itemId(p))} title="Delete"><i className="bi bi-trash" style={{ fontSize: '0.8rem' }}></i></button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="d-flex justify-content-between align-items-center pt-2">
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