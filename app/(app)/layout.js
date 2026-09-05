'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AppContextProvider, useApp } from '@/context/AppContext';
import toast, { Toaster } from 'react-hot-toast';

// Sidebar Navigation Structure matching original Menubar.jsx
const NAV_ITEMS = [
  { icon: 'bi-grid-1x2', label: 'Dashboard', href: '/dashboard' },
  { icon: 'bi-plus-circle', label: 'New Bills', href: '/bills/create' },
  {
    icon: 'bi-receipt-cutoff', label: 'Bill',
    children: [
      { icon: 'bi-calendar-event', label: 'View Today', href: '/bills/today' },
      { icon: 'bi-list-check', label: 'View All bills', href: '/bills/all' },
    ]
  },
  { icon: 'bi-graph-up', label: 'Analytics', href: '/analytics' },
  { icon: 'bi-credit-card-2-front', label: 'Credit Management', href: '/credits' },
  { type: 'heading', label: 'Manage' },
  { icon: 'bi-list-columns-reverse', label: 'Particulars', href: '/particulars' },
  { icon: 'bi-building', label: 'Branch', href: '/branches' },
  {
    icon: 'bi-people-fill', label: 'Manage Employees',
    children: [
      { icon: 'bi-person-badge', label: 'Employees', href: '/employees' },
      { icon: 'bi-person', label: 'Users', href: '/users' },
      { icon: 'bi-person-workspace', label: 'Employee View', href: '/employee-view' },
    ]
  },
  {
    icon: 'bi-person-lines-fill', label: 'Customers',
    children: [
      { icon: 'bi-person-lines-fill', label: 'Manage', href: '/customers' },
      { icon: 'bi-person-vcard', label: 'Customer View', href: '/customer-view' },
    ]
  },
  {
    icon: 'bi-gear-wide-connected', label: 'Machines',
    children: [
      { icon: 'bi-diagram-3', label: 'Categories', href: '/machine-category' },
      { icon: 'bi-printer', label: 'Machines', href: '/machine' },
    ]
  },
  {
    icon: 'bi-file-earmark-ruled', label: 'Paper',
    children: [
      { icon: 'bi-layers', label: 'Paper Category', href: '/paper-category' },
      { icon: 'bi-collection', label: 'Paper Groups', href: '/paper-group' },
      { icon: 'bi-file-earmark-text', label: 'Paper', href: '/paper' },
    ]
  },
  {
    icon: 'bi-gear', label: 'Operations',
    children: [
      { icon: 'bi-receipt', label: 'Expense Item', href: '/expense-item' },
      { icon: 'bi-calendar-day', label: 'Daily Expense', href: '/daily-expenses' },
      { icon: 'bi-calendar-month', label: 'Monthly Expense', href: '/monthly-expense' },
    ]
  },
  {
    icon: 'bi-file-bar-graph', label: 'Reports',
    children: [
      { icon: 'bi-journal-text', label: 'Daily Expense', href: '/reports/daily-expense' },
    ]
  },
  { type: 'heading', label: 'Security' },
  { icon: 'bi-shield-lock', label: 'Page Access', href: '/manage-page-access' },
  { type: 'heading', label: 'More' },
  { icon: 'bi-clock-history', label: 'Order History', href: '/orders' },
];

function NavItem({ item, collapsed, pathname }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (item.children) {
      const hasActive = item.children.some(c => pathname === c.href || pathname.startsWith(c.href + '/'));
      if (hasActive) setOpen(true);
    }
  }, [pathname, item.children]);

  if (item.type === 'heading') {
    return <div className="sidebar-heading">{item.label}</div>;
  }

  if (item.children) {
    const isChildActive = item.children.some(c => pathname === c.href);
    return (
      <div className="nav-group">
        <a
          className={`sidebar-link ${isChildActive ? 'active' : ''}`}
          style={{ cursor: 'pointer', justifyContent: 'space-between' }}
          onClick={() => setOpen(!open)}
        >
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <i className={`bi ${item.icon}`}></i>
            <span className="link-text">{item.label}</span>
          </span>
          {!collapsed && <i className={`bi bi-chevron-${open ? 'up' : 'down'} nav-chevron`} style={{ fontSize: '0.75rem' }}></i>}
        </a>
        <div className={`submenu-wrapper ${open ? 'open' : ''}`}>
          <div className="submenu">
            <div className="submenu-content">
              {item.children.map(child => (
                <Link key={child.href} href={child.href} className={`sidebar-link submenu-link ${pathname === child.href ? 'active' : ''}`}>
                  <i className={`bi ${child.icon}`}></i>
                  <span className="link-text">{child.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
  return (
    <Link href={item.href} className={`sidebar-link ${isActive ? 'active' : ''}`}>
      <i className={`bi ${item.icon}`}></i>
      <span className="link-text">{item.label}</span>
    </Link>
  );
}

function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { auth } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Logged out');
    router.push('/login');
  };

  const isAdmin = auth.role === 'ROLE_ADMIN';

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <img src="/logo.jpg" alt="Syndicate Printers Logo" className="sidebar-logo" style={{ maxHeight: '42px', borderRadius: '6px' }} />
        </div>
        <button className="hamburger-btn" onClick={() => setCollapsed(!collapsed)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#002142" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <button className="mobile-close-btn" onClick={() => setMobileOpen(false)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <nav className="sidebar-menu" onClick={(e) => { if (e.target.closest('a')) setMobileOpen(false); }}>
        {NAV_ITEMS.map((item, idx) => (
          <NavItem key={idx} item={item} collapsed={collapsed} pathname={pathname} />
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link className={`sidebar-link ${pathname === '/settings' ? 'active' : ''}`} href="/settings" title="Settings">
          <i className="bi bi-gear"></i>
          <span className="link-text">Settings</span>
        </Link>

        <div className="sidebar-profile" onClick={() => setShowLogout(!showLogout)} title="User Profile" style={{ cursor: 'pointer' }}>
          <div className="profile-info">
            <i className="bi bi-person-circle profile-icon"></i>
            <div className="profile-details link-text">
              <span className="profile-name">{isAdmin ? 'Administrator' : (auth.user?.username || 'Employee')}</span>
              <span className="profile-role">{isAdmin ? 'Admin' : 'User'}</span>
            </div>
          </div>
          <i className={`bi bi-chevron-${showLogout ? 'up' : 'down'} profile-toggle link-text`}></i>
        </div>

        {showLogout && (
          <div className="sidebar-link logout-btn" onClick={handleLogout} title="Logout" style={{ cursor: 'pointer' }}>
            <i className="bi bi-box-arrow-right"></i>
            <span className="link-text">Logout</span>
          </div>
        )}
      </div>
    </aside>
  );
}

function MobileTopbar({ onMenuOpen, auth }) {
  const isAdmin = auth.role === 'ROLE_ADMIN';
  return (
    <div className="mobile-topbar">
      <div className="mobile-topbar-left">
        <button className="mobile-hamburger-btn" onClick={onMenuOpen} aria-label="Toggle Navigation">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#002142" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <img src="/logo.jpg" alt="Logo" className="mobile-logo" style={{ height: '32px', borderRadius: '4px' }} />
      </div>
      <div className="mobile-topbar-right">
        <span className="mobile-user-title">{isAdmin ? 'Admin' : 'User'}</span>
        <i className="bi bi-person-circle mobile-user-icon" style={{ fontSize: '1.2rem', color: '#e64051' }}></i>
      </div>
    </div>
  );
}

function LayoutInner({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { auth } = useApp();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (auth.loading) {
    return (
      <div
        className="loading-overlay"
        style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        suppressHydrationWarning
      >
        <div className="spinner-border text-primary" role="status" suppressHydrationWarning>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Toaster position="top-right" />
      <MobileTopbar onMenuOpen={() => setMobileOpen(true)} auth={auth} />
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)}></div>}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default function AppLayout({ children }) {
  return (
    <AppContextProvider>
      <LayoutInner>{children}</LayoutInner>
    </AppContextProvider>
  );
}
