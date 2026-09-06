'use client';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

export default function ExpenseItemPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const size = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'Expense', category: '', addInAccount: true });

  const itemId = (x) => x && (x._id || x.id);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/expense-items?listAll=true');
      const data = await res.json();
      setItems(Array.isArray(data.data) ? data.data : (data.data?.content || []));
    } catch (e) { toast.error('Failed to load expense items'); setItems([]); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/expense-items/${itemId(editingItem)}` : '/api/expense-items';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { toast.success(`Expense type ${editingItem ? 'updated' : 'created'}`); setModalOpen(false); setEditingItem(null); setFormData({ name: '', type: 'Expense', category: '', addInAccount: true }); fetchItems(); }
      else { toast.error('Failed to save expense type'); }
    } catch (e) { toast.error('Error saving expense type'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense type?')) return;
    try {
      const res = await fetch(`/api/expense-items/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Expense type deleted'); fetchItems(); }
    } catch (e) { toast.error('Failed to delete expense type'); }
  };

  const handleToggle = async (item) => {
    try {
      const res = await fetch(`/api/expense-items/${itemId(item)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...item, isActive: !item.isActive }) });
      if (res.ok) { toast.success(item.isActive ? 'Expense type deactivated' : 'Expense type activated'); fetchItems(); }
    } catch (e) { toast.error('Error updating status'); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(item =>
      (statusFilter === 'all' || String(item.isActive) === String(statusFilter === 'active')) &&
      (!q || (item.name || '').toLowerCase().includes(q) || (item.type || '').toLowerCase().includes(q)));
  }, [items, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const paged = filtered.slice(page * size, page * size + size);

  return (
    <div className="expense-item-page fade-in text-dark p-3">
      <div className="manage-header-card mb-3 d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: 44, height: 44, backgroundColor: '#002142' }}>
            <i className="bi bi-wallet2 fs-5"></i>
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: '#002142' }}>Manage Expense Types</h4>
            <p className="mb-0 text-muted small">Configure expense categories for daily &amp; monthly accounts</p>
          </div>
        </div>
        <button className="btn text-white fw-semibold d-flex align-items-center gap-2" style={{ backgroundColor: '#002142', borderRadius: '8px' }} onClick={() => { setEditingItem(null); setFormData({ name: '', type: 'Expense', category: '', addInAccount: true }); setModalOpen(true); }}>
          <i className="bi bi-plus-lg"></i><span>Add Expense Type</span>
        </button>
      </div>

      <div className="branch-banner position-relative text-center text-white mb-4 rounded px-4 py-4 shadow-sm" style={{ backgroundColor: '#002142' }}>
        <div className="position-absolute top-0 end-0 m-3 px-3 py-1 badge bg-light text-dark shadow-sm fw-bold">Total Expense Types: {filtered.length}</div>
        <h3 className="fw-bold mb-2 text-uppercase tracking-wider">Expense Items Types</h3>
        <p className="mb-0 text-white-50 small">Standard expense categories used across operations</p>
      </div>

      <div className="bg-white p-3 rounded shadow-sm mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="input-group" style={{ maxWidth: '350px' }}>
          <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
          <input type="text" placeholder="Search expense type..." className="form-control border-start-0 shadow-none" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <div className="btn-group">
          {['all', 'active', 'inactive'].map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => { setStatusFilter(s); setPage(0); }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="table-responsive rounded shadow-sm bg-white border-0">
        <table className="particulars-table data-table w-100">
          <thead><tr style={{ backgroundColor: '#002142' }}>
            <th className="text-center" style={{ width: '60px' }}>#</th>
            <th>EXPENSE ID</th>
            <th>EXPENSE NAME</th>
            <th>TYPE</th>
            <th>CATEGORY</th>
            <th className="text-center">ADD IN ACCOUNT</th>
            <th className="text-center">STATUS</th>
            <th className="text-center">ACTIONS</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="8" className="text-center py-5">Loading...</td></tr>
              : paged.length === 0 ? <tr><td colSpan="8" className="text-center py-5 text-muted">No expense types found.</td></tr>
                : paged.map((item, i) => (
                  <tr key={itemId(item) || i}>
                    <td className="text-center fw-bold">{page * size + i + 1}</td>
                    <td className="fw-bold text-primary">{item.expenseItemId || '-'}</td>
                    <td className="fw-bold" style={{ color: '#002142' }}>{item.name}</td>
                    <td><span className="badge bg-light text-dark border">{item.type || 'Expense'}</span></td>
                    <td>{item.category || '-'}</td>
                    <td className="text-center">
                      {item.addInAccount === false ? <span className="badge bg-warning text-dark">Excluded</span> : <span className="badge bg-success">Included</span>}
                    </td>
                    <td className="text-center">
                      <button className={`btn btn-sm rounded-pill px-3 ${item.isActive === false ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(item)}>{item.isActive === false ? 'Inactive' : 'Active'}</button>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(item); setFormData({ ...item, addInAccount: item.addInAccount !== false }); setModalOpen(true); }}><i className="bi bi-pencil me-1"></i> Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(itemId(item))}><i className="bi bi-trash me-1"></i> Delete</button>
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
            <h5 className="fw-bold" style={{ color: '#002142' }}>{editingItem ? 'Edit Expense Type' : 'Add New Expense Type'}</h5>
            <hr />
            <form onSubmit={handleSave}>
              <div className="form-group my-2"><label className="fw-bold small text-muted">EXPENSE NAME</label><input type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div className="row g-2">
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">TYPE</label>
                  <select className="form-control" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                    <option value="Other">Other</option>
                  </select>
                </div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">CATEGORY</label><input type="text" className="form-control" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} /></div></div>
              </div>
              <div className="form-check my-2">
                <input type="checkbox" className="form-check-input" id="addIn" checked={formData.addInAccount} onChange={e => setFormData({ ...formData, addInAccount: e.target.checked })} />
                <label className="form-check-label small fw-bold text-muted" htmlFor="addIn">ADD IN ACCOUNT</label>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#002142', borderColor: '#002142' }}>Save Expense Type</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}