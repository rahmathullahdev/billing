'use client';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useApp } from '@/context/AppContext';

function makeCode(user) {
  const source = (user?.username || user?.email || 'syndicate').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `${source.slice(0, 6) || 'SYND'}${String((user?.username || 'x').length * 7 + 31).slice(-3)}`;
}

export default function ReferralPage() {
  const { auth } = useApp();
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const code = useMemo(() => makeCode(auth?.user), [auth?.user]);
  const referralUrl = useMemo(
    () => (origin ? `${origin}/login?ref=${code}` : `/login?ref=${code}`),
    [origin, code]
  );

  const copy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Join me on Syndicate Prints Billing: ${referralUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="referral-page fade-in">
      <div className="referral-hero">
        <span className="referral-pill">
          <i className="bi bi-gift" aria-hidden="true"></i> Referral Program
        </span>
        <h1>Invite a business. Earn rewards.</h1>
        <p>
          Share your referral link with another print shop. When they sign up and start billing,
          you both unlock account credits.
        </p>
      </div>

      <div className="referral-grid">
        <section className="referral-card referral-card-main">
          <h2>Your referral link</h2>
          <p className="text-muted small mb-3">
            Anyone who creates an account through this link is attributed to you.
          </p>

          <label className="form-label fw-semibold small text-muted">REFERRAL CODE</label>
          <div className="referral-code-row">
            <code className="referral-code">{code}</code>
            <button type="button" className="btn btn-sm btn-outline-dark fw-semibold" onClick={() => copy(code, 'Code')}>
              <i className="bi bi-clipboard me-1" aria-hidden="true"></i> Copy
            </button>
          </div>

          <label className="form-label fw-semibold small text-muted mt-3">REFERRAL LINK</label>
          <div className="referral-link-row">
            <input type="text" className="form-control" value={referralUrl} readOnly />
            <button type="button" className="btn btn-primary fw-semibold" onClick={() => copy(referralUrl, 'Link')}>
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>

          <div className="referral-share-row">
            <button type="button" className="btn btn-outline-success btn-sm fw-semibold" onClick={shareWhatsApp}>
              <i className="bi bi-whatsapp me-1" aria-hidden="true"></i> Share on WhatsApp
            </button>
            <a
              className="btn btn-outline-secondary btn-sm fw-semibold"
              href={`mailto:?subject=${encodeURIComponent('Try Syndicate Prints Billing')}&body=${encodeURIComponent(`Use my referral link: ${referralUrl}`)}`}
            >
              <i className="bi bi-envelope me-1" aria-hidden="true"></i> Email invite
            </a>
          </div>
        </section>

        <aside className="referral-card">
          <h2>Program snapshot</h2>
          <div className="referral-stats">
            <div className="referral-stat">
              <span className="referral-stat-value">0</span>
              <span className="referral-stat-label">Invites sent</span>
            </div>
            <div className="referral-stat">
              <span className="referral-stat-value">0</span>
              <span className="referral-stat-label">Sign-ups</span>
            </div>
            <div className="referral-stat">
              <span className="referral-stat-value">₹0</span>
              <span className="referral-stat-label">Credits earned</span>
            </div>
          </div>
          <ul className="referral-steps">
            <li><span>1</span> Share your unique link.</li>
            <li><span>2</span> They create a billing account.</li>
            <li><span>3</span> Credits land after their first invoice.</li>
          </ul>
          <p className="referral-note">
            Affiliate payouts and partner tiers are managed by your administrator. Contact support to
            apply for the affiliate program.
          </p>
        </aside>
      </div>
    </div>
  );
}
