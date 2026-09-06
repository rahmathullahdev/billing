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
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('User deleted'); fetchUsers(); }
    } catch (e) { toast.error('Failed to delete user'); }
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
            <th>BRANCH</th>
            <th className="text-center">STATUS</th>
            <th className="text-center">ACTIONS</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="7" className="text-center py-5">Loading users...</td></tr>
              : paged.length === 0 ? <tr><td colSpan="7" className="text-center py-5 text-muted">No users found.</td></tr>
                : paged.map((u, i) => (
                  <tr key={itemId(u) || i}>
                    <td className="text-center fw-bold">{page * size + i + 1}</td>
                    <td className="fw-bold" style={{ color: '#002142' }}>{u.username}</td>
                    <td>{u.email || '-'}</td>
                    <td>{roleBadge(u.role)}</td>
                    <td>{u.branchName || '-'}</td>
                    <td className="text-center">
                      <button className={`btn btn-sm rounded-pill px-3 ${u.isActive === false ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(u)}>{u.isActive === false ? 'Inactive' : 'Active'}</button>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(u); setFormData({ username: u.username || '', email: u.email || '', password: '', role: u.role || 'ROLE_EMPLOYEE', branchName: u.branchName || '', branchId: u.branchId || '' }); setModalOpen(true); }}>
                        <i className="bi bi-pencil me-1"></i> Edit
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(itemId(u))}>
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
            <h5 className="fw-bold" style={{ color: '#002142' }}>{editingItem ? 'Edit User' : 'Add New User'}</h5>
            <hr />
            <form onSubmit={handleSave}>
              <div className="form-group my-2"><label className="fw-bold small text-muted">USERNAME</label><input type="text" className="form-control" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required /></div>
              <div className="form-group my-2"><label className="fw-bold small text-muted">EMAIL</label><input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
              <div className="form-group my-2"><label className="fw-bold small text-muted">PASSWORD {editingItem && '(leave blank to keep unchanged)'}</label><input type="password" className="form-control" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!editingItem} /></div>
              <div className="form-group my-2"><label className="fw-bold small text-muted">ROLE</label>
                <select className="form-control" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                  <option value="ROLE_ADMIN">Admin</option>
                  <option value="ROLE_MANAGER">Manager</option>
                  <option value="ROLE_EMPLOYEE">Employee</option>
                  <option value="ROLE_USER">User</option>
                </select>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#002142', borderColor: '#002142' }}>Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
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