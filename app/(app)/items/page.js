'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ManageItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ itemId: '', name: '', category: '', basePrice: 0, description: '' });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : (data.data?.content || []);
      setItems(list);
    } catch (e) { toast.error('Failed to load items'); } finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/items/${editingItem.id}` : '/api/items';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success(`Item ${editingItem ? 'updated' : 'created'}`);
        setModalOpen(false);
        setFormData({ itemId: '', name: '', category: '', basePrice: 0, description: '' });
        fetchItems();
      }
    } catch (e) { toast.error('Error saving item'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete item?')) return;
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Item deleted'); fetchItems(); }
    } catch (e) { toast.error('Failed'); }
  };

  const filtered = items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()) || i.itemId?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fade-in">
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm">
        <h4 className="fw-bold mb-0 text-uppercase">Items Management</h4>
        <p className="mb-0 text-white-50 small mt-1">Manage catalog inventory items and standard rates</p>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <input type="text" placeholder="Search item..." className="form-control" style={{ maxWidth: '300px' }} value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn btn-primary" onClick={() => { setEditingItem(null); setFormData({ itemId: '', name: '', category: '', basePrice: 0, description: '' }); setModalOpen(true); }}>+ Add Item</button>
      </div>

      <div className="table-responsive border rounded-3 shadow-sm bg-white mb-3">
        <table className="table app-table align-middle mb-0" style={{ minWidth: '650px' }}>
          <thead>
            <tr>
              <th className="th-center" style={{ width: '60px' }}>#</th>
              <th className="th-left" style={{ width: '130px' }}>Item ID</th>
              <th className="th-left" style={{ minWidth: '220px' }}>Item Name</th>
              <th className="th-center" style={{ width: '150px' }}>Category</th>
              <th className="th-right" style={{ width: '120px' }}>Price (₹)</th>
              <th className="th-right" style={{ width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="text-center py-4"><div className="spinner-border text-primary spinner-border-sm me-2"></div>Loading...</td></tr> : filtered.map((item, i) => (
              <tr key={item.id} className="table-row-hover">
                <td className="td-center fw-bold text-muted">
                  <span className="badge bg-light text-dark border px-2 py-1 font-monospace">{i + 1}</span>
                </td>
                <td className="td-left fw-bold text-primary font-monospace">{item.itemId}</td>
                <td className="td-left fw-bold" style={{ color: '#002142' }}>{item.name}</td>
                <td className="td-center"><span className="badge-pill-cyan">{item.category || 'General'}</span></td>
                <td className="td-right fw-bold text-success">₹ {Number(item.basePrice || item.price || 0).toFixed(2)}</td>
                <td className="td-right">
                  <div className="d-inline-flex align-items-center gap-1">
                    <button className="btn btn-sm btn-outline-secondary p-1 d-inline-flex align-items-center justify-content-center shadow-none" style={{ width: '30px', height: '30px', borderRadius: '6px' }} onClick={() => { setEditingItem(item); setFormData({ itemId: item.itemId, name: item.name, category: item.category || '', basePrice: item.basePrice || item.price || 0, description: item.description || '' }); setModalOpen(true); }} title="Edit"><i className="bi bi-pencil" style={{ fontSize: '0.8rem' }}></i></button>
                    <button className="btn btn-sm btn-outline-danger p-1 d-inline-flex align-items-center justify-content-center shadow-none" style={{ width: '30px', height: '30px', borderRadius: '6px' }} onClick={() => handleDelete(item.id)} title="Delete"><i className="bi bi-trash" style={{ fontSize: '0.8rem' }}></i></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-box p-4 bg-white rounded shadow-lg" style={{ maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h5>{editingItem ? 'Edit Item' : 'Add Item'}</h5>
            <form onSubmit={handleSave}>
              <div className="form-group my-2"><label>Item Code / ID</label><input type="text" className="form-control" value={formData.itemId} onChange={e => setFormData({ ...formData, itemId: e.target.value })} required /></div>
              <div className="form-group my-2"><label>Item Name</label><input type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div className="form-group my-2"><label>Category</label><input type="text" className="form-control" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} /></div>
              <div className="form-group my-2"><label>Price (₹)</label><input type="number" step="0.01" className="form-control" value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: e.target.value })} required /></div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
