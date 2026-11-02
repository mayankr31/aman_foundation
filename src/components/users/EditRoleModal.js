'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, UserCog, Loader2, Save } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { formatRoleLabel } from '@/lib/roles';

export default function EditRoleModal({
  isOpen,
  onClose,
  isDarkMode,
  token,
  user,
  roles = [],
  onRoleUpdated,
}) {
  const [roleId, setRoleId] = useState(() => user?.roleId || user?.role?.id || '');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const currentRoleName = user?.role?.name;
  const selectedRole = useMemo(
    () => roles.find((role) => role.id === roleId),
    [roles, roleId]
  );
  const isPromotingToAdmin =
    selectedRole?.name === 'ADMIN' && currentRoleName !== 'ADMIN';

  const handleSave = async (e) => {
    e.preventDefault();

    if (!roleId) {
      toast.error('Please select a role');
      return;
    }

    if (roleId === (user?.roleId || user?.role?.id)) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roleId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');

      toast.success('User role updated successfully!');
      onRoleUpdated?.(data.data);
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

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
        <div className="flex justify-between items-start gap-3 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 shrink-0 rounded-xl ${isDarkMode ? 'bg-[#1a7a5e]/20 text-[#1a7a5e]' : 'bg-[#eef9f5] text-[#1a7a5e]'} flex items-center justify-center`}>
              <UserCog size={20} />
            </div>
            <div className="min-w-0">
              <h3 className={`text-xl font-bold tracking-tight ${theme.text}`}>Edit Role</h3>
              <p className={`text-[10px] font-black uppercase tracking-widest truncate ${theme.textMuted}`}>
                {user.name || user.username}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 shrink-0 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${theme.textLight}`}
            aria-label="Close edit role dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Current Role</label>
            <div className={`w-full px-4 py-3 rounded-xl text-sm font-semibold border ${theme.text} ${theme.inputBg} ${theme.inputBorder}`}>
              {formatRoleLabel(currentRoleName)}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="edit-role-select" className={labelClass}>
              New Role
            </label>
            <select
              id="edit-role-select"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {formatRoleLabel(role.name)}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
            <p className="text-[11px] font-semibold leading-relaxed text-amber-700 dark:text-amber-300">
              Changing the role updates this user&apos;s access rights immediately.
              {isPromotingToAdmin && (
                <> They will receive full Executive Director access to every section.</>
              )}
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${theme.textLight}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 bg-primary hover:scale-105 transition-transform disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Role
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
