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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);
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
    } catch (e) { 
      toast.error('Failed to load particulars'); 
      setParticulars([]); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchMachineCategories = async () => {
    try { 
      const res = await fetch('/api/machine-categories?listAll=true'); 
      const data = await res.json(); 
      setMachineCategories(Array.isArray(data.data) ? data.data : []); 
    } catch (e) {}
  };

  const fetchPaperGroups = async () => {
    try { 
      const res = await fetch('/api/paper-groups?listAll=true'); 
      const data = await res.json(); 
      setPaperGroups(Array.isArray(data.data) ? data.data : []); 
    } catch (e) {}
  };

  const fetchPapers = async () => {
    try { 
      const res = await fetch('/api/papers?listAll=true'); 
      const data = await res.json(); 
      setPapers(Array.isArray(data.data) ? data.data : []); 
    } catch (e) {}
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
        setShowAddForm(false); 
        setEditingItem(null); 
        resetForm(); 
        fetchParticulars();
      } else { 
        toast.error('Failed to save particular'); 
      }
    } catch (e) { 
      toast.error('Error saving particular'); 
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this particular?')) return;
    try {
      const res = await fetch(`/api/particulars/${id}`, { method: 'DELETE' });
      if (res.ok) { 
        toast.success('Particular deleted'); 
        fetchParticulars(); 
      }
    } catch (e) { 
      toast.error('Failed to delete particular'); 
    }
  };

  const handleToggle = async (p) => {
    try {
      const res = await fetch(`/api/particulars/${itemId(p)}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ...p, name: displayName(p), isActive: !p.isActive }) 
      });
      if (res.ok) { 
        toast.success(p.isActive ? 'Particular deactivated' : 'Particular activated'); 
        fetchParticulars(); 
      }
    } catch (e) { 
      toast.error('Error updating status'); 
    }
  };

  const activeCount = useMemo(() => particulars.filter(p => p.isActive !== false).length, [particulars]);
  const inactiveCount = useMemo(() => particulars.filter(p => p.isActive === false).length, [particulars]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return particulars.filter(p => {
      // Status filter
      if (statusFilter === 'active' && p.isActive === false) return false;
      if (statusFilter === 'inactive' && p.isActive !== false) return false;

      // Category filter
      if (categoryFilter !== 'all' && (p.machineCategory || '') !== categoryFilter) return false;

      // Search query
      if (q) {
        const nameMatch = displayName(p).toLowerCase().includes(q);
        const idMatch = (p.particularId || '').toLowerCase().includes(q);
        const catMatch = (p.machineCategory || '').toLowerCase().includes(q);
        const paperMatch = (p.paper || '').toLowerCase().includes(q);
        const groupMatch = (p.paperGroup || '').toLowerCase().includes(q);
        return nameMatch || idMatch || catMatch || paperMatch || groupMatch;
      }
      return true;
    });
  }, [particulars, search, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const paged = filtered.slice(page * size, page * size + size);

  // Available categories for dropdown filter
  const uniqueCategories = useMemo(() => {
    const set = new Set();
    particulars.forEach(p => { if (p.machineCategory) set.add(p.machineCategory); });
    return Array.from(set).sort();
  }, [particulars]);

  return (
    <div className="fade-in p-2 p-md-3" style={{ backgroundColor: '#f8fafc', minHeight: '100%' }}>
      {/* Top Banner Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center bg-white p-3 p-md-4 rounded-3 shadow-sm border mb-3 gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-sm" style={{ width: 46, height: 46, backgroundColor: '#002142' }}>
            <i className="bi bi-list-columns-reverse fs-5"></i>
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: '#002142' }}>Manage Particulars</h4>
            <p className="mb-0 text-muted small">Configure rates, machines, papers and billing particulars</p>
          </div>
        </div>
        {!showAddForm && (
          <button 
            className="btn text-white fw-semibold d-flex align-items-center gap-2 px-3 py-2 shadow-sm" 
            style={{ backgroundColor: '#002142', borderRadius: '8px' }} 
            onClick={() => { setEditingItem(null); resetForm(); setShowAddForm(true); }}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Add Particular</span>
          </button>
        )}
      </div>

      {/* Add / Edit Form Modal / Card */}
      {showAddForm && (
        <div className="bg-white rounded-3 shadow-sm border mb-4">
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom" style={{ backgroundColor: '#f8fafc' }}>
            <h6 className="mb-0 fw-bold" style={{ color: '#002142' }}>
              <i className="bi bi-pencil-square me-2"></i>
              {editingItem ? 'Edit Particular' : 'Create New Particular'}
            </h6>
            <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3" onClick={() => setShowAddForm(false)}>
              <i className="bi bi-x-lg"></i> Close
            </button>
          </div>
          
          <div className="p-3 p-md-4">
            <form onSubmit={handleSave}>
              <div className="row g-3 g-md-4 mb-3">
                <div className="col-12 col-md-4">
                  <label className="fw-bold small text-muted d-flex justify-content-between mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                    <span>PARTICULAR ID</span> <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-hash"></i></span>
                    <input type="text" className="form-control border-start-0 ps-0 shadow-none" placeholder="e.g. 301" value={formData.particularId} onChange={e => setFormData({ ...formData, particularId: e.target.value })} required />
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <label className="fw-bold small text-muted d-flex justify-content-between mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                    <span>FRONT PRICE (₹)</span> <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted fw-bold">₹</span>
                    <input type="number" step="0.01" className="form-control border-start-0 ps-0 shadow-none" placeholder="0.00" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <label className="fw-bold small text-muted mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                    BACK TO BACK PRICE (₹)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted fw-bold">₹</span>
                    <input type="number" step="0.01" className="form-control border-start-0 ps-0 shadow-none" placeholder="0.00" value={formData.priceBack} onChange={e => setFormData({ ...formData, priceBack: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="row g-3 g-md-4 mb-3">
                <div className="col-12 col-md-4">
                  <label className="fw-bold small text-muted d-flex justify-content-between mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                    <span>PARTICULAR NAME</span> <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted fw-bold">T</span>
                    <input type="text" className="form-control border-start-0 ps-0 shadow-none" placeholder="Enter name" value={formData.particularName} onChange={e => setFormData({ ...formData, particularName: e.target.value })} required />
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <label className="fw-bold small text-muted mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>COMMISSION RATE (%)</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted fw-bold">%</span>
                    <input type="number" step="0.01" className="form-control border-start-0 ps-0 shadow-none" placeholder="0.00" value={formData.commisionRate} onChange={e => setFormData({ ...formData, commisionRate: e.target.value })} />
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <label className="fw-bold small text-muted mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>TAX NUMBER / HSN</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-receipt"></i></span>
                    <input type="text" className="form-control border-start-0 ps-0 shadow-none" placeholder="HSN code" value={formData.taxNumber} onChange={e => setFormData({ ...formData, taxNumber: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="row g-3 g-md-4 mb-4">
                <div className="col-12 col-md-4">
                  <label className="fw-bold small text-muted mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>MACHINE CATEGORY</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-diagram-3"></i></span>
                    <select className="form-select border-start-0 ps-0 shadow-none" value={formData.machineCategoryId || ''} onChange={e => { const c = machineCategories.find(c => itemId(c) === e.target.value); setFormData({ ...formData, machineCategoryId: e.target.value, machineCategory: c ? (c.name || '') : '' }); }}>
                      <option value="">Select Machine Category</option>
                      {machineCategories.map(c => <option key={itemId(c)} value={itemId(c)}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <label className="fw-bold small text-muted mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>PAPER GROUP</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-collection"></i></span>
                    <select className="form-select border-start-0 ps-0 shadow-none" value={formData.paperGroupId || ''} onChange={e => { const g = paperGroups.find(g => itemId(g) === e.target.value); setFormData({ ...formData, paperGroupId: e.target.value, paperGroup: g ? (g.name || '') : '' }); }}>
                      <option value="">Select Paper Group</option>
                      {paperGroups.map(g => <option key={itemId(g)} value={itemId(g)}>{g.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <label className="fw-bold small text-muted mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>PAPER</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-file-earmark"></i></span>
                    <select className="form-select border-start-0 ps-0 shadow-none" value={formData.paperId || ''} onChange={e => { const p = papers.find(p => itemId(p) === e.target.value); setFormData({ ...formData, paperId: e.target.value, paper: p ? (p.name || '') : '' }); }}>
                      <option value="">Select Paper</option>
                      {papers.map(p => <option key={itemId(p)} value={itemId(p)}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="d-flex flex-wrap justify-content-between align-items-center pt-3 border-top gap-3">
                <div className="form-check form-switch d-flex align-items-center gap-2">
                  <input className="form-check-input mt-0 shadow-none" type="checkbox" role="switch" style={{ width: '40px', height: '20px', cursor: 'pointer', backgroundColor: formData.isActive ? '#10b981' : '' }} checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                  <label className="form-check-label fw-bold mb-0" style={{ fontSize: '0.9rem', color: '#002142' }}>Active Status</label>
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary px-4 rounded-pill" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn text-white px-4 rounded-pill fw-semibold shadow-sm" style={{ backgroundColor: '#002142' }}>
                    <i className="bi bi-check2-circle me-1"></i> {editingItem ? 'Update Particular' : 'Save Particular'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-3 shadow-sm border p-3 p-md-4">
        {/* Navy Header Banner */}
        <div className="d-flex flex-wrap justify-content-between align-items-center text-white p-3 rounded-3 mb-4 shadow-sm gap-2" style={{ backgroundColor: '#002142' }}>
          <div>
            <h6 className="mb-0 fw-bold text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.9rem' }}>
              PARTICULAR MANAGEMENT
              <span className="ms-2 fw-normal text-white-50 text-capitalize d-none d-md-inline" style={{ fontSize: '0.78rem', letterSpacing: '0' }}>
                Comprehensive oversight and administration of billing particulars
              </span>
            </h6>
          </div>
          <span className="badge bg-white text-dark py-2 px-3 rounded-pill fw-bold" style={{ fontSize: '0.75rem' }}>
            TOTAL ITEMS: {particulars.length}
          </span>
        </div>

        {/* Toolbar: Search, Filters & Counters */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 pb-3 border-bottom gap-3">
          {/* Status Tabs */}
          <div className="d-flex align-items-center gap-1 bg-light p-1 rounded-pill border">
            <button 
              type="button" 
              className={`btn btn-sm rounded-pill px-3 fw-semibold border-0 ${statusFilter === 'all' ? 'bg-white shadow-sm' : 'text-muted'}`}
              style={{ color: statusFilter === 'all' ? '#002142' : undefined, fontSize: '0.8rem' }}
              onClick={() => { setStatusFilter('all'); setPage(0); }}
            >
              All ({particulars.length})
            </button>
            <button 
              type="button" 
              className={`btn btn-sm rounded-pill px-3 fw-semibold border-0 ${statusFilter === 'active' ? 'bg-white shadow-sm' : 'text-muted'}`}
              style={{ color: statusFilter === 'active' ? '#059669' : undefined, fontSize: '0.8rem' }}
              onClick={() => { setStatusFilter('active'); setPage(0); }}
            >
              Active ({activeCount})
            </button>
            <button 
              type="button" 
              className={`btn btn-sm rounded-pill px-3 fw-semibold border-0 ${statusFilter === 'inactive' ? 'bg-white shadow-sm' : 'text-muted'}`}
              style={{ color: statusFilter === 'inactive' ? '#dc2626' : undefined, fontSize: '0.8rem' }}
              onClick={() => { setStatusFilter('inactive'); setPage(0); }}
            >
              Inactive ({inactiveCount})
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Category Filter */}
            <select 
              className="form-select form-select-sm shadow-none rounded-pill" 
              style={{ maxWidth: '200px', fontSize: '0.82rem', height: '36px' }}
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setPage(0); }}
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Search Input */}
            <div className="input-group" style={{ maxWidth: '300px' }}>
              <span className="input-group-text bg-white border-end-0 text-muted rounded-start-pill ps-3">
                <i className="bi bi-search"></i>
              </span>
              <input 
                type="text" 
                placeholder="Search name, ID, paper..." 
                className="form-control border-start-0 border-end-0 shadow-none py-1" 
                style={{ fontSize: '0.84rem', height: '36px' }} 
                value={search} 
                onChange={e => { setSearch(e.target.value); setPage(0); }} 
              />
              {search && (
                <button 
                  className="btn btn-outline-secondary border-start-0 bg-white text-muted" 
                  type="button" 
                  onClick={() => { setSearch(''); setPage(0); }}
                  title="Clear search"
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
              <span className="input-group-text bg-white border-start-0 rounded-end-pill pe-3"></span>
            </div>
          </div>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="table-responsive border rounded-3 shadow-sm bg-white mb-3">
          <table className="table app-table align-middle mb-0" style={{ minWidth: '1240px' }}>
            <thead>
              <tr>
                <th className="th-center" style={{ width: '70px' }}>ID</th>
                <th className="th-left" style={{ minWidth: '240px' }}>PARTICULAR NAME</th>
                <th className="th-right" style={{ width: '110px' }}>PRICE (₹)</th>
                <th className="th-right" style={{ width: '140px' }}>BACK TO BACK (₹)</th>
                <th className="th-right" style={{ width: '120px' }}>COMM. RATE (%)</th>
                <th className="th-center" style={{ minWidth: '180px' }}>MACHINE CATEGORY</th>
                <th className="th-center" style={{ minWidth: '190px' }}>PAPER GROUP</th>
                <th className="th-center" style={{ minWidth: '180px' }}>PAPER</th>
                <th className="th-center" style={{ width: '110px' }}>STATUS</th>
                <th className="th-right" style={{ width: '100px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-5">
                    <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                    <span className="text-muted fw-semibold">Loading particulars...</span>
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-2 d-block mb-2 text-secondary"></i>
                    No particulars match your filter criteria.
                  </td>
                </tr>
              ) : (
                paged.map((p, i) => (
                  <tr key={itemId(p) || i} className="table-row-hover">
                    {/* ID */}
                    <td className="td-center fw-bold" style={{ color: '#002142', fontSize: '0.88rem' }}>
                      <span className="badge bg-light text-dark border px-2 py-1 font-monospace">
                        {p.particularId || (page * size + i + 1)}
                      </span>
                    </td>

                    {/* NAME */}
                    <td className="td-left">
                      <div className="fw-bold" style={{ color: '#002142', fontSize: '0.9rem', lineHeight: '1.35' }}>
                        {displayName(p)}
                      </div>
                      {p.taxNumber && (
                        <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                          HSN: {p.taxNumber}
                        </div>
                      )}
                    </td>

                    {/* FRONT PRICE */}
                    <td className="td-right fw-semibold" style={{ color: '#0f172a', fontSize: '0.9rem' }}>
                      ₹ {Number(p.price || 0).toFixed(2)}
                    </td>

                    {/* BACK PRICE */}
                    <td className="td-right text-muted" style={{ fontSize: '0.9rem' }}>
                      ₹ {Number(p.priceBack || p.price || 0).toFixed(2)}
                    </td>

                    {/* COMM RATE */}
                    <td className="td-right text-muted" style={{ fontSize: '0.88rem' }}>
                      {Number(p.commisionRate || 0).toFixed(2)} %
                    </td>

                    {/* MACHINE CATEGORY */}
                    <td className="td-center">
                      {p.machineCategory ? (
                        <span className="badge-pill-cyan">
                          {p.machineCategory}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>

                    {/* PAPER GROUP */}
                    <td className="td-center">
                      {p.paperGroup ? (
                        <span className="badge-pill-purple">
                          {p.paperGroup}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>

                    {/* PAPER */}
                    <td className="td-center">
                      {p.paper ? (
                        <span className="badge-pill-slate">
                          {p.paper}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="td-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(p)}
                        className={`btn btn-sm border-0 p-0 ${p.isActive !== false ? 'badge-pill-success' : 'badge-pill-danger'}`}
                        style={{ cursor: 'pointer' }}
                        title="Click to toggle status"
                      >
                        <i className={`bi bi-${p.isActive !== false ? 'check-circle-fill' : 'x-circle-fill'}`} style={{ fontSize: '0.65rem' }}></i>
                        <span>{p.isActive !== false ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    {/* ACTIONS */}
                    <td className="td-right">
                      <div className="d-inline-flex align-items-center gap-1">
                        <button 
                          className="btn btn-sm btn-outline-secondary p-1 d-inline-flex align-items-center justify-content-center shadow-none" 
                          style={{ width: '30px', height: '30px', borderRadius: '6px' }} 
                          onClick={() => { 
                            setEditingItem(p); 
                            setFormData({ 
                              particularId: p.particularId || '', 
                              particularName: displayName(p), 
                              price: p.price ?? '', 
                              priceBack: p.priceBack ?? '', 
                              commisionRate: p.commisionRate ?? '', 
                              taxNumber: p.taxNumber || '', 
                              machineCategoryId: p.machineCategoryId || '', 
                              machineCategory: p.machineCategory || '', 
                              paperGroupId: p.paperGroupId || '', 
                              paperGroup: p.paperGroup || '', 
                              paperId: p.paperId || '', 
                              paper: p.paper || '', 
                              isActive: p.isActive !== false 
                            }); 
                            setShowAddForm(true); 
                          }} 
                          title="Edit Particular"
                        >
                          <i className="bi bi-pencil" style={{ fontSize: '0.8rem' }}></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger p-1 d-inline-flex align-items-center justify-content-center shadow-none" 
                          style={{ width: '30px', height: '30px', borderRadius: '6px' }} 
                          onClick={() => handleDelete(itemId(p))} 
                          title="Delete Particular"
                        >
                          <i className="bi bi-trash" style={{ fontSize: '0.8rem' }}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Responsive Pagination Footer */}
        <div className="d-flex flex-wrap justify-content-between align-items-center pt-3 gap-3">
          <div className="d-flex align-items-center gap-3 text-muted small">
            <span>
              Showing <strong className="text-dark">{filtered.length === 0 ? 0 : page * size + 1}</strong> to <strong className="text-dark">{Math.min((page + 1) * size, filtered.length)}</strong> of <strong className="text-dark">{filtered.length}</strong> items
            </span>
            <div className="d-flex align-items-center gap-1">
              <span>Rows:</span>
              <select 
                className="form-select form-select-sm shadow-none py-1" 
                style={{ width: '75px', fontSize: '0.82rem' }} 
                value={size} 
                onChange={e => { setSize(Number(e.target.value)); setPage(0); }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="d-flex gap-1 align-items-center">
            <button 
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3" 
              disabled={page === 0} 
              onClick={() => setPage(page - 1)} 
              style={{ fontSize: '0.8rem' }}
            >
              <i className="bi bi-chevron-left"></i> Previous
            </button>
            <span 
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm mx-1" 
              style={{ width: '30px', height: '30px', backgroundColor: '#002142', fontSize: '0.82rem' }}
            >
              {page + 1}
            </span>
            <span className="text-muted small px-1">of {totalPages}</span>
            <button 
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3" 
              disabled={page >= totalPages - 1} 
              onClick={() => setPage(page + 1)} 
              style={{ fontSize: '0.8rem' }}
            >
              Next <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
