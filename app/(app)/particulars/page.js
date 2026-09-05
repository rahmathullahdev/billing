'use client';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

export default function ParticularsPage() {
  const [particulars, setParticulars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const size = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ particularId: '', particularName: '', price: 0, priceBack: 0, commisionRate: 0, taxNumber: '', isActive: true });

  const itemId = (x) => x && (x._id || x.id);
  const displayName = (p) => p.name || p.particularName || '';

  useEffect(() => { fetchParticulars(); }, []);

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

  const resetForm = () => setFormData({ particularId: '', particularName: '', price: 0, priceBack: 0, commisionRate: 0, taxNumber: '', isActive: true });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/particulars/${itemId(editingItem)}` : '/api/particulars';
      const method = editingItem ? 'PUT' : 'POST';
      const body = { ...formData, name: formData.particularName, particularName: formData.particularName };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        toast.success(`Particular ${editingItem ? 'updated' : 'created'} successfully`);
        setModalOpen(false); setEditingItem(null); resetForm(); fetchParticulars();
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
    <div className="particulars-page fade-in text-dark p-3">
      <div className="manage-header-card mb-3 d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: 44, height: 44, backgroundColor: '#002142' }}>
            <i className="bi bi-list-columns-reverse fs-5"></i>
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: '#002142' }}>Manage Particulars</h4>
            <p className="mb-0 text-muted small">Configure services, items, single side &amp; back-to-back rates</p>
          </div>
        </div>
        <button className="btn text-white fw-semibold d-flex align-items-center gap-2" style={{ backgroundColor: '#002142', borderRadius: '8px' }} onClick={() => { setEditingItem(null); resetForm(); setModalOpen(true); }}>
          <i className="bi bi-plus-lg"></i><span>Add Particular</span>
        </button>
      </div>

      <div className="branch-banner position-relative text-center text-white mb-4 rounded px-4 py-4 shadow-sm" style={{ backgroundColor: '#002142' }}>
        <div className="position-absolute top-0 end-0 m-3 px-3 py-1 badge bg-light text-dark shadow-sm fw-bold">Total Particulars: {filtered.length}</div>
        <h3 className="fw-bold mb-2 text-uppercase tracking-wider">Particulars / Printing Services</h3>
        <p className="mb-0 text-white-50 small">Configure standard prices and quick search codes for billing</p>
      </div>

      <div className="bg-white p-3 rounded shadow-sm mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="input-group" style={{ maxWidth: '350px' }}>
          <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
          <input type="text" placeholder="Search Particular ID or Name..." className="form-control border-start-0 shadow-none" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
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
            <tr style={{ backgroundColor: '#002142' }}>
              <th className="text-center" style={{ width: '60px' }}>#</th>
              <th>PARTICULAR ID</th>
              <th>PARTICULAR NAME</th>
              <th>SINGLE SIDE RATE</th>
              <th>BACK TO BACK</th>
              <th>COMMISSION %</th>
              <th className="text-center">STATUS</th>
              <th className="text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="8" className="text-center py-5"><div className="spinner-border text-primary me-2"></div>Loading particulars...</td></tr>
              : paged.length === 0 ? <tr><td colSpan="8" className="text-center py-5 text-muted"><i className="bi bi-folder-x fs-1 d-block mb-2 text-secondary"></i>No particulars found.</td></tr>
                : paged.map((p, i) => (
                  <tr key={itemId(p) || i}>
                    <td className="text-center fw-bold">{page * size + i + 1}</td>
                    <td className="fw-bold text-primary">{p.particularId}</td>
                    <td className="fw-bold" style={{ color: '#002142' }}>{displayName(p)}</td>
                    <td className="text-success fw-bold">₹{Number(p.price || 0).toFixed(2)}</td>
                    <td className="text-success fw-bold">₹{Number(p.priceBack || p.price || 0).toFixed(2)}</td>
                    <td>{Number(p.commisionRate || 0)}%</td>
                    <td className="text-center">
                      <button className={`btn btn-sm rounded-pill px-3 ${p.isActive === false ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(p)}>{p.isActive === false ? 'Inactive' : 'Active'}</button>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(p); setFormData({ particularId: p.particularId || '', particularName: displayName(p), price: p.price || 0, priceBack: p.priceBack || 0, commisionRate: p.commisionRate || 0, taxNumber: p.taxNumber || '', isActive: p.isActive !== false }); setModalOpen(true); }}>
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
            <h5 className="fw-bold" style={{ color: '#002142' }}>{editingItem ? 'Edit Particular' : 'Add New Particular'}</h5>
            <hr />
            <form onSubmit={handleSave}>
              <div className="row g-2">
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">PARTICULAR ID / CODE</label><input type="text" className="form-control" value={formData.particularId} onChange={e => setFormData({ ...formData, particularId: e.target.value })} required /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">PARTICULAR NAME</label><input type="text" className="form-control" value={formData.particularName} onChange={e => setFormData({ ...formData, particularName: e.target.value })} required /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">SINGLE SIDE PRICE (₹)</label><input type="number" step="0.01" className="form-control" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} required /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">BACK-TO-BACK PRICE (₹)</label><input type="number" step="0.01" className="form-control" value={formData.priceBack} onChange={e => setFormData({ ...formData, priceBack: Number(e.target.value) })} /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">COMMISSION RATE (%)</label><input type="number" step="0.01" className="form-control" value={formData.commisionRate} onChange={e => setFormData({ ...formData, commisionRate: Number(e.target.value) })} /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">TAX NUMBER</label><input type="text" className="form-control" value={formData.taxNumber} onChange={e => setFormData({ ...formData, taxNumber: e.target.value })} /></div></div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#002142', borderColor: '#002142' }}>Save Particular</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}