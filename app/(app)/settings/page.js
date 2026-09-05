'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    shopName: 'SYNDICATE PRINTERS',
    addressLine1: 'BHARATHY SALAI, OPP JAMBAZAR POLICE STATION,',
    addressLine2: 'ROYAPETTAH, CHENNAI - 14',
    phone: '+91 9840031990',
    gstin: '33ALSPS7215E1ZW',
    billPrefix: 'BILL-',
    gstBillPrefix: 'GST-'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.data) setSettings(prev => ({ ...prev, ...d.data }));
    }).catch(e => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        toast.success('Settings saved successfully!');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (e) {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="machine-banner text-center text-white mb-3 p-4 rounded shadow-sm" style={{ background: 'linear-gradient(135deg, #002142, #475569)' }}>
        <h4 className="fw-bold mb-0 text-uppercase">System Settings</h4>
        <p className="mb-0 text-white-50 small mt-1">Store configuration, invoice branding & prefixes</p>
      </div>

      <div className="bg-white p-4 rounded shadow-sm" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSave}>
          <div className="form-group my-3">
            <label className="fw-bold">Shop Name</label>
            <input type="text" className="form-control" value={settings.shopName} onChange={e => setSettings({ ...settings, shopName: e.target.value })} required />
          </div>
          <div className="form-group my-3">
            <label className="fw-bold">Address Line 1</label>
            <input type="text" className="form-control" value={settings.addressLine1} onChange={e => setSettings({ ...settings, addressLine1: e.target.value })} />
          </div>
          <div className="form-group my-3">
            <label className="fw-bold">Address Line 2</label>
            <input type="text" className="form-control" value={settings.addressLine2} onChange={e => setSettings({ ...settings, addressLine2: e.target.value })} />
          </div>
          <div className="form-group my-3">
            <label className="fw-bold">Phone Number</label>
            <input type="text" className="form-control" value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} />
          </div>
          <div className="form-group my-3">
            <label className="fw-bold">Shop GSTIN</label>
            <input type="text" className="form-control" value={settings.gstin} onChange={e => setSettings({ ...settings, gstin: e.target.value })} />
          </div>
          <div className="form-group my-3">
            <label className="fw-bold">Default Non-GST Bill Prefix</label>
            <input type="text" className="form-control" value={settings.billPrefix} onChange={e => setSettings({ ...settings, billPrefix: e.target.value })} />
          </div>

          <div className="d-flex justify-content-end mt-4">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
