'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ManageMachinePage() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', machineCategory: '', singleSidePrice: 0, doubleSidePrice: 0, meterCount: 0 });

  useEffect(() => { fetchMachines(); }, []);
  const fetchMachines = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/machines');
      const data = await res.json();
      if (data.data) setMachines(data.data);
    } catch (e) { toast.error('Failed'); } finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/machines/${editingItem.id}` : '/api/machines';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { toast.success('Saved'); setModalOpen(false); fetchMachines(); }
    } catch (e) { toast.error('Error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete machine?')) return;
    try {
      const res = await fetch(`/api/machines/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Deleted'); fetchMachines(); }
    } catch (e) { toast.error('Failed'); }
  };

  return (
    <div className="fade-in">
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm" style={{ background: 'linear-gradient(135deg, #002142, #7c3aed)' }}>
        <h4 className="fw-bold mb-0 text-uppercase">Machines Management</h4>
        <p className="mb-0 text-white-50 small mt-1">Configure print machines and click rates</p>
      </div>

      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-primary" onClick={() => { setEditingItem(null); setFormData({ name: '', machineCategory: '', singleSidePrice: 0, doubleSidePrice: 0, meterCount: 0 }); setModalOpen(true); }}>+ Add Machine</button>
      </div>

      <div className="table-responsive rounded shadow-sm bg-white p-3">
        <table className="data-table w-100">
          <thead>
            <tr>
              <th>#</th>
              <th>Machine Name</th>
              <th>Category</th>
              <th>Single Side Rate</th>
              <th>Double Side Rate</th>
              <th>Meter Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="7" className="text-center py-4">Loading...</td></tr> : machines.map((m, i) => (
              <tr key={m.id}>
                <td>{i + 1}</td>
                <td className="fw-bold text-primary">{m.name}</td>
                <td>{m.machineCategory || 'General'}</td>
                <td className="text-success">₹{Number(m.singleSidePrice || 0).toFixed(2)}</td>
                <td className="text-success">₹{Number(m.doubleSidePrice || 0).toFixed(2)}</td>
                <td>{m.meterCount || 0}</td>
                <td>
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(m); setFormData({ name: m.name, machineCategory: m.machineCategory || '', singleSidePrice: m.singleSidePrice || 0, doubleSidePrice: m.doubleSidePrice || 0, meterCount: m.meterCount || 0 }); setModalOpen(true); }}>✏️ Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(m.id)}>🗑️ Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-box p-4 bg-white rounded shadow-lg" style={{ maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h5>{editingItem ? 'Edit Machine' : 'Add Machine'}</h5>
            <form onSubmit={handleSave}>
              <div className="form-group my-2"><label>Name</label><input type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div className="form-group my-2"><label>Category</label><input type="text" className="form-control" value={formData.machineCategory} onChange={e => setFormData({ ...formData, machineCategory: e.target.value })} /></div>
              <div className="form-group my-2"><label>Single Side Rate (₹)</label><input type="number" step="0.01" className="form-control" value={formData.singleSidePrice} onChange={e => setFormData({ ...formData, singleSidePrice: e.target.value })} /></div>
              <div className="form-group my-2"><label>Double Side Rate (₹)</label><input type="number" step="0.01" className="form-control" value={formData.doubleSidePrice} onChange={e => setFormData({ ...formData, doubleSidePrice: e.target.value })} /></div>
              <div className="form-group my-2"><label>Meter Count</label><input type="number" className="form-control" value={formData.meterCount} onChange={e => setFormData({ ...formData, meterCount: e.target.value })} /></div>
              <div className="d-flex justify-content-end gap-2 mt-3"><button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary btn-sm">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
