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
      if (data.data) setItems(data.data);
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
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm" style={{ background: 'linear-gradient(135deg, #002142, #10b981)' }}>
        <h4 className="fw-bold mb-0 text-uppercase">Items Management</h4>
        <p className="mb-0 text-white-50 small mt-1">Manage catalog inventory items and standard rates</p>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <input type="text" placeholder="Search item..." className="form-control" style={{ maxWidth: '300px' }} value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn btn-primary" onClick={() => { setEditingItem(null); setFormData({ itemId: '', name: '', category: '', basePrice: 0, description: '' }); setModalOpen(true); }}>+ Add Item</button>
      </div>

      <div className="table-responsive rounded shadow-sm bg-white p-3">
        <table className="data-table w-100">
          <thead>
            <tr>
              <th>#</th>
              <th>Item ID</th>
              <th>Item Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr> : filtered.map((item, i) => (
              <tr key={item.id}>
                <td>{i + 1}</td>
                <td className="fw-bold text-primary">{item.itemId}</td>
                <td>{item.name}</td>
                <td><span className="badge bg-light text-dark border">{item.category || 'General'}</span></td>
                <td className="fw-semibold text-success">₹{Number(item.basePrice || item.price || 0).toFixed(2)}</td>
                <td>
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(item); setFormData({ itemId: item.itemId, name: item.name, category: item.category || '', basePrice: item.basePrice || item.price || 0, description: item.description || '' }); setModalOpen(true); }}>✏️ Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id)}>🗑️ Delete</button>
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
