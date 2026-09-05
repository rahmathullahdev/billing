'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'ROLE_EMPLOYEE' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.data) setUsers(data.data);
    } catch (e) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/users/${editingItem.id}` : '/api/users';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(`User ${editingItem ? 'updated' : 'created'} successfully`);
        setModalOpen(false);
        setFormData({ username: '', email: '', password: '', role: 'ROLE_EMPLOYEE' });
        setEditingItem(null);
        fetchUsers();
      } else {
        toast.error('Failed to save user');
      }
    } catch (e) {
      toast.error('Error saving user');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('User deleted');
        fetchUsers();
      }
    } catch (e) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="fade-in">
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm" style={{ background: 'linear-gradient(135deg, #002142, #dc2626)' }}>
        <h4 className="fw-bold mb-0 text-uppercase">System Users Management</h4>
        <p className="mb-0 text-white-50 small mt-1">Admin control of user accounts and permissions</p>
      </div>

      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-primary" onClick={() => { setEditingItem(null); setFormData({ username: '', email: '', password: '', role: 'ROLE_EMPLOYEE' }); setModalOpen(true); }}>
          + Add New User
        </button>
      </div>

      <div className="table-responsive rounded shadow-sm bg-white p-3">
        <table className="data-table w-100">
          <thead>
            <tr>
              <th>#</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center py-4">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-4 text-muted">No users found</td></tr>
            ) : (
              users.map((u, i) => (
                <tr key={u.id}>
                  <td>{i + 1}</td>
                  <td className="fw-bold">{u.username}</td>
                  <td>{u.email || '-'}</td>
                  <td><span className={`badge ${u.role === 'ROLE_ADMIN' ? 'bg-danger' : 'bg-primary'}`}>{u.role}</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(u); setFormData({ username: u.username, email: u.email || '', password: '', role: u.role || 'ROLE_EMPLOYEE' }); setModalOpen(true); }}>✏️ Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u.id)}>🗑️ Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-box p-4 bg-white rounded shadow-lg" style={{ maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h5>{editingItem ? 'Edit User' : 'Add New User'}</h5>
            <form onSubmit={handleSave}>
              <div className="form-group my-2">
                <label>Username</label>
                <input type="text" className="form-control" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
              </div>
              <div className="form-group my-2">
                <label>Email</label>
                <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="form-group my-2">
                <label>Password {editingItem && '(leave blank to keep unchanged)'}</label>
                <input type="password" className="form-control" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!editingItem} />
              </div>
              <div className="form-group my-2">
                <label>Role</label>
                <select className="form-control" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                  <option value="ROLE_ADMIN">Admin</option>
                  <option value="ROLE_MANAGER">Manager</option>
                  <option value="ROLE_EMPLOYEE">Employee</option>
                </select>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
