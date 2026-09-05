'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ParticularsPage() {
  const [particulars, setParticulars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ particularId: '', particularName: '', price: 0, priceBack: 0 });

  useEffect(() => { fetchParticulars(); }, []);

  const fetchParticulars = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/particulars');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.data || data?.content || []);
      setParticulars(list);
    } catch (e) {
      toast.error('Failed to load particulars');
      setParticulars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/particulars/${editingItem.id}` : '/api/particulars';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success(`Particular ${editingItem ? 'updated' : 'created'} successfully`);
        setModalOpen(false);
        setEditingItem(null);
        setFormData({ particularId: '', particularName: '', price: 0, priceBack: 0 });
        fetchParticulars();
      } else {
        toast.error('Failed to save particular');
      }
    } catch (e) { toast.error('Error saving particular'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this particular?')) return;
    try {
      const res = await fetch(`/api/particulars/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Particular deleted'); fetchParticulars(); }
    } catch (e) { toast.error('Failed to delete particular'); }
  };

  const safeParticulars = Array.isArray(particulars) ? particulars : [];
  const filtered = safeParticulars.filter(p =>
    (p.particularName && p.particularName.toLowerCase().includes(search.toLowerCase())) ||
    (p.particularId && p.particularId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="particulars-page fade-in text-dark p-3">
      {/* Header Card */}
      <div className="manage-header-card mb-3 d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: 44, height: 44, backgroundColor: '#002142' }}>
            <i className="bi bi-list-columns-reverse fs-5"></i>
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: '#002142' }}>Manage Particulars</h4>
            <p className="mb-0 text-muted small">Configure services, items, single side & back-to-back rates</p>
          </div>
        </div>

        <button className="btn text-white fw-semibold d-flex align-items-center gap-2" style={{ backgroundColor: '#002142', borderRadius: '8px' }} onClick={() => { setEditingItem(null); setFormData({ particularId: '', particularName: '', price: 0, priceBack: 0 }); setModalOpen(true); }}>
          <i className="bi bi-plus-lg"></i>
          <span>Add Particular</span>
        </button>
      </div>

      {/* Banner */}
      <div className="branch-banner position-relative text-center text-white mb-4 rounded px-4 py-4 shadow-sm" style={{ backgroundColor: '#002142' }}>
        <div className="position-absolute top-0 end-0 m-3 px-3 py-1 badge bg-light text-dark shadow-sm fw-bold">
          Total Particulars: {safeParticulars.length}
        </div>
        <h3 className="fw-bold mb-2 text-uppercase tracking-wider">Particulars / Printing Services</h3>
        <p className="mb-0 text-white-50 small">Configure standard prices and quick search codes for billing</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded shadow-sm mb-3 d-flex align-items-center justify-content-between">
        <div className="input-group" style={{ maxWidth: '350px' }}>
          <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
          <input
            type="text"
            placeholder="Search Particular ID or Name..."
            className="form-control border-start-0 shadow-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive rounded shadow-sm bg-white border-0">
        <table className="particulars-table data-table w-100">
          <thead>
            <tr style={{ backgroundColor: '#002142' }}>
              <th className="text-center" style={{ width: '60px' }}>#</th>
              <th>PARTICULAR ID</th>
              <th>PARTICULAR NAME</th>
              <th>SINGLE SIDE RATE</th>
              <th>BACK TO BACK RATE</th>
              <th className="text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-5"><div className="spinner-border text-primary me-2"></div>Loading particulars...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-5 text-muted">
                  <i className="bi bi-folder-x fs-1 d-block mb-2 text-secondary"></i>
                  No particulars found. Click "+ Add Particular" to create one.
                </td>
              </tr>
            ) : (
              filtered.map((p, i) => (
                <tr key={p.id || i}>
                  <td className="text-center fw-bold">{i + 1}</td>
                  <td className="fw-bold text-primary">{p.particularId}</td>
                  <td className="fw-bold" style={{ color: '#002142' }}>{p.particularName}</td>
                  <td className="text-success fw-bold">₹{Number(p.price || 0).toFixed(2)}</td>
                  <td className="text-success fw-bold">₹{Number(p.priceBack || p.price || 0).toFixed(2)}</td>
                  <td className="text-center">
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(p); setFormData({ particularId: p.particularId, particularName: p.particularName, price: p.price || 0, priceBack: p.priceBack || 0 }); setModalOpen(true); }}>
                      <i className="bi bi-pencil me-1"></i> Edit
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id)}>
                      <i className="bi bi-trash me-1"></i> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Custom Modal */}
      {modalOpen && (
        <div className="modal-backdrop-custom" onClick={() => setModalOpen(false)}>
          <div className="modal-box-custom" onClick={e => e.stopPropagation()}>
            <h5 className="fw-bold" style={{ color: '#002142' }}>{editingItem ? 'Edit Particular' : 'Add New Particular'}</h5>
            <hr />
            <form onSubmit={handleSave}>
              <div className="form-group my-2"><label className="fw-bold small text-muted">PARTICULAR ID / CODE</label><input type="text" className="form-control" value={formData.particularId} onChange={e => setFormData({ ...formData, particularId: e.target.value })} required /></div>
              <div className="form-group my-2"><label className="fw-bold small text-muted">PARTICULAR NAME</label><input type="text" className="form-control" value={formData.particularName} onChange={e => setFormData({ ...formData, particularName: e.target.value })} required /></div>
              <div className="form-group my-2"><label className="fw-bold small text-muted">SINGLE SIDE PRICE (₹)</label><input type="number" step="0.01" className="form-control" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} required /></div>
              <div className="form-group my-2"><label className="fw-bold small text-muted">BACK-TO-BACK PRICE (₹)</label><input type="number" step="0.01" className="form-control" value={formData.priceBack} onChange={e => setFormData({ ...formData, priceBack: Number(e.target.value) })} /></div>
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
