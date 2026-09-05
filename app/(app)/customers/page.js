'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ManageCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', phoneNumber: '', email: '', taxNumber: '', address: '' });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.data || data?.content || []);
      setCustomers(list);
    } catch (e) {
      toast.error('Failed to load customers');
      setCustomers([]);
    } finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/customers/${editingItem.id}` : '/api/customers';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success(`Customer ${editingItem ? 'updated' : 'created'} successfully`);
        setModalOpen(false);
        setEditingItem(null);
        setFormData({ name: '', phoneNumber: '', email: '', taxNumber: '', address: '' });
        fetchCustomers();
      } else {
        toast.error('Failed to save customer');
      }
    } catch (e) { toast.error('Error saving customer'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Customer deleted'); fetchCustomers(); }
    } catch (e) { toast.error('Failed to delete customer'); }
  };

  const safeCustomers = Array.isArray(customers) ? customers : [];
  const filtered = safeCustomers.filter(c =>
    (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
    (c.phoneNumber && c.phoneNumber.includes(search))
  );

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

        <button className="btn text-white fw-semibold d-flex align-items-center gap-2" style={{ backgroundColor: '#002142', borderRadius: '8px' }} onClick={() => { setEditingItem(null); setFormData({ name: '', phoneNumber: '', email: '', taxNumber: '', address: '' }); setModalOpen(true); }}>
          <i className="bi bi-plus-lg"></i>
          <span>Add Customer</span>
        </button>
      </div>

      <div className="branch-banner position-relative text-center text-white mb-4 rounded px-4 py-4 shadow-sm" style={{ backgroundColor: '#002142' }}>
        <div className="position-absolute top-0 end-0 m-3 px-3 py-1 badge bg-light text-dark shadow-sm fw-bold">
          Total Customers: {safeCustomers.length}
        </div>
        <h3 className="fw-bold mb-2 text-uppercase tracking-wider">Customer Management</h3>
        <p className="mb-0 text-white-50 small">Manage contact details, GST numbers and credit accounts</p>
      </div>

      <div className="bg-white p-3 rounded shadow-sm mb-3 d-flex align-items-center justify-content-between">
        <div className="input-group" style={{ maxWidth: '350px' }}>
          <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
          <input
            type="text"
            placeholder="Search Customer Name or Phone..."
            className="form-control border-start-0 shadow-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
              <th className="text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-5"><div className="spinner-border text-primary me-2"></div>Loading customers...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-5 text-muted">
                  <i className="bi bi-person-x fs-1 d-block mb-2 text-secondary"></i>
                  No customers found. Click "+ Add Customer" to create one.
                </td>
              </tr>
            ) : (
              filtered.map((c, i) => (
                <tr key={c.id || i}>
                  <td className="text-center fw-bold">{i + 1}</td>
                  <td className="fw-bold" style={{ color: '#002142' }}>{c.name}</td>
                  <td><i className="bi bi-telephone text-primary me-1"></i>{c.phoneNumber || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td><span className="badge bg-light text-dark border">{c.taxNumber || c.gstin || '-'}</span></td>
                  <td className="text-center">
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(c); setFormData({ name: c.name || '', phoneNumber: c.phoneNumber || '', email: c.email || '', taxNumber: c.taxNumber || c.gstin || '', address: c.address || '' }); setModalOpen(true); }}>
                      <i className="bi bi-pencil me-1"></i> Edit
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id)}>
                      <i className="bi bi-trash me-1"></i> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-box p-4 bg-white rounded shadow-lg" style={{ maxWidth: '450px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h5 className="fw-bold" style={{ color: '#002142' }}>{editingItem ? 'Edit Customer' : 'Add New Customer'}</h5>
            <hr />
            <form onSubmit={handleSave}>
              <div className="form-group my-2"><label className="fw-bold small">Customer Name</label><input type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div className="form-group my-2"><label className="fw-bold small">Mobile Number</label><input type="text" className="form-control" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} required /></div>
              <div className="form-group my-2"><label className="fw-bold small">Email</label><input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
              <div className="form-group my-2"><label className="fw-bold small">GSTIN / Tax No</label><input type="text" className="form-control" value={formData.taxNumber} onChange={e => setFormData({ ...formData, taxNumber: e.target.value })} placeholder="GSTIN" /></div>
              <div className="form-group my-2"><label className="fw-bold small">Address</label><input type="text" className="form-control" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
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
