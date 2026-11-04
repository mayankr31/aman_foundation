"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { validatePassword } from "@/lib/validation";
import AuthPortalLayout from "@/components/auth/AuthPortalLayout";
import "../globals_auth.css";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const toast = useToast();

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setTokenError("No reset token provided. Please use the link from your email.");
      return;
    }

    let cancelled = false;

    async function validate() {
      try {
        const res = await fetch(
          `/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`
        );
        const data = await res.json();
        if (cancelled) return;
        if (data.valid) {
          setTokenValid(true);
        } else {
          setTokenError(data.error || "Invalid or expired reset link.");
        }
      } catch {
        if (!cancelled) {
          setTokenError("Failed to validate reset link. Please try again.");
        }
      } finally {
        if (!cancelled) setValidating(false);
      }
    }

    validate();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const passwordError = validatePassword(newPassword, { required: true });
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password-by-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      toast.success(data.message || "Password has been reset successfully.");
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <AuthPortalLayout>
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
          <span className="btn-spinner is-visible auth-spinner--dark"></span>
          <p className="form-subtitle mt-4">Validating reset link...</p>
        </div>
      </AuthPortalLayout>
    );
  }

  if (!tokenValid && !done) {
    return (
      <AuthPortalLayout>
        <div className="form-header">
          <h2 className="form-title">Invalid link</h2>
          <p className="form-subtitle">
            {tokenError || "This reset link is invalid or has expired."}
          </p>
        </div>
        <div className="auth-form">
          <Link href="/forgot-password" className="btn-primary">
            Request a new reset link
          </Link>
          <Link href="/login" className="btn-secondary text-center">
            Back to login
          </Link>
        </div>
      </AuthPortalLayout>
    );
  }

  if (done) {
    return (
      <AuthPortalLayout>
        <div className="form-header">
          <h2 className="form-title">Password reset</h2>
          <p className="form-subtitle">
            Your password has been reset successfully. You can now log in with your
            new password.
          </p>
        </div>
        <div className="auth-form">
          <Link href="/login" className="btn-primary">
            Go to login
          </Link>
        </div>
      </AuthPortalLayout>
    );
  }

  return (
    <AuthPortalLayout>
      <div className="form-header">
        <Link href="/login" className="forgot-link inline-flex mb-4">
          &larr; Back to login
        </Link>
        <h2 className="form-title">Reset password</h2>
        <p className="form-subtitle">Enter your new password below.</p>
      </div>

      {error && <div className="auth-alert">{error}</div>}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <div className="input-wrapper">
            <span className="input-icon">
              <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                <rect x="4" y="9" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="10" cy="13.5" r="1.2" fill="currentColor" />
              </svg>
            </span>
            <input
              type={showPassword ? "text" : "password"}
              id="newPassword"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              autoFocus
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((value) => !value)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <div className="input-wrapper">
            <span className="input-icon">
              <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <input
              type={showPassword ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={submitting}>
          <span className="btn-text" style={{ display: submitting ? "none" : "inline" }}>
            Reset Password
          </span>
          {submitting && <span className="btn-spinner is-visible" aria-hidden="true"></span>}
        </button>
      </form>
    </AuthPortalLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
          <span className="btn-spinner is-visible auth-spinner--dark"></span>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
