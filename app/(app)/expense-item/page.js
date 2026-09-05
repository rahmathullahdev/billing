'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ExpenseItemPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => { fetchItems(); }, []);
  const fetchItems = async () => {
    setLoading(true);
    try { const res = await fetch('/api/expense-items'); const data = await res.json(); if (data.data) setItems(data.data); } catch(e) { toast.error('Error'); } finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expense-items', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name }) });
      if (res.ok) { toast.success('Saved'); setModalOpen(false); setName(''); fetchItems(); }
    } catch(e) { toast.error('Error'); }
  };

  return (
    <div className="fade-in">
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm" style={{ background: 'linear-gradient(135deg, #002142, #ea580c)' }}>
        <h4 className="fw-bold mb-0 text-uppercase">Expense Items Types</h4>
      </div>
      <div className="d-flex justify-content-end mb-3"><button className="btn btn-primary" onClick={() => { setName(''); setModalOpen(true); }}>+ Add Expense Item Type</button></div>
      <div className="table-responsive rounded shadow-sm bg-white p-3">
        <table className="data-table w-100">
          <thead><tr><th>#</th><th>Expense Item Name</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan="2">Loading...</td></tr> : items.map((item, i) => (<tr key={item.id}><td>{i+1}</td><td className="fw-bold">{item.name}</td></tr>))}</tbody>
        </table>
      </div>
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-box p-4 bg-white rounded shadow-lg" style={{ maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h5>Add Expense Item Type</h5>
            <form onSubmit={handleSave}>
              <div className="form-group my-3"><label>Expense Type Name</label><input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required /></div>
              <div className="d-flex justify-content-end gap-2"><button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary btn-sm">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
