'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('admin');
  const [data, setData] = useState({ email: '', password: '' });

  const onChange = (e) => setData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Email/Password Invalid');
        return;
      }
      toast.success('Login successful');
      router.push('/dashboard');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Toaster />
      {/* Animated Background */}
      <div className="login-bg-animation">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>

      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="brand-icon">
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #002142, #e64051)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 4px 15px rgba(0,33,66,0.3)' }}>
              <i className="bi bi-printer-fill" style={{ fontSize: '1.75rem', color: '#fff' }}></i>
            </div>
          </div>
          <h1 className="brand-title">Syndicate Prints</h1>
          <p className="brand-subtitle">Professional Printing Solutions</p>
        </div>

        {/* Toggle Admin / Employee */}
        <div className="login-toggle-container">
          <button type="button" className={`toggle-btn ${loginType === 'admin' ? 'active' : ''}`} onClick={() => setLoginType('admin')}>
            <i className="bi bi-person-badge"></i>
            <span>Admin</span>
          </button>
          <button type="button" className={`toggle-btn ${loginType === 'employee' ? 'active' : ''}`} onClick={() => setLoginType('employee')}>
            <i className="bi bi-person"></i>
            <span>Employee</span>
          </button>
        </div>

        {/* Form */}
        <div className="login-form-container">
          <div className="form-header">
            <h2>{loginType === 'admin' ? 'Admin Login' : 'Employee Login'}</h2>
            <p>Enter your credentials to continue</p>
          </div>

          <form onSubmit={onSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">
                <i className="bi bi-envelope"></i> Email Address or Username
              </label>
              <div className="input-wrapper">
                <input type="text" name="email" id="email" placeholder="Enter email or username (e.g. admin@syndicate.com)" className="form-input" onChange={onChange} value={data.email} required />
                <div className="input-icon"><i className="bi bi-person-circle"></i></div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <i className="bi bi-lock"></i> Password
              </label>
              <div className="input-wrapper">
                <input type="password" name="password" id="password" placeholder="Enter your password" className="form-input" onChange={onChange} value={data.password} required />
                <div className="input-icon"><i className="bi bi-shield-lock"></i></div>
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" /> <span>Remember me</span>
              </label>
              <a href="#" className="forgot-password">Forgot Password?</a>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <><i className="bi bi-arrow-repeat rotating"></i> Signing in...</>
              ) : (
                <><i className="bi bi-box-arrow-in-right"></i> Sign In</>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p className="info-text">
              <i className="bi bi-info-circle"></i>
              Default Admin Credentials: <strong>admin@syndicate.com</strong> / <strong>admin123</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
