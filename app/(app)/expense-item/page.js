'use client';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

export default function ExpenseItemPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('All Expense Types');
  const [page, setPage] = useState(0);
  const size = 10;
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'Daily',
    addInAccount: false
  });

  const itemId = (x) => x && (x._id || x.id);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/expense-items?listAll=true');
      const data = await res.json();
      setItems(Array.isArray(data.data) ? data.data : (data.data?.content || []));
    } catch (e) { 
      toast.error('Failed to load expense items'); 
      setItems([]); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter expense item name");
      return;
    }
    try {
      const url = editingItem ? `/api/expense-items/${itemId(editingItem)}` : '/api/expense-items';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(formData) 
      });
      
      if (res.ok) { 
        toast.success(`Expense item ${editingItem ? 'updated' : 'created'}`); 
        resetForm();
        fetchItems(); 
      } else { 
        toast.error('Failed to save expense item'); 
      }
    } catch (e) { 
      toast.error('Error saving expense item'); 
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense item?')) return;
    try {
      const res = await fetch(`/api/expense-items/${id}`, { method: 'DELETE' });
      if (res.ok) { 
        toast.success('Expense item deleted'); 
        fetchItems(); 
      }
    } catch (e) { toast.error('Failed to delete expense item'); }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingItem(null);
    setFormData({ name: '', type: 'Daily', addInAccount: false });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      type: item.type || 'Daily',
      addInAccount: item.addInAccount !== false
    });
    setShowAddForm(true);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(item => {
      const matchStatus = statusFilter === 'all' || String(item.isActive) === String(statusFilter === 'active');
      const matchSearch = !q || (item.name || '').toLowerCase().includes(q) || (item.type || '').toLowerCase().includes(q);
      const matchType = typeFilter === 'All Expense Types' || (item.type || 'Daily') === typeFilter;
      return matchStatus && matchSearch && matchType;
    });
  }, [items, search, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const paged = filtered.slice(page * size, page * size + size);

  return (
    <div className="expense-item-page fade-in text-dark p-3">
      {/* Header */}
      <div className="manage-header-card mb-3 d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm border" style={{ borderColor: '#e0e0e0' }}>
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm" style={{ width: 48, height: 48, backgroundColor: '#002142' }}>
            <i className="bi bi-tags fs-5"></i>
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: '#002142', letterSpacing: '-0.5px' }}>Manage Expense Items</h4>
            <p className="mb-0 text-muted small">Configure expense categories for daily &amp; monthly accounts</p>
          </div>
        </div>
        {!showAddForm && (
          <button className="btn text-white fw-semibold d-flex align-items-center gap-2 shadow-sm px-4 py-2" style={{ backgroundColor: '#002142', borderRadius: '8px' }} onClick={() => setShowAddForm(true)}>
            <i className="bi bi-plus-lg"></i><span>Add Expense Item</span>
          </button>
        )}
      </div>

      {/* Inline Form */}
      {showAddForm && (
        <div className="bg-white p-4 rounded shadow-sm border mb-4 slide-down" style={{ borderColor: '#e0e0e0' }}>
          <div className="d-flex align-items-start gap-3 mb-4">
            <div className="rounded d-flex align-items-center justify-content-center text-white" style={{ width: 44, height: 44, backgroundColor: '#002142', borderRadius: '10px' }}>
              <i className="bi bi-tag-fill fs-5"></i>
            </div>
            <div>
              <h5 className="fw-bold mb-1" style={{ color: '#002142' }}>{editingItem ? 'Edit Expense Item' : 'Create New Expense Item'}</h5>
              <p className="text-muted small mb-0">Define catalog details and accounting inclusion rules</p>
            </div>
          </div>
          
          <hr className="mb-4 text-muted" />

          <form onSubmit={handleSave}>
            <div className="row g-4 mb-4">
              <div className="col-md-6">
                <label className="fw-bold small mb-2 text-uppercase tracking-wider text-muted">Expense Item Name <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text bg-white text-muted border-end-0">
                    <i className="bi bi-tag-fill"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control border-start-0 ps-0 shadow-none" 
                    placeholder="e.g. Office Stationery, Fuel, Tea & Refreshments" 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    required 
                  />
                </div>
              </div>
              
              <div className="col-md-6">
                <label className="fw-bold small mb-2 text-uppercase tracking-wider text-muted">Expense Frequency <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text bg-white text-muted border-end-0">
                    <i className="bi bi-calendar-event"></i>
                  </span>
                  <select 
                    className="form-select border-start-0 ps-0 shadow-none" 
                    value={formData.type} 
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Daily">Daily Expense</option>
                    <option value="Monthly">Monthly Expense</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-light p-3 rounded border d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-white rounded p-2 border text-muted shadow-sm d-flex align-items-center justify-content-center" style={{width: 40, height: 40}}>
                  <i className="bi bi-calculator fs-5"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1 text-dark">Accounting Calculation</h6>
                  <p className="text-muted small mb-0">Include this expense item in profit & loss accounting ledgers</p>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <div className="form-check form-switch fs-5 mb-0">
                  <input 
                    className="form-check-input shadow-none cursor-pointer" 
                    type="checkbox" 
                    role="switch" 
                    id="addInAccountToggle" 
                    checked={formData.addInAccount} 
                    onChange={e => setFormData({ ...formData, addInAccount: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <label className={`fw-bold mb-0 ${formData.addInAccount ? 'text-success' : 'text-muted'}`} htmlFor="addInAccountToggle" style={{ cursor: 'pointer' }}>
                  {formData.addInAccount ? 'Included' : 'Excluded'}
                </label>
              </div>
            </div>

            <hr className="mb-4 text-muted" />

            <div className="d-flex justify-content-end gap-3">
              <button type="button" className="btn btn-outline-dark px-4 py-2 fw-semibold d-flex align-items-center gap-2" onClick={resetForm}>
                <i className="bi bi-x-circle"></i> Cancel
              </button>
              <button type="submit" className="btn px-4 py-2 fw-semibold text-white d-flex align-items-center gap-2 shadow-sm" style={{ backgroundColor: '#002142' }}>
                <i className="bi bi-check2-circle"></i> Save Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-3 rounded shadow-sm border mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ borderColor: '#e0e0e0' }}>
        <div className="input-group" style={{ maxWidth: '400px' }}>
          <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
          <input 
            type="text" 
            placeholder="Search by name (press Enter)..." 
            className="form-control border-start-0 shadow-none bg-light" 
            value={search} 
            onChange={e => { setSearch(e.target.value); setPage(0); }} 
          />
        </div>
        
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-2">
            <label className="fw-bold small text-uppercase text-muted mb-0" style={{ fontSize: '0.75rem' }}>Expense Category</label>
            <select 
              className="form-select form-select-sm shadow-none" 
              style={{ width: '180px', borderColor: '#e0e0e0' }}
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
            >
              <option value="All Expense Types">All Expense Types</option>
              <option value="Daily">Daily</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive rounded shadow-sm bg-white border" style={{ borderColor: '#e0e0e0' }}>
        <table className="particulars-table data-table w-100">
          <thead>
            <tr style={{ backgroundColor: '#002142' }}>
              <th className="text-center text-white" style={{ width: '60px' }}>#</th>
              <th className="text-white">NAME</th>
              <th className="text-white">TYPE</th>
              <th className="text-center text-white">IN ACCOUNT</th>
              <th className="text-center text-white">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center py-5">Loading...</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-5 text-muted">No expense items found.</td></tr>
            ) : paged.map((item, i) => (
              <tr key={itemId(item) || i} className="align-middle">
                <td className="text-center fw-bold text-muted">{page * size + i + 1}</td>
                <td className="fw-bold" style={{ color: '#002142' }}>{item.name}</td>
                <td>
                  <span className="badge rounded-pill border text-dark px-3 py-2" style={{ backgroundColor: '#f8f9fa' }}>
                    <i className="bi bi-calendar2-event me-2 text-muted"></i>
                    {item.type || 'Daily'}
                  </span>
                </td>
                <td className="text-center">
                  {item.addInAccount === false ? (
                    <span className="badge rounded-pill border text-dark px-3 py-2" style={{ backgroundColor: '#f8f9fa' }}>
                      <i className="bi bi-dash-circle me-2 text-secondary"></i>
                      Excluded
                    </span>
                  ) : (
                    <span className="badge rounded-pill border text-dark px-3 py-2" style={{ backgroundColor: '#f8f9fa' }}>
                      <i className="bi bi-plus-circle me-2 text-success"></i>
                      Included
                    </span>
                  )}
                </td>
                <td className="text-center">
                  <div className="d-flex justify-content-center gap-2">
                    <button className="btn btn-sm btn-outline-dark" style={{ width: 32, height: 32, padding: 0 }} onClick={() => handleEdit(item)}>
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger" style={{ width: 32, height: 32, padding: 0 }} onClick={() => handleDelete(itemId(item))}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > size && (
        <div className="d-flex justify-content-between align-items-center bg-white rounded shadow-sm p-3 mt-3 border" style={{ borderColor: '#e0e0e0' }}>
          <small className="text-muted fw-semibold">Showing {page * size + 1}-{Math.min((page + 1) * size, filtered.length)} of {filtered.length}</small>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-outline-dark" disabled={page === 0} onClick={() => setPage(page - 1)}><i className="bi bi-chevron-left"></i></button>
            <span className="align-self-center px-3 fw-bold">{page + 1} / {totalPages}</span>
            <button className="btn btn-sm btn-outline-dark" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}><i className="bi bi-chevron-right"></i></button>
          </div>
        </div>
      )}

      <style jsx>{`
        .slide-down {
          animation: slideDown 0.3s ease-out forwards;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}