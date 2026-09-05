'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const PAGES_LIST = [
  { key: 'DASHBOARD', name: 'Dashboard' },
  { key: 'EXPLORE', name: 'Explore Items' },
  { key: 'BILLS_CREATE', name: 'Create Bill' },
  { key: 'BILLS_ALL', name: 'All Bills' },
  { key: 'BILLS_TODAY', name: 'Today Bills' },
  { key: 'ORDERS', name: 'Order History' },
  { key: 'CREDITS', name: 'Credit Management' },
  { key: 'CUSTOMERS', name: 'Manage Customers' },
  { key: 'ITEMS', name: 'Manage Items' },
  { key: 'EMPLOYEES', name: 'Manage Employees' },
  { key: 'REPORTS_DAILY_EXPENSE', name: 'Daily Expense Report' },
  { key: 'ANALYTICS', name: 'Analytics' },
  { key: 'SETTINGS', name: 'Settings' }
];

export default function ManagePageAccessPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/page-access');
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        setRules(data.data);
      } else {
        // Initialize default rules for all pages
        const init = PAGES_LIST.map(p => ({
          page: p.key,
          pageName: p.name,
          admin: true,
          manager: true,
          employee: p.key.startsWith('BILLS_') || p.key === 'DASHBOARD' || p.key === 'EXPLORE'
        }));
        setRules(init);
      }
    } catch (e) {
      toast.error('Error fetching page access rules');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (pageKey, role) => {
    setRules(prev =>
      prev.map(r => {
        if (r.page === pageKey) {
          return { ...r, [role]: !r[role] };
        }
        return r;
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/page-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules })
      });
      if (res.ok) {
        toast.success('Page access permissions saved successfully!');
      } else {
        toast.error('Failed to save permissions');
      }
    } catch (e) {
      toast.error('Server error saving permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm" style={{ background: 'linear-gradient(135deg, #002142, #4338ca)' }}>
        <h4 className="fw-bold mb-0 text-uppercase">Page Access Control</h4>
        <p className="mb-0 text-white-50 small mt-1">Configure role-based access permissions for system modules</p>
      </div>

      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-success" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : '💾 Save Access Permissions'}
        </button>
      </div>

      <div className="table-responsive rounded shadow-sm bg-white p-3">
        <table className="data-table w-100">
          <thead>
            <tr>
              <th>#</th>
              <th>Module / Page</th>
              <th className="text-center">Admin</th>
              <th className="text-center">Manager</th>
              <th className="text-center">Employee</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5" className="text-center py-3">Loading permissions...</td></tr> : rules.map((r, i) => (
              <tr key={r.page || i}>
                <td>{i + 1}</td>
                <td className="fw-bold">{r.pageName || PAGES_LIST.find(p => p.key === r.page)?.name || r.page}</td>
                <td className="text-center">
                  <input type="checkbox" checked={r.admin ?? true} disabled className="form-check-input" />
                </td>
                <td className="text-center">
                  <input type="checkbox" checked={r.manager ?? true} onChange={() => togglePermission(r.page, 'manager')} className="form-check-input" />
                </td>
                <td className="text-center">
                  <input type="checkbox" checked={r.employee ?? false} onChange={() => togglePermission(r.page, 'employee')} className="form-check-input" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
