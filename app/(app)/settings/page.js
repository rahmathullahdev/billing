'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './settings.css';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Admin Profile State
  const [adminProfile, setAdminProfile] = useState({
    name: '',
    email: '',
    role: 'ROLE_ADMIN',
    password: '',
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Business Info State
  const [businessInfo, setBusinessInfo] = useState({
    shopName: 'SYNDICATE PRINTERS',
    address: 'BHARATHY SALAI, OPP JAMBAZAR POLICE STATION,',
    city: 'ROYAPETTAH, CHENNAI',
    state: 'TAMIL NADU',
    pincode: '600014',
    phone: '+91 9840031990',
    email: 'info@syndicateprinters.com',
    gstNumber: '33ALSPS7215E1ZW',
    billPrefix: 'BILL-',
    logo: null,
  });

  // Payment Configuration State
  const [paymentConfig, setPaymentConfig] = useState({
    upiId: '',
    upiName: '',
    qrCode: null,
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    branch: '',
  });

  // System Preferences State
  const [systemPrefs, setSystemPrefs] = useState({
    currency: 'INR',
    taxRate: '18',
    receiptFooter: 'Thank you for your business!',
    enableNotifications: true,
    enableEmailReceipts: false,
    enableSMSReceipts: false,
  });

  // Shortcut Configurations State
  const defaultShortcuts = [
    {
      id: 'non_gst_bill',
      action: 'Save & Print Non-GST Bill',
      description: "Sets tax to 0%, appends '-E' suffix to bill number, saves bill and triggers auto-print",
      keys: 'Enter',
      category: 'Bill Creation',
      enabled: true,
    },
    {
      id: 'gst_bill',
      action: 'Save & Print GST Bill',
      description: "Sets tax to 18%, removes '-E' suffix from bill number, saves bill and triggers auto-print",
      keys: 'Ctrl + Enter',
      category: 'Bill Creation',
      enabled: true,
    },
    {
      id: 'add_particular_item',
      action: 'Add Particular Item',
      description: 'Fetches item details and adds a row when typing Particular ID and pressing Enter',
      keys: 'Enter',
      category: 'Bill Creation',
      enabled: true,
    },
    {
      id: 'quick_save_bill',
      action: 'Quick Save Bill',
      description: 'Saves the current bill draft from the creation form',
      keys: 'Ctrl + S',
      category: 'Bill Creation',
      enabled: true,
    },
    {
      id: 'print_receipt',
      action: 'Print Bill Receipt',
      description: 'Opens print receipt dialog for active bill or after saving',
      keys: 'Ctrl + P',
      category: 'Receipts & Printing',
      enabled: true,
    },
    {
      id: 'close_modal',
      action: 'Close Popups & Modals',
      description: 'Dismisses active modal dialogs, credit popups, and dropdown menus',
      keys: 'Escape',
      category: 'Navigation & Modals',
      enabled: true,
    },
  ];

  const [shortcutConfig, setShortcutConfig] = useState(defaultShortcuts);

  // Load Initial Settings & Admins
  useEffect(() => {
    loadSettings();
    loadUsers();
  }, []);

  const loadSettings = async () => {
    // 1. Try localStorage
    const savedBusiness = localStorage.getItem('businessInfo');
    const savedPayment = localStorage.getItem('paymentConfig');
    const savedPrefs = localStorage.getItem('systemPrefs');
    const savedShortcuts = localStorage.getItem('shortcutConfig');

    if (savedBusiness) try { setBusinessInfo(JSON.parse(savedBusiness)); } catch (e) {}
    if (savedPayment) try { setPaymentConfig(JSON.parse(savedPayment)); } catch (e) {}
    if (savedPrefs) try { setSystemPrefs(JSON.parse(savedPrefs)); } catch (e) {}
    if (savedShortcuts) try { setShortcutConfig(JSON.parse(savedShortcuts)); } catch (e) {}

    // 2. Fetch API settings to sync from backend/Sanity
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json?.data) {
        const d = json.data;
        setBusinessInfo(prev => ({ ...prev, ...d.businessInfo, shopName: d.shopName || prev.shopName, phone: d.phone || prev.phone, gstNumber: d.gstin || prev.gstNumber }));
        if (d.paymentConfig) setPaymentConfig(prev => ({ ...prev, ...d.paymentConfig }));
        if (d.systemPrefs) setSystemPrefs(prev => ({ ...prev, ...d.systemPrefs }));
        if (d.shortcutConfig) setShortcutConfig(d.shortcutConfig);
      }
    } catch (e) {
      console.log('API settings fetch note:', e);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json?.data && Array.isArray(json.data)) {
        setUsers(json.data.filter(u => u.role === 'ROLE_ADMIN' || u.role === 'ADMIN'));
      }
    } catch (e) {
      console.log('Load users error:', e);
    }
  };

  // Sync back to API & localStorage
  const saveToBackend = async (payload) => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error('Backend save error:', e);
    }
  };

  // Handlers for Admin Profile
  const handleAdminProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (selectedUser) {
        const res = await fetch(`/api/users/${selectedUser._id || selectedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: adminProfile.name,
            email: adminProfile.email,
            password: adminProfile.password || undefined,
            role: 'ROLE_ADMIN',
          }),
        });
        if (res.ok) {
          toast.success('Admin updated successfully!');
          handleCancelEdit();
          loadUsers();
        } else {
          toast.error('Failed to update admin');
        }
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: adminProfile.name,
            email: adminProfile.email,
            password: adminProfile.password,
            role: 'ROLE_ADMIN',
          }),
        });
        if (res.ok) {
          toast.success('Admin Profile created successfully!');
          setAdminProfile({ name: '', email: '', role: 'ROLE_ADMIN', password: '' });
          loadUsers();
        } else {
          toast.error('Failed to create admin');
        }
      }
    } catch (err) {
      toast.error('Error updating admin profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setAdminProfile({
      name: user.username || user.name || '',
      email: user.email || '',
      role: 'ROLE_ADMIN',
      password: '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Admin deleted');
        loadUsers();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (e) {
      toast.error('Error deleting user');
    }
  };

  const handleCancelEdit = () => {
    setSelectedUser(null);
    setAdminProfile({ name: '', email: '', role: 'ROLE_ADMIN', password: '' });
  };

  // Handlers for Business Info
  const handleBusinessInfoUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    localStorage.setItem('businessInfo', JSON.stringify(businessInfo));
    await saveToBackend({ businessInfo, shopName: businessInfo.shopName, phone: businessInfo.phone, gstin: businessInfo.gstNumber });
    setLoading(false);
    toast.success('Business information updated successfully!');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusinessInfo(prev => ({ ...prev, logo: reader.result }));
        toast.success('Logo uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handlers for Payment Config
  const handlePaymentConfigUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    localStorage.setItem('paymentConfig', JSON.stringify(paymentConfig));
    await saveToBackend({ paymentConfig });
    setLoading(false);
    toast.success('Payment configuration updated successfully!');
  };

  const handleQRCodeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentConfig(prev => ({ ...prev, qrCode: reader.result }));
        toast.success('QR Code uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handlers for System Preferences
  const handleSystemPrefsUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    localStorage.setItem('systemPrefs', JSON.stringify(systemPrefs));
    await saveToBackend({ systemPrefs });
    setLoading(false);
    toast.success('System preferences updated successfully!');
  };

  // Handlers for Shortcut Config
  const handleShortcutToggle = (id) => {
    setShortcutConfig(prev => prev.map(item => item.id === id ? { ...item, enabled: !item.enabled } : item));
  };

  const handleShortcutKeyChange = (id, newKeys) => {
    setShortcutConfig(prev => prev.map(item => item.id === id ? { ...item, keys: newKeys } : item));
  };

  const handleSaveShortcuts = async (e) => {
    e.preventDefault();
    setLoading(true);
    localStorage.setItem('shortcutConfig', JSON.stringify(shortcutConfig));
    await saveToBackend({ shortcutConfig });
    setLoading(false);
    toast.success('Shortcut configurations updated successfully!');
  };

  const handleResetShortcuts = () => {
    setShortcutConfig(defaultShortcuts);
    localStorage.setItem('shortcutConfig', JSON.stringify(defaultShortcuts));
    saveToBackend({ shortcutConfig: defaultShortcuts });
    toast.success('Shortcuts reset to system defaults!');
  };

  const filteredUsers = users.filter(u =>
    (u.username || u.name || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  return (
    <div className="settings-container fade-in">
      {/* Header */}
      <div className="settings-header">
        <div className="header-content">
          <h1>
            <i className="bi bi-gear-fill"></i>
            SYSTEM SETTINGS
          </h1>
          <p>Store configuration, invoice branding & prefixes</p>
        </div>
      </div>

      <div className="settings-content">
        {/* Navigation Tabs */}
        <div className="settings-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="bi bi-person-circle"></i>
            <span>Admin Profile</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'business' ? 'active' : ''}`}
            onClick={() => setActiveTab('business')}
          >
            <i className="bi bi-shop"></i>
            <span>Business Info</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            <i className="bi bi-credit-card-2-front"></i>
            <span>Payment Config</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <i className="bi bi-sliders"></i>
            <span>System Preferences</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'shortcuts' ? 'active' : ''}`}
            onClick={() => setActiveTab('shortcuts')}
          >
            <i className="bi bi-command"></i>
            <span>Shortcut Config</span>
          </button>
        </div>

        {/* Panel Content */}
        <div className="settings-panel">
          {/* 1. Admin Profile Tab */}
          {activeTab === 'profile' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>
                  <i className="bi bi-person-fill"></i>
                  {selectedUser ? 'Edit User' : 'Admin Profile Settings'}
                </h2>
                <p>
                  {selectedUser
                    ? `Editing user: ${selectedUser.username || selectedUser.name}`
                    : 'Update your personal information and change password'}
                </p>
              </div>

              {selectedUser && (
                <div className="alert alert-info d-flex align-items-center justify-content-between mb-4 p-3 rounded" style={{ background: '#e0f2fe', border: '1px solid #7dd3fc' }}>
                  <span className="text-primary-emphasis">
                    <i className="bi bi-info-circle me-2"></i>
                    You are currently editing <strong>{selectedUser.username || selectedUser.name}</strong>'s profile
                  </span>
                  <button type="button" onClick={handleCancelEdit} className="btn btn-sm btn-outline-primary bg-white">
                    <i className="bi bi-x-circle me-1"></i> Cancel Edit
                  </button>
                </div>
              )}

              <form onSubmit={handleAdminProfileUpdate} className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <i className="bi bi-person"></i>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={adminProfile.name}
                      onChange={e => setAdminProfile({ ...adminProfile, name: e.target.value })}
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <i className="bi bi-envelope"></i>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={adminProfile.email}
                      onChange={e => setAdminProfile({ ...adminProfile, email: e.target.value })}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label>
                      <i className="bi bi-lock"></i>
                      Password
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={adminProfile.password}
                        onChange={e => setAdminProfile({ ...adminProfile, password: e.target.value })}
                        placeholder={selectedUser ? 'Leave blank to keep unchanged' : '******'}
                        required={!selectedUser}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(prev => !prev)}
                        tabIndex={-1}
                      >
                        <i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save" disabled={loading}>
                    {loading ? (
                      <>
                        <i className="bi bi-arrow-repeat rotating"></i> Updating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle"></i>
                        {selectedUser ? 'Update Admin' : 'Create Admin Profile'}
                      </>
                    )}
                  </button>
                  {selectedUser && (
                    <button type="button" onClick={handleCancelEdit} className="btn btn-secondary px-4 rounded-3 fw-bold">
                      <i className="bi bi-x-circle me-1"></i> Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Admin List */}
              <div className="users-list-container">
                <div className="search-box">
                  <div className="input-group">
                    <input
                      type="text"
                      placeholder="Search Admins by name or email..."
                      className="form-control"
                      value={userSearchTerm}
                      onChange={e => setUserSearchTerm(e.target.value)}
                    />
                    <span className="input-group-text bg-white">
                      <i className="bi bi-search text-muted"></i>
                    </span>
                  </div>
                </div>
                <div className="row g-3">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <div key={user._id || user.id} className="col-12">
                        <div className="user-card d-flex align-items-center justify-content-between">
                          <div>
                            <h5>{user.username || user.name}</h5>
                            <p>{user.email}</p>
                          </div>
                          <div className="action-buttons">
                            <button className="btn btn-sm btn-edit me-2" onClick={() => handleEditUser(user)}>
                              <i className="bi bi-pencil-fill me-1"></i> Edit
                            </button>
                            <button className="btn btn-sm btn-delete" onClick={() => handleDeleteUser(user._id || user.id)}>
                              <i className="bi bi-trash-fill me-1"></i> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-12 text-center py-4 text-muted">
                      <i className="bi bi-person-x fs-2 d-block mb-2"></i>
                      <p>No admins found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. Business Info Tab */}
          {activeTab === 'business' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>
                  <i className="bi bi-building"></i>
                  Business Information
                </h2>
                <p>Update your shop/business details and invoice branding</p>
              </div>

              <form onSubmit={handleBusinessInfoUpdate} className="settings-form">
                <div className="logo-upload-section">
                  <div className="logo-preview">
                    {businessInfo.logo ? (
                      <img src={businessInfo.logo} alt="Business Logo" />
                    ) : (
                      <div className="logo-placeholder">
                        <i className="bi bi-image"></i>
                        <span>No Logo</span>
                      </div>
                    )}
                  </div>
                  <div className="logo-upload-controls">
                    <label htmlFor="logo-upload" className="btn-upload">
                      <i className="bi bi-cloud-upload"></i>
                      Upload Logo
                    </label>
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                    {businessInfo.logo && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => setBusinessInfo(prev => ({ ...prev, logo: null }))}
                      >
                        <i className="bi bi-trash"></i>
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <i className="bi bi-shop"></i>
                      Shop / Business Name
                    </label>
                    <input
                      type="text"
                      value={businessInfo.shopName}
                      onChange={e => setBusinessInfo({ ...businessInfo, shopName: e.target.value })}
                      placeholder="Enter shop name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <i className="bi bi-phone"></i>
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={businessInfo.phone}
                      onChange={e => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                      placeholder="Enter contact number"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label>
                      <i className="bi bi-geo-alt"></i>
                      Address
                    </label>
                    <textarea
                      value={businessInfo.address}
                      onChange={e => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                      placeholder="Enter complete address"
                      rows="3"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <i className="bi bi-building"></i>
                      City
                    </label>
                    <input
                      type="text"
                      value={businessInfo.city}
                      onChange={e => setBusinessInfo({ ...businessInfo, city: e.target.value })}
                      placeholder="Enter city"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <i className="bi bi-map"></i>
                      State
                    </label>
                    <input
                      type="text"
                      value={businessInfo.state}
                      onChange={e => setBusinessInfo({ ...businessInfo, state: e.target.value })}
                      placeholder="Enter state"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <i className="bi bi-mailbox"></i>
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={businessInfo.pincode}
                      onChange={e => setBusinessInfo({ ...businessInfo, pincode: e.target.value })}
                      placeholder="Enter pincode"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <i className="bi bi-envelope"></i>
                      Business Email
                    </label>
                    <input
                      type="email"
                      value={businessInfo.email}
                      onChange={e => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                      placeholder="Enter business email"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <i className="bi bi-file-text"></i>
                      Shop GSTIN
                    </label>
                    <input
                      type="text"
                      value={businessInfo.gstNumber}
                      onChange={e => setBusinessInfo({ ...businessInfo, gstNumber: e.target.value })}
                      placeholder="Enter GST number"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <i className="bi bi-hash"></i>
                      Default Non-GST Bill Prefix
                    </label>
                    <input
                      type="text"
                      value={businessInfo.billPrefix}
                      onChange={e => setBusinessInfo({ ...businessInfo, billPrefix: e.target.value })}
                      placeholder="BILL-"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save" disabled={loading}>
                    {loading ? (
                      <>
                        <i className="bi bi-arrow-repeat rotating"></i> Updating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle"></i>
                        Update Business Info
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. Payment Configuration Tab */}
          {activeTab === 'payment' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>
                  <i className="bi bi-wallet2"></i>
                  Payment Configuration
                </h2>
                <p>Configure your UPI payment methods and bank details</p>
              </div>

              <form onSubmit={handlePaymentConfigUpdate} className="settings-form">
                <div className="payment-section">
                  <h3>
                    <i className="bi bi-phone"></i>
                    UPI Configuration
                  </h3>

                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <i className="bi bi-upc"></i>
                        UPI ID
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.upiId}
                        onChange={e => setPaymentConfig({ ...paymentConfig, upiId: e.target.value })}
                        placeholder="yourname@upi"
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <i className="bi bi-person"></i>
                        UPI Name
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.upiName}
                        onChange={e => setPaymentConfig({ ...paymentConfig, upiName: e.target.value })}
                        placeholder="Enter UPI registered name"
                      />
                    </div>
                  </div>

                  <div className="qr-upload-section">
                    <div className="qr-preview">
                      {paymentConfig.qrCode ? (
                        <img src={paymentConfig.qrCode} alt="UPI QR Code" />
                      ) : (
                        <div className="qr-placeholder">
                          <i className="bi bi-qr-code"></i>
                          <span>No QR Code</span>
                        </div>
                      )}
                    </div>
                    <div className="qr-upload-controls">
                      <label htmlFor="qr-upload" className="btn-upload">
                        <i className="bi bi-cloud-upload"></i>
                        Upload QR Code
                      </label>
                      <input
                        type="file"
                        id="qr-upload"
                        accept="image/*"
                        onChange={handleQRCodeUpload}
                        style={{ display: 'none' }}
                      />
                      {paymentConfig.qrCode && (
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => setPaymentConfig(prev => ({ ...prev, qrCode: null }))}
                        >
                          <i className="bi bi-trash"></i>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="payment-section">
                  <h3>
                    <i className="bi bi-bank"></i>
                    Bank Details
                  </h3>

                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <i className="bi bi-building"></i>
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.bankName}
                        onChange={e => setPaymentConfig({ ...paymentConfig, bankName: e.target.value })}
                        placeholder="Enter bank name"
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <i className="bi bi-person-badge"></i>
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.accountHolderName}
                        onChange={e => setPaymentConfig({ ...paymentConfig, accountHolderName: e.target.value })}
                        placeholder="Enter account holder name"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <i className="bi bi-hash"></i>
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.accountNumber}
                        onChange={e => setPaymentConfig({ ...paymentConfig, accountNumber: e.target.value })}
                        placeholder="Enter account number"
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <i className="bi bi-code-square"></i>
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.ifscCode}
                        onChange={e => setPaymentConfig({ ...paymentConfig, ifscCode: e.target.value })}
                        placeholder="Enter IFSC code"
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <i className="bi bi-geo-alt"></i>
                        Branch
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.branch}
                        onChange={e => setPaymentConfig({ ...paymentConfig, branch: e.target.value })}
                        placeholder="Enter branch name"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save" disabled={loading}>
                    {loading ? (
                      <>
                        <i className="bi bi-arrow-repeat rotating"></i> Updating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle"></i>
                        Update Payment Config
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 4. System Preferences Tab */}
          {activeTab === 'system' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>
                  <i className="bi bi-toggles"></i>
                  System Preferences
                </h2>
                <p>Configure default tax rates, receipt branding & system preferences</p>
              </div>

              <form onSubmit={handleSystemPrefsUpdate} className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <i className="bi bi-currency-rupee"></i>
                      Currency
                    </label>
                    <select
                      value={systemPrefs.currency}
                      onChange={e => setSystemPrefs({ ...systemPrefs, currency: e.target.value })}
                    >
                      <option value="INR">INR - Indian Rupee (₹)</option>
                      <option value="USD">USD - US Dollar ($)</option>
                      <option value="EUR">EUR - Euro (€)</option>
                      <option value="GBP">GBP - British Pound (£)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      <i className="bi bi-percent"></i>
                      Default Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      value={systemPrefs.taxRate}
                      onChange={e => setSystemPrefs({ ...systemPrefs, taxRate: e.target.value })}
                      placeholder="18"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label>
                      <i className="bi bi-card-text"></i>
                      Receipt Footer Text
                    </label>
                    <textarea
                      value={systemPrefs.receiptFooter}
                      onChange={e => setSystemPrefs({ ...systemPrefs, receiptFooter: e.target.value })}
                      placeholder="Enter text to display at the bottom of printed invoices"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="divider">
                  <span>Notification Settings</span>
                </div>

                <div className="toggle-group">
                  <div className="toggle-item">
                    <div className="toggle-info">
                      <label>
                        <i className="bi bi-bell"></i>
                        Enable System Notifications
                      </label>
                      <span>Receive system and operational alerts</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={systemPrefs.enableNotifications}
                        onChange={e => setSystemPrefs({ ...systemPrefs, enableNotifications: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <label>
                        <i className="bi bi-envelope"></i>
                        Email Receipts
                      </label>
                      <span>Automatically send receipts via email to customers</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={systemPrefs.enableEmailReceipts}
                        onChange={e => setSystemPrefs({ ...systemPrefs, enableEmailReceipts: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <label>
                        <i className="bi bi-chat-dots"></i>
                        SMS Receipts
                      </label>
                      <span>Send billing receipt links via SMS</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={systemPrefs.enableSMSReceipts}
                        onChange={e => setSystemPrefs({ ...systemPrefs, enableSMSReceipts: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save" disabled={loading}>
                    {loading ? (
                      <>
                        <i className="bi bi-arrow-repeat rotating"></i> Updating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle"></i>
                        Update Preferences
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 5. Shortcut Configurations Tab */}
          {activeTab === 'shortcuts' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>
                  <i className="bi bi-command"></i>
                  Shortcut Configurations
                </h2>
                <p>View, configure, and toggle system keyboard shortcuts for fast billing operations</p>
              </div>

              <form onSubmit={handleSaveShortcuts} className="settings-form">
                <div className="shortcut-cards-container">
                  {shortcutConfig.map(sc => (
                    <div key={sc.id} className={`shortcut-card ${!sc.enabled ? 'disabled' : ''}`}>
                      <div className="shortcut-card-header">
                        <div className="shortcut-info">
                          <span className="shortcut-category-badge">{sc.category}</span>
                          <h4>{sc.action}</h4>
                          <p>{sc.description}</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={sc.enabled}
                            onChange={() => handleShortcutToggle(sc.id)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>

                      <div className="shortcut-card-body">
                        <div className="shortcut-key-display">
                          <label><i className="bi bi-keyboard me-1"></i> Shortcut Key</label>
                          <div className="key-input-wrapper">
                            <input
                              type="text"
                              value={sc.keys}
                              onChange={e => handleShortcutKeyChange(sc.id, e.target.value)}
                              placeholder="e.g. Ctrl + Enter"
                              className="shortcut-key-input"
                              disabled={!sc.enabled}
                            />
                            <div className="kbd-preview">
                              {sc.keys.split('+').map((k, i) => (
                                <span key={i}>
                                  <kbd className="kbd-badge">{k.trim()}</kbd>
                                  {i < sc.keys.split('+').length - 1 && <span className="kbd-plus">+</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="form-actions d-flex justify-content-between align-items-center">
                  <button
                    type="button"
                    onClick={handleResetShortcuts}
                    className="btn-reset-shortcuts"
                  >
                    <i className="bi bi-arrow-counterclockwise me-1"></i>
                    Reset Defaults
                  </button>

                  <button type="submit" className="btn-save" disabled={loading}>
                    {loading ? (
                      <>
                        <i className="bi bi-arrow-repeat rotating"></i> Updating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle"></i>
                        Save Shortcut Settings
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
