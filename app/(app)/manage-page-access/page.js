'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useApp } from '@/context/AppContext';

const DEFAULT_RULES = [
  { page: 'DASHBOARD', admin: true, manager: true, employee: true },
  { page: 'EXPLORE', admin: true, manager: true, employee: true },
  { page: 'BILLS_CREATE', admin: true, manager: true, employee: true },
  { page: 'BILLS_EDIT', admin: true, manager: true, employee: false },
  { page: 'BILLS_ALL', admin: true, manager: true, employee: true },
  { page: 'BILLS_TODAY', admin: true, manager: true, employee: true },
  { page: 'ORDERS', admin: true, manager: true, employee: false },
  { page: 'CREDITS', admin: true, manager: true, employee: false },
  { page: 'CATEGORY', admin: true, manager: true, employee: false },
  { page: 'USERS', admin: true, manager: false, employee: false },
  { page: 'BRANCHES', admin: true, manager: false, employee: false },
  { page: 'CUSTOMERS', admin: true, manager: true, employee: false },
  { page: 'CUSTOMER_VIEW', admin: true, manager: true, employee: true },
  { page: 'ITEMS', admin: true, manager: true, employee: false },
  { page: 'MACHINE_CATEGORY', admin: true, manager: true, employee: false },
  { page: 'MACHINE', admin: true, manager: true, employee: false },
  { page: 'PAPER_CATEGORY', admin: true, manager: true, employee: false },
  { page: 'PAPER_GROUP', admin: true, manager: true, employee: false },
  { page: 'PAPER', admin: true, manager: true, employee: false },
  { page: 'PARTICULARS', admin: true, manager: true, employee: false },
  { page: 'EMPLOYEES', admin: true, manager: false, employee: false },
  { page: 'EMPLOYEE_VIEW', admin: true, manager: true, employee: true },
  { page: 'EXPENSE_ITEM', admin: true, manager: true, employee: false },
  { page: 'DAILY_EXPENSES', admin: true, manager: true, employee: false },
  { page: 'MONTHLY_EXPENSE', admin: true, manager: true, employee: false },
  { page: 'REPORTS_DAILY_EXPENSE', admin: true, manager: true, employee: false },
  { page: 'MANAGE_PAGE_ACCESS', admin: true, manager: false, employee: false },
  { page: 'ANALYTICS', admin: true, manager: true, employee: false },
  { page: 'SETTINGS', admin: true, manager: true, employee: false },
];

const itemId = (r) => r?._id || r?.id;

const getPageIcon = (pageName) => {
  const p = pageName.toLowerCase();
  if (p.includes('dashboard')) return 'bi-grid-1x2';
  if (p.includes('bills_create')) return 'bi-plus-circle';
  if (p.includes('bills_edit')) return 'bi-pencil-square';
  if (p.includes('bills')) return 'bi-receipt-cutoff';
  if (p.includes('order')) return 'bi-clock-history';
  if (p.includes('credit')) return 'bi-credit-card-2-front';
  if (p.includes('category')) return 'bi-tags';
  if (p.includes('user')) return 'bi-person-badge';
  if (p.includes('branch')) return 'bi-building';
  if (p.includes('customer')) return 'bi-people';
  if (p.includes('item')) return 'bi-box-seam';
  if (p.includes('machine')) return 'bi-printer';
  if (p.includes('paper')) return 'bi-file-earmark-ruled';
  if (p.includes('particular')) return 'bi-list-columns-reverse';
  if (p.includes('employee')) return 'bi-people-fill';
  if (p.includes('expense')) return 'bi-cash-coin';
  if (p.includes('report')) return 'bi-file-bar-graph';
  if (p.includes('security') || p.includes('access')) return 'bi-shield-lock';
  if (p.includes('analytics')) return 'bi-graph-up';
  if (p.includes('setting')) return 'bi-gear';
  return 'bi-file-earmark-text';
};

const getDisplayName = (pageName) => {
  return pageName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

function PageAccessListInner({ rules, onToggleRole, processing }) {
  const handleToggle = async (id, role) => {
    const item = rules.find(r => itemId(r) === id);
    if (item && item.page === 'MANAGE_PAGE_ACCESS' && role === 'admin') return;
    await onToggleRole(id, role);
  };

  return (
    <div className="glass-card">
      <div className="table-responsive">
        <table className="premium-table">
          <thead>
            <tr>
              <th><i className="bi bi-compass-fill" style={{ marginRight: '8px', color: '#002142' }}></i>Resource & Route</th>
              <th className="text-center"><i className="bi bi-shield-check" style={{ marginRight: '6px', color: '#10b981' }}></i>Admin</th>
              <th className="text-center"><i className="bi bi-briefcase" style={{ marginRight: '6px', color: '#2563eb' }}></i>Manager</th>
              <th className="text-center"><i className="bi bi-person-workspace" style={{ marginRight: '6px', color: '#d97706' }}></i>Employee</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: 0 }}>
                  <div className="security-empty-state">
                    <i className="bi bi-shield-x"></i>
                    <h4>No Access Rules Found</h4>
                    <p>Database table is empty. Please add page identifiers to configure access.</p>
                  </div>
                </td>
              </tr>
            ) : (
              rules.map((item) => {
                const id = itemId(item);
                const locked = item.page === 'MANAGE_PAGE_ACCESS';
                return (
                  <tr key={id}>
                    <td>
                      <div className="page-info">
                        <div className="icon-box">
                          <i className={`bi ${getPageIcon(item.page)}`}></i>
                        </div>
                        <div className="page-details">
                          <span className="page-name">{getDisplayName(item.page)}</span>
                          <span className="page-id">{item.page}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="toggle-wrapper">
                        <label className="premium-switch">
                          <input
                            type="checkbox"
                            checked={locked ? true : item.admin}
                            disabled={locked || processing === `${id}-admin`}
                            onChange={() => handleToggle(id, 'admin')}
                          />
                          <span className="premium-slider"></span>
                        </label>
                      </div>
                    </td>
                    <td>
                      <div className="toggle-wrapper">
                        <label className="premium-switch">
                          <input
                            type="checkbox"
                            checked={!!item.manager}
                            disabled={processing === `${id}-manager`}
                            onChange={() => handleToggle(id, 'manager')}
                          />
                          <span className="premium-slider"></span>
                        </label>
                      </div>
                    </td>
                    <td>
                      <div className="toggle-wrapper">
                        <label className="premium-switch">
                          <input
                            type="checkbox"
                            checked={!!item.employee}
                            disabled={processing === `${id}-employee`}
                            onChange={() => handleToggle(id, 'employee')}
                          />
                          <span className="premium-slider"></span>
                        </label>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ManagePageAccessPage() {
  const { setPageAccessRules } = useApp();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [processing, setProcessing] = useState(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/page-access');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Request failed');
      const list = Array.isArray(data) ? data : (data.data || data.rules || []);

      // Merge in any identifiers the store may be missing so all routes are manageable.
      const merged = DEFAULT_RULES.map(d => {
        const existing = list.find(r => r.page === d.page);
        return existing || { ...d, _id: undefined, id: undefined, active: true, isActive: true };
      });
      merged.sort((a, b) => a.page.localeCompare(b.page));
      setRules(merged);
      setPageAccessRules(merged.filter(r => r.isActive !== false));
    } catch (e) {
      toast.error('Error fetching page access rules');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (id, role) => {
    setProcessing(`${id}-${role}`);
    const previous = rules;
    const optimisticallyUpdated = rules.map(r => itemId(r) === id ? { ...r, [role]: !r[role] } : r);
    setRules(optimisticallyUpdated);
    setPageAccessRules(optimisticallyUpdated.filter(r => r.isActive !== false));

    try {
      const res = await fetch(`/api/page-access/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Request failed');

      const synced = rules.map(r => itemId(r) === id ? data : r);
      setRules(synced);
      setPageAccessRules(synced.filter(r => r.isActive !== false));
      toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} access updated successfully`);
    } catch (e) {
      toast.error(`Failed to update ${role} access`);
      setRules(previous);
      setPageAccessRules(previous.filter(r => r.isActive !== false));
    } finally {
      setProcessing(null);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all page access rules to factory defaults?')) return;
    setResetting(true);
    try {
      const res = await fetch('/api/page-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: DEFAULT_RULES }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Request failed');
      toast.success('Access rules reset to defaults');
      await fetchRules();
    } catch (e) {
      toast.error('Failed to reset access rules');
    } finally {
      setResetting(false);
    }
  };

  const totalRoutes = rules.length;
  const adminRoutes = rules.filter(r => r.admin).length;
  const managerRoutes = rules.filter(r => r.manager).length;
  const employeeRoutes = rules.filter(r => r.employee).length;

  const filteredRules = rules
    .filter(rule => {
      const matchesSearch = rule.page.toLowerCase().replace(/_/g, ' ').includes(searchTerm.toLowerCase());
      if (activeTab === 'admin') return matchesSearch && rule.admin;
      if (activeTab === 'manager') return matchesSearch && rule.manager;
      if (activeTab === 'employee') return matchesSearch && rule.employee;
      return matchesSearch;
    })
    .sort((a, b) => a.page.localeCompare(b.page));

  return (
    <div className="manage-page-access-container animate-fade-in">
      <div className="security-banner">
        <div className="banner-glow"></div>
        <div className="banner-top-row">
          <div className="status-badge status-active">
            <span className="status-dot"></span> Live Sync
          </div>
          <span className="console-security-badge">
            <i className="bi bi-shield-lock-fill" style={{ color: '#10b981' }}></i> Access Control Console
          </span>
        </div>
        <div className="security-banner-content">
          <h1>Dynamic Route Authorization</h1>
          <p>
            Configure role-based page and action permissions. Changes take effect instantly for all logged-in users.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className={`stat-card total ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          <div className="stat-icon"><i className="bi bi-diagram-3"></i></div>
          <div className="stat-info">
            <h3>{totalRoutes}</h3>
            <span>Total Resources</span>
          </div>
        </div>
        <div className={`stat-card admin ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
          <div className="stat-icon"><i className="bi bi-shield-check"></i></div>
          <div className="stat-info">
            <h3>{adminRoutes}</h3>
            <span>Admin Access</span>
          </div>
        </div>
        <div className={`stat-card manager ${activeTab === 'manager' ? 'active' : ''}`} onClick={() => setActiveTab('manager')}>
          <div className="stat-icon"><i className="bi bi-briefcase"></i></div>
          <div className="stat-info">
            <h3>{managerRoutes}</h3>
            <span>Manager Access</span>
          </div>
        </div>
        <div className={`stat-card employee ${activeTab === 'employee' ? 'active' : ''}`} onClick={() => setActiveTab('employee')}>
          <div className="stat-icon"><i className="bi bi-person-workspace"></i></div>
          <div className="stat-info">
            <h3>{employeeRoutes}</h3>
            <span>Employee Access</span>
          </div>
        </div>
      </div>

      <div className="control-bar">
        <div className="search-box">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search routes or resources (e.g. Bills)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-btn" onClick={() => setSearchTerm('')}>
              <i className="bi bi-x-circle-fill"></i>
            </button>
          )}
        </div>

        <div className="filter-tabs">
          <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All</button>
          <button className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>Admin</button>
          <button className={`tab-btn ${activeTab === 'manager' ? 'active' : ''}`} onClick={() => setActiveTab('manager')}>Manager</button>
          <button className={`tab-btn ${activeTab === 'employee' ? 'active' : ''}`} onClick={() => setActiveTab('employee')}>Employee</button>
        </div>

        <button
          className="tab-btn"
          onClick={handleReset}
          disabled={resetting}
          style={{ color: '#002142', fontWeight: 600 }}
        >
          <i className="bi bi-arrow-counterclockwise" style={{ marginRight: '6px' }}></i>
          {resetting ? 'Resetting...' : 'Reset Defaults'}
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p style={{ color: '#64748b', fontWeight: 500 }}>Fetching live policy configuration...</p>
        </div>
      ) : (
        <PageAccessListInner rules={filteredRules} onToggleRole={handleToggleRole} processing={processing} />
      )}
    </div>
  );
}