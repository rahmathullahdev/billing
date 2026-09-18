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
      {/* Animated Background */}
      <div className="login-bg-animation">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>

      <div className="login-card">
        {/* Left Side: Form */}
        <div className="login-form-side">
          {/* Header */}
          <div className="login-header">
            <div className="brand-icon">
              <Image
                src="/logo.jpg"
                alt="Syndicate Prints Logo"
                width={48}
                height={48}
                style={{ objectFit: 'contain', margin: '0 auto', display: 'block' }}
                priority
              />
            </div>
            <h1 className="brand-title">Syndicate Prints</h1>
            <p className="brand-subtitle">Professional Printing Solutions</p>
          </div>

          {/* Toggle Admin / Employee */}
          <div className="login-toggle-container">
            <div className={`toggle-slider ${loginType === 'employee' ? 'right' : ''}`}></div>
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
                  <i className="bi bi-envelope"></i> Email Address
                </label>
                <div className="input-wrapper">
                  <input type="text" name="email" id="email" placeholder="Enter your email" className="form-input" onChange={onChange} value={data.email} required />
                  <div className="input-icon"><i className="bi bi-person-circle"></i></div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <i className="bi bi-lock"></i> Password
                </label>
                <div className="input-wrapper">
                  <input type={showPassword ? 'text' : 'password'} name="password" id="password" placeholder="Enter your password" className="form-input" onChange={onChange} value={data.password} required />
                  <div className="input-icon" style={{ cursor: 'pointer', pointerEvents: 'auto' }} onClick={() => setShowPassword(!showPassword)}>
                    <i className={showPassword ? 'bi bi-eye' : 'bi bi-eye-slash'}></i>
                  </div>
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
          </div>
        </div>

        {/* Right Side: Image */}
        <div className="login-image-side" style={{ backgroundColor: '#f9f9f9' }}>
          <Image
            src="/side-image.jpeg"
            alt="Printing Shop POS Illustration"
            fill
            sizes="(max-width: 800px) 0vw, 50vw"
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
      </div>
    </div>
  );
}
