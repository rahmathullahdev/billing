'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('admin');
  const [data, setData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="login-card">
        {/* Left Side: Form */}
        <div className="login-form-side">
          {/* Header */}
          <div className="login-header">
            <div className="brand-icon">
              <Image
                src="/logo.jpg"
                alt="Syndicate Prints Logo"
                width={56}
                height={56}
                style={{ objectFit: 'contain', margin: '0 auto', display: 'block' }}
                priority
              />
            </div>
            <h1 className="brand-title">SYNDICATE PRINTS</h1>
            <p className="brand-subtitle">Royapettah &bull; Professional Printing Solutions</p>
          </div>

          {/* Toggle Admin / Employee */}
          <div className="login-toggle-container">
            <button
              type="button"
              className={`toggle-btn ${loginType === 'admin' ? 'active' : ''}`}
              onClick={() => setLoginType('admin')}
            >
              <i className="bi bi-shield-lock"></i>
              <span>Admin</span>
            </button>
            <button
              type="button"
              className={`toggle-btn ${loginType === 'employee' ? 'active' : ''}`}
              onClick={() => setLoginType('employee')}
            >
              <i className="bi bi-person-badge"></i>
              <span>Employee</span>
            </button>
          </div>

          {/* Form */}
          <div className="login-form-container">
            <div className="form-header">
              <h2>{loginType === 'admin' ? 'Admin Portal' : 'Employee Access'}</h2>
              <p>Enter your credentials to access the billing system</p>
            </div>

            <form onSubmit={onSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">
                  <span><i className="bi bi-envelope"></i> Email Address</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="email"
                    id="email"
                    placeholder="name@syndicateprints.com"
                    className="form-input"
                    onChange={onChange}
                    value={data.email}
                    required
                  />
                  <div className="input-icon">
                    <i className="bi bi-person"></i>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <span><i className="bi bi-key"></i> Password</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    id="password"
                    placeholder="Enter your password"
                    className="form-input"
                    onChange={onChange}
                    value={data.password}
                    required
                  />
                  <div
                    className="input-icon"
                    style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={showPassword ? 'bi bi-eye' : 'bi bi-eye-slash'}></i>
                  </div>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot-password">Forgot Password?</a>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? (
                  <><i className="bi bi-arrow-repeat rotating"></i> Signing In...</>
                ) : (
                  <><i className="bi bi-box-arrow-in-right"></i> Sign In</>
                )}
              </button>
            </form>
          </div>

          <div className="login-footer-note">
            <p>&copy; {new Date().getFullYear()} Syndicate Prints &bull; Billing & POS System</p>
          </div>
        </div>

        {/* Right Side: Image Showcase */}
        <div className="login-image-side">
          <Image
            src="/side-image.png"
            alt="Syndicate Prints POS Dashboard"
            fill
            sizes="(max-width: 850px) 0vw, 50vw"
            style={{ objectFit: 'contain', objectPosition: 'center' }}
            priority
          />
        </div>
      </div>
    </div>
  );
}
