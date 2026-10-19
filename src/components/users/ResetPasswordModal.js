'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, KeyRound, Loader2, Save } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function ResetPasswordModal({ isOpen, onClose, isDarkMode, token, user, onReset }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSave = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      toast.success("Password reset successfully!");
      onReset();
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const theme = {
    bg: isDarkMode ? 'bg-[#151e2d]' : 'bg-white',
    border: isDarkMode ? 'border-white/10' : 'border-gray-200',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textLight: isDarkMode ? 'text-gray-400' : 'text-gray-600',
    textMuted: isDarkMode ? 'text-gray-500' : 'text-gray-400',
    inputBg: isDarkMode ? 'bg-[#0d1320]' : 'bg-gray-50',
    inputBorder: isDarkMode ? 'border-white/5' : 'border-gray-200',
  };

  const inputClass = `w-full px-4 py-3 rounded-xl text-sm font-medium border outline-none transition-colors ${theme.text} ${theme.inputBg} ${theme.inputBorder} focus:border-[#1a7a5e]`;
  const labelClass = `text-[10px] font-black uppercase tracking-widest ${theme.textLight}`;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${theme.bg} border ${theme.border} p-5 sm:p-8 rounded-[2rem] shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600'} flex items-center justify-center shrink-0`}>
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className={`text-xl font-bold tracking-tight ${theme.text}`}>Reset Password</h3>
              <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${theme.textLight}`}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>New Password</label>
            <input
              type="text"
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Confirm Password</label>
            <input
              type="text"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${theme.textLight}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-white font-bold uppercase tracking-widest text-xs flex items-center gap-2 bg-[#1a7a5e] hover:scale-105 transition-transform"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Reset Password
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
