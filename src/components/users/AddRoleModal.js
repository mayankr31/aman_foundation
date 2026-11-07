'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ShieldAlert, Loader2, Save, GitBranch } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { getRoleRank } from '@/lib/roleHierarchy';
import { formatRoleLabel } from '@/lib/roles';

export default function AddRoleModal({
  isOpen,
  onClose,
  isDarkMode,
  token,
  role = null,
  onSaved,
}) {
  const isEditing = Boolean(role?.id);
  const [displayName, setDisplayName] = useState(role ? formatRoleLabel(role) : '');
  const [description, setDescription] = useState(role?.description || '');
  const [rank, setRank] = useState(getRoleRank(role) ?? 10);
  const [displayInRegister, setDisplayInRegister] = useState(role?.displayInRegister ?? true);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Role name is required");
      return;
    }

    const rankValue = Number(rank);
    if (!Number.isInteger(rankValue) || rankValue < 0) {
      toast.error("Seniority must be a whole number of 0 or higher");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        isEditing ? `/api/roles/${role.id}` : '/api/roles',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            displayName: displayName.trim(),
            description: description.trim(),
            rank: rankValue,
            displayInRegister,
          })
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} role`);

      toast.success(isEditing ? "Role updated successfully!" : "Role created successfully!");
      onSaved?.(data.data);
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
    toggleOn: 'bg-[#1a7a5e]',
    toggleOff: isDarkMode ? 'bg-white/10' : 'bg-gray-200',
  };

  return (
    <div className={`fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-md`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${theme.bg} border ${theme.border} p-5 sm:p-8 rounded-[2rem] shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex justify-between items-center gap-3 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl ${isDarkMode ? 'bg-[#1a7a5e]/20 text-[#1a7a5e]' : 'bg-[#eef9f5] text-[#1a7a5e]'} flex items-center justify-center shrink-0`}>
              <ShieldAlert size={20} />
            </div>
            <div className="min-w-0">
              <h3 className={`text-xl font-bold tracking-tight ${theme.text}`}>
                {isEditing ? 'Edit Role' : 'Create Custom Role'}
              </h3>
              <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted} truncate`}>
                {isEditing ? 'Update role details' : 'Add System Authority'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 shrink-0 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${theme.textLight}`}
            aria-label="Close role dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="role-name" className={`text-[10px] font-black uppercase tracking-widest ${theme.textLight}`}>Role Name</label>
            <input
              id="role-name"
              type="text"
              placeholder="e.g. CEO"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={80}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium border outline-none transition-colors ${theme.text} ${theme.inputBg} ${theme.inputBorder} focus:border-[#1a7a5e]`}
            />
            <p className={`text-[10px] ${theme.textMuted}`}>
              Shown exactly as typed across the app.
            </p>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label htmlFor="role-description" className={`text-[10px] font-black uppercase tracking-widest ${theme.textLight}`}>Description</label>
            <textarea
              id="role-description"
              placeholder="Enter brief description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium border outline-none transition-colors ${theme.text} ${theme.inputBg} ${theme.inputBorder} focus:border-[#1a7a5e]`}
            />
          </div>

          {/* Seniority */}
          <div className="flex flex-col gap-2">
            <label htmlFor="role-rank" className={`text-[10px] font-black uppercase tracking-widest ${theme.textLight}`}>
              Reporting Seniority
            </label>
            <div className="relative">
              <GitBranch size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`} />
              <input
                id="role-rank"
                type="number"
                min={0}
                step={1}
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className={`w-full pl-9 pr-4 py-3 rounded-xl text-sm font-medium border outline-none transition-colors ${theme.text} ${theme.inputBg} ${theme.inputBorder} focus:border-[#1a7a5e]`}
              />
            </div>
            <p className={`text-[10px] ${theme.textMuted}`}>
              Higher number = more senior. Only roles with a higher seniority appear in Reports To.
            </p>
          </div>

          {/* Display in Register toggle */}
          <div className="flex items-center justify-between gap-4 py-2 border-y dark:border-white/5 border-gray-100">
            <div>
              <div className={`text-xs font-bold ${theme.text}`}>Display in Registration</div>
              <div className={`text-[10px] ${theme.textMuted}`}>Let users select this role on register page</div>
            </div>
            <button
              type="button"
              onClick={() => setDisplayInRegister(prev => !prev)}
              className={`w-10 h-6 shrink-0 rounded-full relative transition-colors ${
                displayInRegister ? theme.toggleOn : theme.toggleOff
              }`}
              aria-label="Toggle register visibility"
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  displayInRegister ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-2">
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
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 bg-[#1a7a5e] hover:scale-105 transition-transform disabled:opacity-60`}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isEditing ? 'Save Changes' : 'Save Role'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
