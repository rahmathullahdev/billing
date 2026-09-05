'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ManageBranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', address: '', phone: '' });

  useEffect(() => { fetchBranches(); }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.data || data?.content || []);
      setBranches(list);
    } catch (e) {
      toast.error('Failed to load branches');
      setBranches([]);
    } finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/branches/${editingItem.id}` : '/api/branches';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success(`Branch ${editingItem ? 'updated' : 'created'}`);
        setModalOpen(false);
        setFormData({ name: '', code: '', address: '', phone: '' });
        fetchBranches();
      }
    } catch (e) { toast.error('Error saving branch'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete branch?')) return;
    try {
      const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Branch deleted'); fetchBranches(); }
    } catch (e) { toast.error('Failed'); }
  };

  const safeBranches = Array.isArray(branches) ? branches : [];

  return (
    <div className="branches-page fade-in text-dark p-3">
      {/* Manage Header Card */}
      <div className="manage-header-card mb-3 d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm border-0">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: 44, height: 44, backgroundColor: '#002142' }}>
            <i className="bi bi-building fs-5"></i>
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: '#002142' }}>Manage Branches</h4>
            <p className="mb-0 text-muted small">Add, update and oversee organizational branches</p>
          </div>
        </div>

        <button className="btn text-white fw-semibold d-flex align-items-center gap-2" style={{ backgroundColor: '#002142', borderRadius: '8px' }} onClick={() => { setEditingItem(null); setFormData({ name: '', code: '', address: '', phone: '' }); setModalOpen(true); }}>
          <i className="bi bi-plus-lg"></i>
          <span>Add Branch</span>
        </button>
      </div>

      {/* Branch Banner */}
      <div className="branch-banner position-relative text-center text-white mb-4 rounded px-4 py-4 shadow-sm" style={{ backgroundColor: '#002142' }}>
        <div className="position-absolute top-0 end-0 m-3 px-3 py-1 badge bg-light text-dark shadow-sm fw-bold">
          Total Branches: {safeBranches.length}
        </div>
        <h3 className="fw-bold mb-2 text-uppercase tracking-wider">Branch Management</h3>
        <p className="mb-0 text-white-50 small">Comprehensive oversight and administration of all organizational branches</p>
      </div>

      {/* Branch Table */}
      <div className="table-responsive rounded shadow-sm bg-white border-0">
        <table className="particulars-table data-table w-100">
          <thead>
            <tr style={{ backgroundColor: '#002142' }}>
              <th className="text-center" style={{ width: '60px' }}>#</th>
              <th>BRANCH NAME</th>
              <th>BRANCH CODE</th>
              <th>ADDRESS</th>
              <th>PHONE</th>
              <th className="text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr>
            ) : safeBranches.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-4 text-muted">No branches found. Click "+ Add Branch" to create one.</td></tr>
            ) : (
              safeBranches.map((b, i) => (
                <tr key={b.id || i}>
                  <td className="text-center fw-bold">{i + 1}</td>
                  <td className="fw-bold" style={{ color: '#002142' }}>{b.name}</td>
                  <td><span className="badge bg-light text-dark border">{b.code || '-'}</span></td>
                  <td>{b.address || '-'}</td>
                  <td>{b.phone || '-'}</td>
                  <td className="text-center">
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(b); setFormData({ name: b.name, code: b.code || '', address: b.address || '', phone: b.phone || '' }); setModalOpen(true); }}>
                      <i className="bi bi-pencil me-1"></i> Edit
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(b.id)}>
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
            <h5 className="fw-bold" style={{ color: '#002142' }}>{editingItem ? 'Edit Branch' : 'Add New Branch'}</h5>
            <hr />
            <form onSubmit={handleSave}>
              <div className="form-group my-2"><label className="fw-bold small text-muted">BRANCH NAME</label><input type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div className="form-group my-2"><label className="fw-bold small text-muted">BRANCH CODE</label><input type="text" className="form-control" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} /></div>
              <div className="form-group my-2"><label className="fw-bold small text-muted">ADDRESS</label><input type="text" className="form-control" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
              <div className="form-group my-2"><label className="fw-bold small text-muted">PHONE</label><input type="text" className="form-control" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#002142', borderColor: '#002142' }}>Save Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
