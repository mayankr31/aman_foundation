'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useToast } from '@/context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import '../globals_auth.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const validate = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setFormError('');

    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      toast.success('Signed in successfully!');
      login(data.data.user, data.data.token);
    } catch (err) {
      setFormError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-body w-full min-h-screen font-sans">
      <div className="split-layout">
        
        {/* LEFT PANEL */}
        <div className="brand-panel">
          <div className="brand-panel__inner">
            <div className="brand-logo">
              <div className="logo-icon">
                <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6 shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <rect width="28" height="28" rx="8" fill="white" fillOpacity="0.15"/>
                  <path d="M14 6L20 10.5V17.5L14 22L8 17.5V10.5L14 6Z" stroke="white" strokeWidth="1.8" fill="none"/>
                  <circle cx="14" cy="14" r="3" fill="white"/>
                </svg>
              </div>
              <div>
                <div className="brand-name">Aman Foundation</div>
                <div className="brand-subtitle">Impact Portal</div>
              </div>
            </div>

            <div className="brand-hero">
              <h1 className="brand-headline">Measuring Impact,<br/>Driving Change.</h1>
              <p className="brand-desc">Access your real-time impact data across Education, Livelihood, and Disaster Relief programs.</p>
            </div>

            <div className="brand-panel__decoration"></div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="form-panel">
          <div className="form-panel__inner">
            <div className="form-header">
              <h2 className="form-title">Welcome back</h2>
              <p className="form-subtitle">Sign in to your Impact Portal account</p>
            </div>

            <AnimatePresence>
              {formError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold"
                >
                  {formError}
                </motion.div>
              )}
            </AnimatePresence>

            <form className="auth-form" onSubmit={handleLogin} noValidate>
              
              {/* Email Address */}
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                      <path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h12a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5v-9Z" stroke="currentColor" strokeWidth="1.4"/>
                      <path d="M2.5 6l7.1 4.7a.8.8 0 0 0 .8 0L17.5 6" stroke="currentColor" strokeWidth="1.4"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="you@amanfoundation.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    style={{ borderColor: emailError ? '#ff5252' : '' }}
                  />
                  {emailError && <span className="input-error-icon !flex">!</span>}
                </div>
                <span className="field-error">{emailError}</span>
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password">
                  Password
                  <a href="#" className="forgot-link">Forgot password?</a>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                      <rect x="4" y="9" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke="currentColor" strokeWidth="1.4"/>
                      <circle cx="10" cy="13.5" r="1.2" fill="currentColor"/>
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    style={{ borderColor: passwordError ? '#ff5252' : '' }}
                  />
                  <button
                    type="button"
                    className="toggle-password animate-none"
                    onClick={() => setShowPassword(p => !p)}
                    aria-label="Toggle password visibility"
                  >
                    {!showPassword ? (
                      <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                        <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" stroke="currentColor" strokeWidth="1.4"/>
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                        <path d="M3 3l14 14M8.5 8.6A2.5 2.5 0 0 0 12.4 12.4M6.2 6.3C4.1 7.5 2.5 10 2.5 10s3 5.5 7.5 5.5c1.4 0 2.7-.4 3.8-1.1M10 4.5c4.1.2 7 5.5 7 5.5s-.7 1.3-2 2.7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                      </svg>
                    )}
                  </button>
                </div>
                <span className="field-error">{passwordError}</span>
              </div>

              {/* Remember Me */}
              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    name="remember"
                  />
                  <span className="checkbox-custom"></span>
                  Keep me signed in
                </label>
              </div>

              {/* Submit */}
              <button type="submit" className="btn-primary" disabled={loading} id="loginBtn">
                <span className="btn-text" style={{ display: loading ? 'none' : 'inline' }}>Sign In</span>
                {loading && <span className="btn-spinner !block" aria-hidden="true"></span>}
              </button>

              <div className="form-divider"><span>or</span></div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => router.push('/register')}
              >
                Create a new account
              </button>
            </form>

            <p className="form-footer">
              Need access? Contact your <a href="#">system administrator</a>.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
