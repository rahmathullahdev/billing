'use client';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';

const EMPTY_FORM = { itemId: '', name: '', category: '', basePrice: 0, description: '' };

export default function ManageItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const itemId = (x) => x && (x._id || x.id);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch('/api/items');
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : (data.data?.content || []);
      setItems(list);
    } catch {
      toast.error('Failed to load items');
      setItems([]);
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
    if (!formData.itemId.trim()) errors.itemId = 'Item code is required';
    if (!formData.name.trim()) errors.name = 'Item name is required';
    if (formData.basePrice === '' || Number(formData.basePrice) < 0) errors.basePrice = 'Enter a valid price';
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
      const url = editingItem ? `/api/items/${itemId(editingItem)}` : '/api/items';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, price: formData.basePrice }),
      });
      if (!res.ok) throw new Error('Request failed');
      toast.success(`Item ${editingItem ? 'updated' : 'created'}`);
      setModalOpen(false);
      setEditingItem(null);
      resetForm();
      fetchItems();
    } catch {
      toast.error('Error saving item');
    }
  };

  const handleDelete = async (id) => {
    const previous = items;
    setItems((list) => list.filter((x) => itemId(x) !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setDeleteTarget(null);
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Request failed');
      toast.success('Item deleted');
    } catch {
      setItems(previous);
      toast.error('Failed to delete item');
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const previous = items;
    setBulkBusy(true);
    setItems((list) => list.filter((x) => !selectedIds.has(itemId(x))));
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/items/${id}`, { method: 'DELETE' }).then((res) => {
          if (!res.ok) throw new Error('Request failed');
          return res;
        })
      )
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    setBulkBusy(false);
    setBulkDeleteOpen(false);
    if (failed > 0) {
      setItems(previous);
      toast.error(`${failed} item${failed === 1 ? '' : 's'} could not be deleted`);
    } else {
      toast.success(`${ids.length} item${ids.length === 1 ? '' : 's'} deleted`);
      setSelectedIds(new Set());
    }
  };

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return items.filter((i) => !q || i.name?.toLowerCase().includes(q) || i.itemId?.toLowerCase().includes(q));
  }, [items, debouncedSearch]);

  const columns = [
    {
      key: 'index',
      header: '#',
      className: 'th-center',
      style: { width: '60px' },
      render: (item, i) => <span className="badge bg-light text-dark border px-2 py-1 font-monospace">{i + 1}</span>,
    },
    {
      key: 'itemId',
      header: 'ITEM ID',
      className: 'th-left',
      style: { width: '130px' },
      render: (item) => <span className="fw-bold text-primary font-monospace">{item.itemId}</span>,
    },
    {
      key: 'name',
      header: 'ITEM NAME',
      className: 'th-left',
      style: { minWidth: '220px' },
      render: (item) => <span className="fw-bold" style={{ color: '#002142' }}>{item.name}</span>,
    },
    {
      key: 'category',
      header: 'CATEGORY',
      className: 'th-center',
      style: { width: '150px' },
      render: (item) => <span className="badge-pill-cyan">{item.category || 'General'}</span>,
    },
    {
      key: 'basePrice',
      header: 'PRICE (₹)',
      className: 'th-right',
      style: { width: '120px' },
      render: (item) => <span className="fw-bold text-success">₹ {Number(item.basePrice || item.price || 0).toFixed(2)}</span>,
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      className: 'th-right',
      style: { width: '120px' },
      render: (item) => (
        <div className="d-inline-flex align-items-center gap-1">
          <button
            className="btn btn-sm btn-outline-secondary p-1 d-inline-flex align-items-center justify-content-center shadow-none"
            style={{ width: '30px', height: '30px', borderRadius: '6px' }}
            onClick={() => {
              setEditingItem(item);
              setFormErrors({});
              setFormData({
                itemId: item.itemId,
                name: item.name,
                category: item.category || '',
                basePrice: item.basePrice || item.price || 0,
                description: item.description || '',
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
            onClick={() => setDeleteTarget({ id: itemId(item), name: item.name })}
            title="Delete"
          >
            <i className="bi bi-trash" style={{ fontSize: '0.8rem' }}></i>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm">
        <h4 className="fw-bold mb-0 text-uppercase">Items Management</h4>
        <p className="mb-0 text-white-50 small mt-1">Manage catalog inventory items and standard rates</p>
      </div>

      {loadError && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between gap-3">
          <span><i className="bi bi-exclamation-triangle me-2"></i>Could not load items.</span>
          <button className="btn btn-sm btn-outline-danger fw-semibold" onClick={fetchItems}>Retry</button>
        </div>
      )}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <input
          type="text"
          placeholder="Search item..."
          className="form-control"
          style={{ maxWidth: '300px' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="btn btn-primary fw-semibold"
          onClick={() => { setEditingItem(null); resetForm(); setModalOpen(true); }}
        >
          + Add Item
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div className="bulk-bar">
          <span className="fw-semibold"><i className="bi bi-check2-square me-2"></i>{selectedIds.size} selected</span>
          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-sm btn-danger fw-semibold" onClick={() => setBulkDeleteOpen(true)} disabled={bulkBusy}>Delete</button>
            <button className="btn btn-sm btn-light border fw-semibold" onClick={() => setSelectedIds(new Set())} disabled={bulkBusy}>Clear</button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(item) => itemId(item)}
        loading={loading}
        selectable
        selectedKeys={selectedIds}
        onSelectionChange={setSelectedIds}
        skeletonRows={6}
        minWidth="650px"
        emptyIcon="bi-box-seam"
        emptyTitle="No items found"
        emptyMessage={debouncedSearch ? 'Try a different search term.' : 'Add your first catalog item to start billing.'}
      />

      {modalOpen && (
        <div className="modal-backdrop-custom" onClick={() => setModalOpen(false)}>
          <div className="modal-box-custom p-4 bg-white rounded shadow-lg" style={{ maxWidth: '420px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <h5>{editingItem ? 'Edit Item' : 'Add Item'}</h5>
            <form onSubmit={handleSave} noValidate>
              <div className="form-group my-2">
                <label>Item Code / ID</label>
                <input type="text" className={`form-control ${formErrors.itemId ? 'is-invalid' : ''}`} value={formData.itemId} onChange={(e) => updateField('itemId', e.target.value)} />
                {formErrors.itemId && <div className="field-error">{formErrors.itemId}</div>}
              </div>
              <div className="form-group my-2">
                <label>Item Name</label>
                <input type="text" className={`form-control ${formErrors.name ? 'is-invalid' : ''}`} value={formData.name} onChange={(e) => updateField('name', e.target.value)} />
                {formErrors.name && <div className="field-error">{formErrors.name}</div>}
              </div>
              <div className="form-group my-2">
                <label>Category</label>
                <input type="text" className="form-control" value={formData.category} onChange={(e) => updateField('category', e.target.value)} />
              </div>
              <div className="form-group my-2">
                <label>Price (₹)</label>
                <input type="number" step="0.01" className={`form-control ${formErrors.basePrice ? 'is-invalid' : ''}`} value={formData.basePrice} onChange={(e) => updateField('basePrice', e.target.value)} />
                {formErrors.basePrice && <div className="field-error">{formErrors.basePrice}</div>}
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete item?"
        message={`Delete ${deleteTarget?.name || 'this item'} from the catalog? This cannot be undone.`}
        confirmLabel="Yes, delete"
        onConfirm={() => handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selectedIds.size} item${selectedIds.size === 1 ? '' : 's'}?`}
        message="This permanently removes the selected catalog items. This action cannot be undone."
        confirmLabel="Yes, delete selected"
        loading={bulkBusy}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
