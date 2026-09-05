'use client';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

export default function ManageCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const size = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', phoneNumber: '', email: '', taxNumber: '', companyName: '', address: '', creditAmount: 0 });

  const itemId = (x) => x && (x._id || x.id);

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : (data?.data?.content || []);
      setCustomers(list);
    } catch (e) { toast.error('Failed to load customers'); setCustomers([]); }
    finally { setLoading(false); }
  };

  const resetForm = () => setFormData({ name: '', phoneNumber: '', email: '', taxNumber: '', companyName: '', address: '', creditAmount: 0 });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/customers/${itemId(editingItem)}` : '/api/customers';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) {
        toast.success(`Customer ${editingItem ? 'updated' : 'created'} successfully`);
        setModalOpen(false); setEditingItem(null); resetForm(); fetchCustomers();
      } else { toast.error('Failed to save customer'); }
    } catch (e) { toast.error('Error saving customer'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Customer deleted'); fetchCustomers(); }
    } catch (e) { toast.error('Failed to delete customer'); }
  };

  const handleToggle = async (c) => {
    try {
      const res = await fetch(`/api/customers/${itemId(c)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...c, isActive: !c.isActive }) });
      if (res.ok) { toast.success(c.isActive ? 'Customer deactivated' : 'Customer activated'); fetchCustomers(); }
    } catch (e) { toast.error('Error updating status'); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter(c =>
      (statusFilter === 'all' || String(c.isActive) === String(statusFilter === 'active')) &&
      (!q || (c.name || '').toLowerCase().includes(q) || (c.phoneNumber || '').includes(q) || (c.email || '').toLowerCase().includes(q)));
  }, [customers, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const paged = filtered.slice(page * size, page * size + size);

  return (
    <div className="customers-page fade-in text-dark p-3">
      <div className="manage-header-card mb-3 d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: 44, height: 44, backgroundColor: '#002142' }}>
            <i className="bi bi-person-lines-fill fs-5"></i>
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: '#002142' }}>Manage Customers</h4>
            <p className="mb-0 text-muted small">Add, update and oversee client profiles and contact details</p>
          </div>
        </div>
        <button className="btn text-white fw-semibold d-flex align-items-center gap-2" style={{ backgroundColor: '#002142', borderRadius: '8px' }} onClick={() => { setEditingItem(null); resetForm(); setModalOpen(true); }}>
          <i className="bi bi-plus-lg"></i><span>Add Customer</span>
        </button>
      </div>

      <div className="branch-banner position-relative text-center text-white mb-4 rounded px-4 py-4 shadow-sm" style={{ backgroundColor: '#002142' }}>
        <div className="position-absolute top-0 end-0 m-3 px-3 py-1 badge bg-light text-dark shadow-sm fw-bold">Total Customers: {filtered.length}</div>
        <h3 className="fw-bold mb-2 text-uppercase tracking-wider">Customer Management</h3>
        <p className="mb-0 text-white-50 small">Manage contact details, GST numbers and credit accounts</p>
      </div>

      <div className="bg-white p-3 rounded shadow-sm mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="input-group" style={{ maxWidth: '350px' }}>
          <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
          <input type="text" placeholder="Search Customer Name, Phone or Email..." className="form-control border-start-0 shadow-none" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <div className="btn-group">
          {['all', 'active', 'inactive'].map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => { setStatusFilter(s); setPage(0); }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="table-responsive rounded shadow-sm bg-white border-0">
        <table className="particulars-table data-table w-100">
          <thead>
            <tr style={{ backgroundColor: '#002142' }}>
              <th className="text-center" style={{ width: '60px' }}>#</th>
              <th>NAME</th>
              <th>MOBILE</th>
              <th>EMAIL</th>
              <th>GSTIN</th>
              <th>CREDIT</th>
              <th className="text-center">STATUS</th>
              <th className="text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="8" className="text-center py-5"><div className="spinner-border text-primary me-2"></div>Loading customers...</td></tr>
              : paged.length === 0 ? <tr><td colSpan="8" className="text-center py-5 text-muted"><i className="bi bi-person-x fs-1 d-block mb-2 text-secondary"></i>No customers found.</td></tr>
                : paged.map((c, i) => (
                  <tr key={itemId(c) || i}>
                    <td className="text-center fw-bold">{page * size + i + 1}</td>
                    <td className="fw-bold" style={{ color: '#002142' }}>{c.name}</td>
                    <td><i className="bi bi-telephone text-primary me-1"></i>{c.phoneNumber || '-'}</td>
                    <td>{c.email || '-'}</td>
                    <td><span className="badge bg-light text-dark border">{c.taxNumber || '-'}</span></td>
                    <td className="text-danger fw-bold">₹{Number(c.creditAmount || 0).toFixed(2)}</td>
                    <td className="text-center">
                      <button className={`btn btn-sm rounded-pill px-3 ${c.isActive === false ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(c)}>{c.isActive === false ? 'Inactive' : 'Active'}</button>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(c); setFormData({ name: c.name || '', phoneNumber: c.phoneNumber || '', email: c.email || '', taxNumber: c.taxNumber || '', companyName: c.companyName || '', address: c.address || '', creditAmount: c.creditAmount || 0 }); setModalOpen(true); }}>
                        <i className="bi bi-pencil me-1"></i> Edit
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(itemId(c))}>
                        <i className="bi bi-trash me-1"></i> Delete
                      </button>
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
            <h5 className="fw-bold" style={{ color: '#002142' }}>{editingItem ? 'Edit Customer' : 'Add New Customer'}</h5>
            <hr />
            <form onSubmit={handleSave}>
              <div className="row g-2">
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">CUSTOMER NAME</label><input type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">MOBILE NUMBER</label><input type="text" className="form-control" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} required /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">EMAIL</label><input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">GSTIN / TAX NO</label><input type="text" className="form-control" value={formData.taxNumber} onChange={e => setFormData({ ...formData, taxNumber: e.target.value })} /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">COMPANY</label><input type="text" className="form-control" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} /></div></div>
                <div className="col-md-6"><div className="form-group my-2"><label className="fw-bold small text-muted">CREDIT AMOUNT (₹)</label><input type="number" step="0.01" className="form-control" value={formData.creditAmount} onChange={e => setFormData({ ...formData, creditAmount: Number(e.target.value) })} /></div></div>
                <div className="col-12"><div className="form-group my-2"><label className="fw-bold small text-muted">ADDRESS</label><input type="text" className="form-control" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div></div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#002142', borderColor: '#002142' }}>Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}