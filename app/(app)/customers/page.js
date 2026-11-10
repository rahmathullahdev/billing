'use client';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';

const EMPTY_FORM = {
  name: '',
  phoneNumber: '',
  email: '',
  taxNumber: '',
  companyName: '',
  address: '',
  creditAmount: 0,
};

const PHONE_RE = /^[0-9+\-()\s]{6,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ManageCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const size = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  const itemId = (x) => x && (x._id || x.id);

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : (data?.data?.content || []);
      setCustomers(list);
    } catch {
      toast.error('Failed to load customers');
      setCustomers([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setFormErrors({});
  };

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Customer name is required';
    if (!formData.phoneNumber.trim()) errors.phoneNumber = 'Mobile number is required';
    else if (!PHONE_RE.test(formData.phoneNumber.trim())) errors.phoneNumber = 'Enter a valid phone number';
    if (formData.email.trim() && !EMAIL_RE.test(formData.email.trim())) errors.email = 'Enter a valid email address';
    if (Number(formData.creditAmount) < 0) errors.creditAmount = 'Credit cannot be negative';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    try {
      const url = editingItem ? `/api/customers/${itemId(editingItem)}` : '/api/customers';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) {
        toast.success(`Customer ${editingItem ? 'updated' : 'created'} successfully`);
        setModalOpen(false);
        setEditingItem(null);
        resetForm();
        fetchCustomers();
      } else {
        toast.error('Failed to save customer');
      }
    } catch {
      toast.error('Error saving customer');
    }
  };

  const handleDelete = async (id) => {
    const previous = customers;
    setCustomers((list) => list.filter((x) => itemId(x) !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setDeleteTarget(null);
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Request failed');
      toast.success('Customer deleted');
    } catch {
      setCustomers(previous);
      toast.error('Failed to delete customer');
    }
  };

  const handleToggle = async (c) => {
    const id = itemId(c);
    const nextActive = c.isActive === false;
    const previous = customers;
    setCustomers((list) => list.map((x) => (itemId(x) === id ? { ...x, isActive: nextActive } : x)));
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...c, isActive: nextActive }),
      });
      if (!res.ok) throw new Error('Request failed');
      toast.success(nextActive ? 'Customer activated' : 'Customer deactivated');
    } catch {
      setCustomers(previous);
      toast.error('Error updating status');
    }
  };

  const handleBulkStatus = async (nextActive) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const previous = customers;
    const byId = new Map(customers.map((c) => [itemId(c), c]));
    setBulkBusy(true);
    setCustomers((list) => list.map((x) => (selectedIds.has(itemId(x)) ? { ...x, isActive: nextActive } : x)));
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/customers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...(byId.get(id) || {}), isActive: nextActive }),
        }).then((res) => {
          if (!res.ok) throw new Error('Request failed');
          return res;
        })
      )
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    setBulkBusy(false);
    if (failed > 0) {
      setCustomers(previous);
      toast.error(`${failed} customer${failed === 1 ? '' : 's'} could not be updated`);
    } else {
      toast.success(`${ids.length} customer${ids.length === 1 ? '' : 's'} ${nextActive ? 'activated' : 'deactivated'}`);
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const previous = customers;
    setBulkBusy(true);
    setCustomers((list) => list.filter((x) => !selectedIds.has(itemId(x))));
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/customers/${id}`, { method: 'DELETE' }).then((res) => {
          if (!res.ok) throw new Error('Request failed');
          return res;
        })
      )
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    setBulkBusy(false);
    setBulkDeleteOpen(false);
    if (failed > 0) {
      setCustomers(previous);
      toast.error(`${failed} customer${failed === 1 ? '' : 's'} could not be deleted`);
    } else {
      toast.success(`${ids.length} customer${ids.length === 1 ? '' : 's'} deleted`);
      setSelectedIds(new Set());
    }
  };

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return customers.filter((c) =>
      (statusFilter === 'all' || String(c.isActive) === String(statusFilter === 'active')) &&
      (!q || (c.name || '').toLowerCase().includes(q) || (c.phoneNumber || '').includes(q) || (c.email || '').toLowerCase().includes(q))
    );
  }, [customers, debouncedSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const paged = filtered.slice(page * size, page * size + size);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const columns = [
    {
      key: 'index',
      header: '#',
      className: 'th-center',
      style: { width: '60px' },
      render: (c, i) => (
        <span className="badge bg-light text-dark border px-2 py-1 font-monospace">{page * size + i + 1}</span>
      ),
    },
    {
      key: 'name',
      header: 'CUSTOMER NAME',
      className: 'th-left',
      style: { minWidth: '200px' },
      render: (c) => <span className="fw-bold" style={{ color: '#002142' }}>{c.name}</span>,
    },
    {
      key: 'phoneNumber',
      header: 'MOBILE',
      className: 'th-left',
      style: { width: '140px' },
      render: (c) => (c.phoneNumber ? <span className="text-muted"><i className="bi bi-telephone text-primary me-1"></i>{c.phoneNumber}</span> : '-'),
    },
    {
      key: 'email',
      header: 'EMAIL',
      className: 'th-left',
      style: { minWidth: '180px' },
      render: (c) => <span className="text-muted">{c.email || '-'}</span>,
    },
    {
      key: 'taxNumber',
      header: 'GSTIN',
      className: 'th-center',
      style: { width: '130px' },
      render: (c) => (c.taxNumber ? <span className="badge bg-light text-dark border font-monospace">{c.taxNumber}</span> : <span className="text-muted">-</span>),
    },
    {
      key: 'creditAmount',
      header: 'CREDIT (₹)',
      className: 'th-right',
      style: { width: '120px' },
      render: (c) => <span className="text-danger fw-bold">₹ {Number(c.creditAmount || 0).toFixed(2)}</span>,
    },
    {
      key: 'status',
      header: 'STATUS',
      className: 'th-center',
      style: { width: '110px' },
      render: (c) => (
        <button
          type="button"
          onClick={() => handleToggle(c)}
          className={`btn btn-sm border-0 p-0 ${c.isActive !== false ? 'badge-pill-success' : 'badge-pill-danger'}`}
          style={{ cursor: 'pointer' }}
          title="Click to toggle status"
        >
          <i className={`bi bi-${c.isActive !== false ? 'check-circle-fill' : 'x-circle-fill'}`} style={{ fontSize: '0.65rem' }}></i>
          <span>{c.isActive !== false ? 'Active' : 'Inactive'}</span>
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      className: 'th-right',
      style: { width: '120px' },
      render: (c) => (
        <div className="d-inline-flex align-items-center gap-1">
          <button
            className="btn btn-sm btn-outline-secondary p-1 d-inline-flex align-items-center justify-content-center shadow-none"
            style={{ width: '30px', height: '30px', borderRadius: '6px' }}
            onClick={() => {
              setEditingItem(c);
              setFormErrors({});
              setFormData({
                name: c.name || '',
                phoneNumber: c.phoneNumber || '',
                email: c.email || '',
                taxNumber: c.taxNumber || '',
                companyName: c.companyName || '',
                address: c.address || '',
                creditAmount: c.creditAmount || 0,
              });
              setModalOpen(true);
            }}
            title="Edit"
          >
            <i className="bi bi-pencil" style={{ fontSize: '0.8rem' }}></i>
          </button>
          <button
            className="btn btn-sm btn-outline-danger p-1 d-inline-flex align-items-center justify-content-center shadow-none"
            style={{ width: '30px', height: '30px', borderRadius: '6px' }}
            onClick={() => setDeleteTarget({ id: itemId(c), name: c.name })}
            title="Delete"
          >
            <i className="bi bi-trash" style={{ fontSize: '0.8rem' }}></i>
          </button>
        </div>
      ),
    },
  ];

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
        <button
          className="btn text-white fw-semibold d-flex align-items-center gap-2"
          style={{ backgroundColor: '#002142', borderRadius: '8px' }}
          onClick={() => { setEditingItem(null); resetForm(); setModalOpen(true); }}
        >
          <i className="bi bi-plus-lg"></i><span>Add Customer</span>
        </button>
      </div>

      <div className="branch-banner position-relative text-center text-white mb-4 rounded px-4 py-4 shadow-sm" style={{ backgroundColor: '#002142' }}>
        <div className="position-absolute top-0 end-0 m-3 px-3 py-1 badge bg-light text-dark shadow-sm fw-bold">Total Customers: {filtered.length}</div>
        <h3 className="fw-bold mb-2 text-uppercase tracking-wider">Customer Management</h3>
        <p className="mb-0 text-white-50 small">Manage contact details, GST numbers and credit accounts</p>
      </div>

      {loadError && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between gap-3">
          <span><i className="bi bi-exclamation-triangle me-2"></i>Could not load customers.</span>
          <button className="btn btn-sm btn-outline-danger fw-semibold" onClick={fetchCustomers}>Retry</button>
        </div>
      )}

      <div className="bg-white p-3 rounded shadow-sm mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="input-group" style={{ maxWidth: '350px' }}>
          <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
          <input
            type="text"
            placeholder="Search Customer Name, Phone or Email..."
            className="form-control border-start-0 shadow-none"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <div className="btn-group">
          {['all', 'active', 'inactive'].map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${statusFilter === s ? 'btn-dark' : 'btn-outline-dark'}`}
              onClick={() => { setStatusFilter(s); setPage(0); }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="bulk-bar">
          <span className="fw-semibold"><i className="bi bi-check2-square me-2"></i>{selectedIds.size} selected</span>
          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-sm btn-outline-success fw-semibold" onClick={() => handleBulkStatus(true)} disabled={bulkBusy}>Activate</button>
            <button className="btn btn-sm btn-outline-secondary fw-semibold" onClick={() => handleBulkStatus(false)} disabled={bulkBusy}>Deactivate</button>
            <button className="btn btn-sm btn-danger fw-semibold" onClick={() => setBulkDeleteOpen(true)} disabled={bulkBusy}>Delete</button>
            <button className="btn btn-sm btn-light border fw-semibold" onClick={() => setSelectedIds(new Set())} disabled={bulkBusy}>Clear</button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={paged}
        rowKey={(c) => itemId(c)}
        loading={loading}
        selectable
        selectedKeys={selectedIds}
        onSelectionChange={setSelectedIds}
        skeletonRows={size}
        minWidth="950px"
        emptyIcon="bi-person-x"
        emptyTitle="No customers found"
        emptyMessage={debouncedSearch || statusFilter !== 'all' ? 'Try a different search or filter.' : 'Add your first customer to get started.'}
      />

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
          <div className="modal-box-custom" onClick={(e) => e.stopPropagation()}>
            <h5 className="fw-bold" style={{ color: '#002142' }}>{editingItem ? 'Edit Customer' : 'Add New Customer'}</h5>
            <hr />
            <form onSubmit={handleSave} noValidate>
              <div className="row g-2">
                <div className="col-md-6">
                  <div className="form-group my-2">
                    <label className="fw-bold small text-muted">CUSTOMER NAME</label>
                    <input type="text" className={`form-control ${formErrors.name ? 'is-invalid' : ''}`} value={formData.name} onChange={(e) => updateField('name', e.target.value)} />
                    {formErrors.name && <div className="field-error">{formErrors.name}</div>}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group my-2">
                    <label className="fw-bold small text-muted">MOBILE NUMBER</label>
                    <input type="text" className={`form-control ${formErrors.phoneNumber ? 'is-invalid' : ''}`} value={formData.phoneNumber} onChange={(e) => updateField('phoneNumber', e.target.value)} />
                    {formErrors.phoneNumber && <div className="field-error">{formErrors.phoneNumber}</div>}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group my-2">
                    <label className="fw-bold small text-muted">EMAIL</label>
                    <input type="email" className={`form-control ${formErrors.email ? 'is-invalid' : ''}`} value={formData.email} onChange={(e) => updateField('email', e.target.value)} />
                    {formErrors.email && <div className="field-error">{formErrors.email}</div>}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group my-2">
                    <label className="fw-bold small text-muted">GSTIN / TAX NO</label>
                    <input type="text" className="form-control" value={formData.taxNumber} onChange={(e) => updateField('taxNumber', e.target.value)} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group my-2">
                    <label className="fw-bold small text-muted">COMPANY</label>
                    <input type="text" className="form-control" value={formData.companyName} onChange={(e) => updateField('companyName', e.target.value)} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group my-2">
                    <label className="fw-bold small text-muted">CREDIT AMOUNT (₹)</label>
                    <input type="number" step="0.01" className={`form-control ${formErrors.creditAmount ? 'is-invalid' : ''}`} value={formData.creditAmount} onChange={(e) => updateField('creditAmount', Number(e.target.value))} />
                    {formErrors.creditAmount && <div className="field-error">{formErrors.creditAmount}</div>}
                  </div>
                </div>
                <div className="col-12">
                  <div className="form-group my-2">
                    <label className="fw-bold small text-muted">ADDRESS</label>
                    <input type="text" className="form-control" value={formData.address} onChange={(e) => updateField('address', e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#002142', borderColor: '#002142' }}>Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete customer?"
        message={`Are you sure you want to delete ${deleteTarget?.name || 'this customer'}? This action cannot be undone.`}
        confirmLabel="Yes, delete"
        onConfirm={() => handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selectedIds.size} customer${selectedIds.size === 1 ? '' : 's'}?`}
        message="This permanently removes the selected customer profiles. This action cannot be undone."
        confirmLabel="Yes, delete selected"
        loading={bulkBusy}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
