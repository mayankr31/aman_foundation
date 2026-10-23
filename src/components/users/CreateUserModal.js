'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Loader2, Save } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import {
  validateMobile,
  validateEmail,
  validatePersonName,
  validatePassword,
  firstError,
  toMobileInput,
  toPersonNameInput,
} from '@/lib/validation';

export default function CreateUserModal({ isOpen, onClose, isDarkMode, token, roles = [], onUserCreated }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const assignableRoles = roles.filter((r) => r.name !== 'ADMIN');

  useEffect(() => {
    if (!isOpen || !token) return;
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setManagers(json.data || []);
      })
      .catch(() => {});
  }, [isOpen, token]);

  const reset = () => {
    setName('');
    setEmail('');
    setMobile('');
    setPassword('');
    setRoleId('');
    setManagerId('');
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!roleId) {
      toast.error("Role is required");
      return;
    }
    const validationMessage = firstError([
      validatePersonName(name, { required: true }),
      validateEmail(email, { required: true }),
      validateMobile(mobile),
      validatePassword(password, { required: true }),
    ]);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          mobile: mobile.trim() || undefined,
          password,
          roleId,
          managerId: managerId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      toast.success("User created successfully!");
      onUserCreated(data.data);
      reset();
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
            <div className={`w-10 h-10 rounded-xl ${isDarkMode ? 'bg-[#1a7a5e]/20 text-[#1a7a5e]' : 'bg-[#eef9f5] text-[#1a7a5e]'} flex items-center justify-center shrink-0`}>
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className={`text-xl font-bold tracking-tight ${theme.text}`}>Create User</h3>
              <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>Admin Provisioning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${theme.textLight}`}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Full Name<span className="text-error ml-0.5">*</span></label>
            <input
              type="text"
              placeholder="e.g. Priya Sharma"
              maxLength={60}
              value={name}
              onChange={(e) => setName(toPersonNameInput(e.target.value))}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Email Address<span className="text-error ml-0.5">*</span></label>
            <input
              type="email"
              placeholder="user@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Mobile (Optional)</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              pattern="[0-9]{10}"
              title="Enter exactly 10 digits, without +91 or spaces."
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(toMobileInput(e.target.value))}
              className={inputClass}
            />
            <span className={`text-[10px] ${theme.textMuted}`}>10 digits, numbers only (no +91).</span>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Password<span className="text-error ml-0.5">*</span></label>
            <input
              type="text"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <span className={`text-[10px] ${theme.textMuted}`}>Share this password with the user; they can change it later.</span>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Role<span className="text-error ml-0.5">*</span></label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>Select a role</option>
              {assignableRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Reports To</label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className={inputClass}
            >
              <option value="">No manager / top level</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name} ({manager.role?.name?.replaceAll('_', ' ')})
                </option>
              ))}
            </select>
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
              className="px-4 py-2 rounded-xl text-white font-bold uppercase tracking-widest text-xs flex items-center gap-2 bg-primary hover:scale-105 transition-transform"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Create User
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
