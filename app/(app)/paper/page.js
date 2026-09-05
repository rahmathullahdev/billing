'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ManagePaperPage() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', paperCategory: '', paperGroup: '', price: 0 });

  useEffect(() => { fetchPapers(); }, []);
  const fetchPapers = async () => {
    setLoading(true);
    try { const res = await fetch('/api/papers'); const data = await res.json(); if (data.data) setPapers(data.data); } catch(e) { toast.error('Error'); } finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/papers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { toast.success('Saved'); setModalOpen(false); fetchPapers(); }
    } catch (e) { toast.error('Error'); }
  };

  return (
    <div className="fade-in">
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm" style={{ background: 'linear-gradient(135deg, #002142, #0d9488)' }}>
        <h4 className="fw-bold mb-0 text-uppercase">Paper Stock & Rates</h4>
      </div>
      <div className="d-flex justify-content-end mb-3"><button className="btn btn-primary" onClick={() => { setFormData({ name: '', paperCategory: '', paperGroup: '', price: 0 }); setModalOpen(true); }}>+ Add Paper</button></div>
      <div className="table-responsive rounded shadow-sm bg-white p-3">
        <table className="data-table w-100">
          <thead><tr><th>#</th><th>Paper Name</th><th>Category</th><th>Group</th><th>Rate (₹)</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan="5">Loading...</td></tr> : papers.map((p, i) => (<tr key={p.id}><td>{i+1}</td><td className="fw-bold">{p.name}</td><td>{p.paperCategory || '-'}</td><td>{p.paperGroup || '-'}</td><td className="fw-semibold text-success">₹{Number(p.price || 0).toFixed(2)}</td></tr>))}</tbody>
        </table>
      </div>
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-box p-4 bg-white rounded shadow-lg" style={{ maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h5>Add Paper</h5>
            <form onSubmit={handleSave}>
              <div className="form-group my-2"><label>Name</label><input type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div className="form-group my-2"><label>Category</label><input type="text" className="form-control" value={formData.paperCategory} onChange={e => setFormData({ ...formData, paperCategory: e.target.value })} /></div>
              <div className="form-group my-2"><label>Group</label><input type="text" className="form-control" value={formData.paperGroup} onChange={e => setFormData({ ...formData, paperGroup: e.target.value })} /></div>
              <div className="form-group my-2"><label>Price (₹)</label><input type="number" step="0.01" className="form-control" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} /></div>
              <div className="d-flex justify-content-end gap-2 mt-3"><button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary btn-sm">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
