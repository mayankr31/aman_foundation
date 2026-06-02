'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import '../globals_auth.css';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terms, setTerms] = useState(false);

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Field errors
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [termsError, setTermsError] = useState('');
  const [formError, setFormError] = useState('');

  // Password strength
  const [strengthWidth, setStrengthWidth] = useState('0%');
  const [strengthColor, setStrengthColor] = useState('#ff5252');
  const [strengthText, setStrengthText] = useState('');

  // Success Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const toast = useToast();
  const router = useRouter();

  // Load displayable roles
  useEffect(() => {
    async function loadRoles() {
      try {
        const res = await fetch('/api/roles');
        const json = await res.json();
        if (res.ok && json.success) {
          const displayableRoles = json.data.filter(r => r.name !== 'ADMIN');
          setRoles(displayableRoles);
          if (displayableRoles.length > 0) {
            // Find "PROGRAM_MANAGER" and preselect it, or just preselect first
            const defaultRole = displayableRoles.find(r => r.name === 'PROGRAM_MANAGER');
            setRoleId(defaultRole?.id || displayableRoles[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load roles:", error);
      }
    }
    loadRoles();
  }, []);

  // Update password strength indicator
  useEffect(() => {
    if (!password) {
      setStrengthWidth('0%');
      setStrengthText('');
      return;
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 1) {
      setStrengthWidth('33%');
      setStrengthColor('#ff5252');
      setStrengthText('Weak');
    } else if (score === 2 || score === 3) {
      setStrengthWidth('66%');
      setStrengthColor('#ffa726');
      setStrengthText('Medium');
    } else {
      setStrengthWidth('100%');
      setStrengthColor('#1a7a5e');
      setStrengthText('Strong');
    }
  }, [password]);

  const validate = () => {
    let isValid = true;
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setRoleError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setTermsError('');
    setFormError('');

    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      isValid = false;
    }
    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      isValid = false;
    }
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }
    if (!roleId) {
      setRoleError('Department / Program is required');
      isValid = false;
    }
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      isValid = false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }
    if (!terms) {
      setTermsError('You must agree to the terms');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          roleId,
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register account');
      }

      toast.success('Registration request submitted!');
      setShowSuccessModal(true);
    } catch (err) {
      setFormError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-body w-full min-h-screen font-sans">
      <div className="split-layout register-layout">
        
        {/* LEFT PANEL */}
        <div className="brand-panel">
          <div className="brand-panel__inner">
            <div className="brand-logo">
              <div className="logo-icon">
                <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6 shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <rect width="28" height="28" rx="8" fill="white" fillOpacity="0.15"/>
                  <path d="M14 6L20 10.5V17.5L14 22L8 17.5V10.5L14 6Z" stroke="white" stroke-width="1.8" fill="none"/>
                  <circle cx="14" cy="14" r="3" fill="white"/>
                </svg>
              </div>
              <div>
                <div className="brand-name">Aman Foundation</div>
                <div className="brand-subtitle">Impact Portal</div>
              </div>
            </div>

            <div className="brand-hero">
              <h1 className="brand-headline">Join the<br/>Impact Network.</h1>
              <p className="brand-desc">Create your account to collaborate on programs and track outcomes in real time.</p>
            </div>

            {/* Stepper Timeline */}
            <div className="onboard-steps">
              <div className="step active">
                <div className="step-dot">1</div>
                <div>
                  <div className="step-title">Create your account</div>
                  <div className="step-desc">Fill in your details below</div>
                </div>
              </div>
              <div className="step-connector"></div>
              <div className="step">
                <div className="step-dot">2</div>
                <div>
                  <div className="step-title">Admin approval</div>
                  <div className="step-desc">Your request is reviewed</div>
                </div>
              </div>
              <div className="step-connector"></div>
              <div className="step">
                <div className="step-dot">3</div>
                <div>
                  <div className="step-title">Access granted</div>
                  <div className="step-desc">Start tracking impact</div>
                </div>
              </div>
            </div>

            <div className="brand-panel__decoration"></div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="form-panel">
          <div className="form-panel__inner">
            <div className="form-header">
              <h2 className="form-title">Create account</h2>
              <p className="form-subtitle">Register for access to the Impact Portal</p>
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

            <form className="auth-form" onSubmit={handleRegister} noValidate>
              
              {/* Name Row */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                        <circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.4"/>
                        <path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      id="firstName"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      style={{ borderColor: firstNameError ? '#ff5252' : '' }}
                    />
                    {firstNameError && <span className="input-error-icon !flex">!</span>}
                  </div>
                  <span className="field-error">{firstNameError}</span>
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                        <circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.4"/>
                        <path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      id="lastName"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      style={{ borderColor: lastNameError ? '#ff5252' : '' }}
                    />
                    {lastNameError && <span className="input-error-icon !flex">!</span>}
                  </div>
                  <span className="field-error">{lastNameError}</span>
                </div>
              </div>

              {/* Email Address */}
              <div className="form-group">
                <label htmlFor="regEmail">Work Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                      <path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h12a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5v-9Z" stroke="currentColor" stroke-width="1.4"/>
                      <path d="M2.5 6l7.1 4.7a.8.8 0 0 0 .8 0L17.5 6" stroke="currentColor" stroke-width="1.4"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    id="regEmail"
                    placeholder="you@amanfoundation.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ borderColor: emailError ? '#ff5252' : '' }}
                  />
                  {emailError && <span className="input-error-icon !flex">!</span>}
                </div>
                <span className="field-error">{emailError}</span>
              </div>

              {/* Role / Department Dynamic Selection */}
              <div className="form-group">
                <label htmlFor="department">Department / Role</label>
                <div className="input-wrapper select-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                      <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
                      <path d="M7 9h6M7 12h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                    </svg>
                  </span>
                  <select
                    id="department"
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    style={{ borderColor: roleError ? '#ff5252' : '' }}
                  >
                    <option value="" disabled>Select your role</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  <span className="select-arrow">
                    <svg viewBox="0 0 12 8" className="w-3 h-3" fill="none">
                      <path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                  </span>
                </div>
                <span className="field-error">{roleError}</span>
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="regPassword">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                      <rect x="4" y="9" width="12" height="8" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
                      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke="currentColor" stroke-width="1.4"/>
                      <circle cx="10" cy="13.5" r="1.2" fill="currentColor"/>
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="regPassword"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                        <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" stroke="currentColor" stroke-width="1.4"/>
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.4"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                        <path d="M3 3l14 14M8.5 8.6A2.5 2.5 0 0 0 12.4 12.4M6.2 6.3C4.1 7.5 2.5 10 2.5 10s3 5.5 7.5 5.5c1.4 0 2.7-.4 3.8-1.1M10 4.5c4.1.2 7 5.5 7 5.5s-.7 1.3-2 2.7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Strength Fill Meter */}
                {password && (
                  <div className="password-strength">
                    <div className="strength-track">
                      <div
                        className="strength-fill"
                        style={{ width: strengthWidth, backgroundColor: strengthColor }}
                      ></div>
                    </div>
                    <span className="strength-label" style={{ color: strengthColor }}>{strengthText}</span>
                  </div>
                )}
                
                <span className="field-error">{passwordError}</span>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                      <rect x="4" y="9" width="12" height="8" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
                      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke="currentColor" stroke-width="1.4"/>
                      <circle cx="10" cy="13.5" r="1.2" fill="currentColor"/>
                    </svg>
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ borderColor: confirmPasswordError ? '#ff5252' : '' }}
                  />
                  <button
                    type="button"
                    className="toggle-password animate-none"
                    onClick={() => setShowConfirmPassword(p => !p)}
                    aria-label="Toggle password visibility"
                  >
                    {!showConfirmPassword ? (
                      <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                        <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" stroke="currentColor" stroke-width="1.4"/>
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.4"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                        <path d="M3 3l14 14M8.5 8.6A2.5 2.5 0 0 0 12.4 12.4M6.2 6.3C4.1 7.5 2.5 10 2.5 10s3 5.5 7.5 5.5c1.4 0 2.7-.4 3.8-1.1M10 4.5c4.1.2 7 5.5 7 5.5s-.7 1.3-2 2.7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                      </svg>
                    )}
                  </button>
                </div>
                <span className="field-error">{confirmPasswordError}</span>
              </div>

              {/* Options */}
              <div className="form-options !flex-col !items-start">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                    name="terms"
                  />
                  <span className="checkbox-custom"></span>
                  I agree to the <a href="#">Terms of Use</a> and <a href="#">Privacy Policy</a>
                </label>
                <span className="field-error">{termsError}</span>
              </div>

              {/* Submit */}
              <button type="submit" className="btn-primary" disabled={loading} id="registerBtn">
                <span className="btn-text" style={{ display: loading ? 'none' : 'inline' }}>Create Account</span>
                {loading && <span className="btn-spinner !block" aria-hidden="true"></span>}
              </button>

              <div className="form-divider"><span>Already have an account?</span></div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => router.push('/login')}
              >
                Sign in instead
              </button>
            </form>

            <p className="form-footer">
              Access is subject to admin approval. Questions? <a href="#">Contact support</a>.
            </p>
          </div>
        </div>

      </div>

      {/* Success Modal Backdrop Overlay */}
      <div className={`modal-overlay ${showSuccessModal ? 'open' : ''}`} id="successModal">
        <div className="modal-card">
          <div className="modal-icon">
            <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
              <circle cx="24" cy="24" r="22" stroke="#1a7a5e" stroke-width="2"/>
              <path d="M14 24l7 7 13-14" stroke="#1a7a5e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 className="modal-title">Request Submitted!</h3>
          <p className="modal-desc">Your account request has been sent to the admin for approval. You'll receive an email once access is granted.</p>
          <button className="btn-primary" onClick={() => router.push('/login')}>Back to Sign In</button>
        </div>
      </div>
    </div>
  );
}
