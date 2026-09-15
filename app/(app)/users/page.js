'use client';
import { useState, useEffect, useMemo, Suspense } from 'react';
import toast from 'react-hot-toast';

function ManageUsersInner() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const size = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'ROLE_EMPLOYEE', branchName: '', branchId: '' });

  const itemId = (x) => x && (x._id || x.id);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(Array.isArray(data.data) ? data.data : []);
    } catch (e) { toast.error('Failed to load users'); setUsers([]); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/users/${itemId(editingItem)}` : '/api/users';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) {
        toast.success(`User ${editingItem ? 'updated' : 'created'} successfully`);
        setModalOpen(false); setEditingItem(null); setFormData({ username: '', email: '', password: '', role: 'ROLE_EMPLOYEE', branchName: '', branchId: '' }); fetchUsers();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to save user');
      }
    } catch (e) { toast.error('Error saving user'); }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('User deleted'); fetchUsers(); }
    } catch (e) { toast.error('Failed to delete user'); }
    setDeleteConfirmId(null);
  };

  const handleToggle = async (u) => {
    try {
      const res = await fetch(`/api/users/${itemId(u)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...u, isActive: !u.isActive }) });
      if (res.ok) { toast.success(u.isActive ? 'User deactivated' : 'User activated'); fetchUsers(); }
      else { toast.error('Failed to update status'); }
    } catch (e) { toast.error('Error updating status'); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u =>
      (statusFilter === 'all' || String(u.isActive) === String(statusFilter === 'active')) &&
      (!q || (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.role || '').toLowerCase().includes(q)));
  }, [users, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const paged = filtered.slice(page * size, page * size + size);

  const roleBadge = (role) => {
    const cls = role === 'ROLE_ADMIN' ? 'bg-danger' : role === 'ROLE_MANAGER' ? 'bg-warning text-dark' : 'bg-primary';
    return <span className={`badge ${cls}`}>{role}</span>;
  };

  return (
    <div className="users-page fade-in text-dark p-3">
      <div className="manage-header-card mb-3 d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: 44, height: 44, backgroundColor: '#002142' }}>
            <i className="bi bi-shield-lock fs-5"></i>
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: '#002142' }}>Manage Users</h4>
            <p className="mb-0 text-muted small">Admin control of user accounts and permissions</p>
          </div>
        </div>
        <button className="btn text-white fw-semibold d-flex align-items-center gap-2" style={{ backgroundColor: '#002142', borderRadius: '8px' }} onClick={() => { setEditingItem(null); setFormData({ username: '', email: '', password: '', role: 'ROLE_EMPLOYEE', branchName: '', branchId: '' }); setModalOpen(true); }}>
          <i className="bi bi-plus-lg"></i><span>Add User</span>
        </button>
      </div>

      <div className="branch-banner position-relative text-center text-white mb-4 rounded px-4 py-4 shadow-sm" style={{ backgroundColor: '#002142' }}>
        <div className="position-absolute top-0 end-0 m-3 px-3 py-1 badge bg-light text-dark shadow-sm fw-bold">Total Users: {filtered.length}</div>
        <h3 className="fw-bold mb-2 text-uppercase tracking-wider">System Users Management</h3>
        <p className="mb-0 text-white-50 small">Admin control of user accounts and permissions</p>
      </div>

      <div className="bg-white p-3 rounded shadow-sm mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="input-group" style={{ maxWidth: '350px' }}>
          <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
          <input type="text" placeholder="Search username, email or role..." className="form-control border-start-0 shadow-none" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <div className="btn-group">
          {['all', 'active', 'inactive'].map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => { setStatusFilter(s); setPage(0); }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="table-responsive rounded shadow-sm bg-white border-0">
        <table className="particulars-table data-table w-100">
          <thead><tr style={{ backgroundColor: '#002142' }}>
            <th className="text-center" style={{ width: '60px' }}>#</th>
            <th>USERNAME</th>
            <th>EMAIL</th>
            <th>ROLE</th>
            <th className="text-center">STATUS</th>
            <th className="text-center">ACTIONS</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="text-center py-5">Loading users...</td></tr>
              : paged.length === 0 ? <tr><td colSpan="6" className="text-center py-5 text-muted">No users found.</td></tr>
                : paged.map((u, i) => (
                  <tr key={itemId(u) || i}>
                    <td className="text-center fw-bold">{page * size + i + 1}</td>
                    <td className="fw-bold" style={{ color: '#002142' }}>{u.username}</td>
                    <td>{u.email || '-'}</td>
                    <td>{roleBadge(u.role)}</td>
                    <td className="text-center">
                      <button className={`btn btn-sm rounded-pill px-3 ${u.isActive === false ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(u)}>{u.isActive === false ? 'Inactive' : 'Active'}</button>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(u); setFormData({ username: u.username || '', email: u.email || '', password: '', role: u.role || 'ROLE_EMPLOYEE', branchName: u.branchName || '', branchId: u.branchId || '' }); setModalOpen(true); }}>
                        <i className="bi bi-pencil me-1"></i> Edit
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteConfirmId(itemId(u))}>
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

      {deleteConfirmId && (
        <div className="d-flex align-items-center justify-content-center modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-white p-4 text-center modal-content-animated shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="icon-container mx-auto mb-3 d-flex align-items-center justify-content-center bg-danger bg-opacity-10 rounded-circle" style={{ width: '80px', height: '80px' }}>
              <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: '3.5rem' }}></i>
            </div>
            <h4 className="fw-bold mb-2 text-dark">Delete User?</h4>
            <p className="text-muted mb-4 px-2" style={{ fontSize: '1rem' }}>
              Are you sure you want to delete this user?<br/>
              This action cannot be undone.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <button className="btn btn-secondary px-4 py-2 fw-semibold btn-hover-effect border-0" style={{ borderRadius: '8px', backgroundColor: '#64748b' }} onClick={() => setDeleteConfirmId(null)}>No</button>
              <button className="btn btn-danger px-4 py-2 fw-semibold btn-hover-effect border-0 shadow-sm" style={{ borderRadius: '8px', backgroundColor: '#ef4444' }} onClick={() => handleDelete(deleteConfirmId)}>Yes, delete it</button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="d-flex align-items-center justify-content-center modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="bg-white p-4 modal-content-animated shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="mb-4">
              <h4 className="fw-bold m-0" style={{ color: '#002142' }}>{editingItem ? 'Edit User' : 'Add New User'}</h4>
            </div>
            <hr className="mb-4" style={{ borderColor: '#e5e7eb', margin: '0 -1.5rem' }} />
            <form onSubmit={handleSave}>
              <div className="form-group mb-4">
                <label className="fw-bold small text-muted mb-2" style={{ letterSpacing: '0.5px' }}>USERNAME</label>
                <input type="text" className="form-control form-control-lg custom-input" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
              </div>
              <div className="form-group mb-4">
                <label className="fw-bold small text-muted mb-2" style={{ letterSpacing: '0.5px' }}>EMAIL</label>
                <input type="email" className="form-control form-control-lg custom-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="form-group mb-4">
                <label className="fw-bold small text-muted mb-2" style={{ letterSpacing: '0.5px' }}>PASSWORD {editingItem && <span className="fw-normal text-secondary text-lowercase" style={{ letterSpacing: 'normal' }}>(leave blank to keep unchanged)</span>}</label>
                <input type="password" className="form-control form-control-lg custom-input" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!editingItem} />
              </div>
              <div className="form-group mb-5">
                <label className="fw-bold small text-muted mb-2" style={{ letterSpacing: '0.5px' }}>ROLE</label>
                <select className="form-select form-select-lg custom-input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                  <option value="ROLE_ADMIN">Admin</option>
                  <option value="ROLE_MANAGER">Manager</option>
                  <option value="ROLE_EMPLOYEE">Employee</option>
                  <option value="ROLE_USER">User</option>
                </select>
              </div>
              <div className="d-flex justify-content-end gap-3 mt-2">
                <button type="button" className="btn px-4 py-2 fw-semibold text-white btn-hover-effect border-0" style={{ backgroundColor: '#6b7280', borderRadius: '6px' }} onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn px-4 py-2 fw-semibold text-white btn-hover-effect border-0" style={{ backgroundColor: '#002142', borderRadius: '6px' }}>Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1050;
          background-color: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          animation: fadeIn 0.3s ease-out forwards;
        }
        .modal-content-animated {
          max-width: 480px;
          width: 90%;
          border-radius: 12px;
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: center center;
        }
        .icon-container {
          animation: pulseRed 2s infinite;
        }
        .custom-input {
          border-radius: 8px;
          border: 1px solid #d1d5db;
          box-shadow: none;
          font-size: 1rem;
          padding: 0.75rem 1rem;
        }
        .custom-input:focus {
          border-color: #002142;
          box-shadow: 0 0 0 3px rgba(0, 33, 66, 0.1);
        }
        .btn-hover-effect {
          transition: all 0.2s ease-in-out;
        }
        .btn-hover-effect:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .btn-danger.btn-hover-effect:hover {
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4) !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulseRed {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}} />
    </div>
  );
}

export default function ManageUsersPage() {
  return (
    <Suspense fallback={<div className="text-center py-5">Loading...</div>}>
      <ManageUsersInner />
    </Suspense>
  );
}