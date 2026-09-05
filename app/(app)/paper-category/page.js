'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function PaperCategoryPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => { fetchCategories(); }, []);
  const fetchCategories = async () => {
    setLoading(true);
    try { const res = await fetch('/api/paper-categories'); const data = await res.json(); if (data.data) setCategories(data.data); } catch(e) { toast.error('Error'); } finally { setLoading(false); }
  };
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/paper-categories', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name }) });
      if (res.ok) { toast.success('Saved'); setModalOpen(false); setName(''); fetchCategories(); }
    } catch(e) { toast.error('Error'); }
  };

  return (
    <div className="fade-in">
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm" style={{ background: 'linear-gradient(135deg, #002142, #0284c7)' }}>
        <h4 className="fw-bold mb-0 text-uppercase">Paper Categories</h4>
      </div>
      <div className="d-flex justify-content-end mb-3"><button className="btn btn-primary" onClick={() => { setName(''); setModalOpen(true); }}>+ Add Paper Category</button></div>
      <div className="table-responsive rounded shadow-sm bg-white p-3">
        <table className="data-table w-100">
          <thead><tr><th>#</th><th>Name</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan="2">Loading...</td></tr> : categories.map((c, i) => (<tr key={c.id}><td>{i+1}</td><td className="fw-bold">{c.name}</td></tr>))}</tbody>
        </table>
      </div>
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-box p-4 bg-white rounded shadow-lg" style={{ maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h5>Add Paper Category</h5>
            <form onSubmit={handleSave}>
              <div className="form-group my-3"><label>Category Name</label><input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required /></div>
              <div className="d-flex justify-content-end gap-2"><button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary btn-sm">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
