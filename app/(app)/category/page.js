'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ManageCategoryPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : (data.data?.content || []);
      setCategories(list);
    } catch (e) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Category name is required');

    try {
      const url = editingItem ? `/api/categories/${editingItem.id}` : '/api/categories';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      if (res.ok) {
        toast.success(`Category ${editingItem ? 'updated' : 'created'} successfully`);
        setModalOpen(false);
        setName('');
        setEditingItem(null);
        fetchCategories();
      } else {
        toast.error('Failed to save category');
      }
    } catch (e) {
      toast.error('Error saving category');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Category deleted');
        fetchCategories();
      }
    } catch (e) {
      toast.error('Failed to delete category');
    }
  };

  const filtered = categories.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fade-in">
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm">
        <h4 className="fw-bold mb-0 text-uppercase">Item Categories Management</h4>
        <p className="mb-0 text-white-50 small mt-1">Organize products into categories</p>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <input
          type="text"
          placeholder="Search category..."
          className="form-control"
          style={{ maxWidth: '300px' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => { setEditingItem(null); setName(''); setModalOpen(true); }}>
          + Add Category
        </button>
      </div>

      <div className="table-responsive border rounded-3 shadow-sm bg-white mb-3">
        <table className="table app-table align-middle mb-0" style={{ minWidth: '550px' }}>
          <thead>
            <tr>
              <th className="th-center" style={{ width: '60px' }}>#</th>
              <th className="th-left" style={{ minWidth: '300px' }}>Category Name</th>
              <th className="th-right" style={{ width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="3" className="text-center py-4"><div className="spinner-border text-primary spinner-border-sm me-2"></div>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="3" className="text-center py-4 text-muted"><i className="bi bi-inbox fs-2 d-block mb-2 text-secondary"></i>No categories found</td></tr>
            ) : (
              filtered.map((item, i) => (
                <tr key={item.id} className="table-row-hover">
                  <td className="td-center fw-bold text-muted">
                    <span className="badge bg-light text-dark border px-2 py-1 font-monospace">{i + 1}</span>
                  </td>
                  <td className="td-left fw-bold" style={{ color: '#002142' }}>{item.name}</td>
                  <td className="td-right">
                    <div className="d-inline-flex align-items-center gap-1">
                      <button className="btn btn-sm btn-outline-secondary p-1 d-inline-flex align-items-center justify-content-center shadow-none" style={{ width: '30px', height: '30px', borderRadius: '6px' }} onClick={() => { setEditingItem(item); setName(item.name); setModalOpen(true); }} title="Edit"><i className="bi bi-pencil" style={{ fontSize: '0.8rem' }}></i></button>
                      <button className="btn btn-sm btn-outline-danger p-1 d-inline-flex align-items-center justify-content-center shadow-none" style={{ width: '30px', height: '30px', borderRadius: '6px' }} onClick={() => handleDelete(item.id)} title="Delete"><i className="bi bi-trash" style={{ fontSize: '0.8rem' }}></i></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-box p-4 bg-white rounded shadow-lg" style={{ maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h5>{editingItem ? 'Edit Category' : 'Add Category'}</h5>
            <form onSubmit={handleSave}>
              <div className="form-group my-3">
                <label>Category Name</label>
                <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="d-flex justify-content-end gap-2">
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
