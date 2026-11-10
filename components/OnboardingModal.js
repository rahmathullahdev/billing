'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'onboardingComplete';

export default function OnboardingModal({ auth }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    shopName: '',
    phone: '',
    gstNumber: '',
    address: '',
    city: '',
  });

  const canManage = auth?.role === 'ROLE_ADMIN' || auth?.role === 'ROLE_MANAGER';

  useEffect(() => {
    if (!auth?.user || !canManage) return undefined;
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'true') return undefined;
    } catch {
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const json = await res.json();
          const data = json?.data;
          if (data?.businessInfo?.shopName) {
            localStorage.setItem(STORAGE_KEY, 'true');
            return;
          }
          if (data?.businessInfo) {
            setForm((prev) => ({
              ...prev,
              ...data.businessInfo,
              shopName: data.shopName || data.businessInfo.shopName || '',
              phone: data.phone || data.businessInfo.phone || '',
              gstNumber: data.gstin || data.businessInfo.gstNumber || '',
            }));
          }
        }
      } catch {
        // Offline or settings unavailable; still offer the capture step.
      }
      if (!cancelled) setOpen(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [auth?.user, canManage]);

  const complete = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore storage failures
    }
    setOpen(false);
  };

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.shopName.trim()) {
      toast.error('Business name is required');
      return;
    }
    setSaving(true);
    try {
      try {
        localStorage.setItem('businessInfo', JSON.stringify(form));
      } catch {
        // ignore storage failures
      }
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessInfo: form,
          shopName: form.shopName,
          phone: form.phone,
          gstin: form.gstNumber,
        }),
      });
      if (!res.ok) throw new Error('sync failed');
      toast.success('Business profile saved');
    } catch {
      toast.error('Saved on this device — cloud sync failed');
    } finally {
      setSaving(false);
      complete();
    }
  };

  if (!open) return null;

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="Welcome setup">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="onboarding-logo">
            <i className="bi bi-stars" aria-hidden="true"></i>
          </div>
          <div>
            <h3>Welcome to your billing workspace</h3>
            <p>Add a few business details so invoices and receipts are ready to share.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">BUSINESS NAME *</label>
              <input
                type="text"
                className="form-control"
                value={form.shopName}
                onChange={(e) => update('shopName', e.target.value)}
                placeholder="Syndicate Printers"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">PHONE</label>
              <input
                type="text"
                className="form-control"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">GSTIN</label>
              <input
                type="text"
                className="form-control"
                value={form.gstNumber}
                onChange={(e) => update('gstNumber', e.target.value)}
                placeholder="22AAAAA0000A1Z5"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">CITY</label>
              <input
                type="text"
                className="form-control"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold small text-muted">ADDRESS</label>
              <input
                type="text"
                className="form-control"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Street, area, landmark"
              />
            </div>
          </div>

          <div className="onboarding-footer">
            <button type="button" className="btn btn-light border fw-semibold" onClick={complete} disabled={saving}>
              Skip for now
            </button>
            <button type="submit" className="btn btn-primary fw-semibold" disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> : null}
              Save & continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
