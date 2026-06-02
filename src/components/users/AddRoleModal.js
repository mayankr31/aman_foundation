'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, Loader2, Save } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function AddRoleModal({ isOpen, onClose, isDarkMode, token, onRoleAdded }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [displayInRegister, setDisplayInRegister] = useState(true);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Role name is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, description, displayInRegister })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create role');

      toast.success("Role created successfully!");
      onRoleAdded(data.data);
      setName('');
      setDescription('');
      setDisplayInRegister(true);
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
        className={`${theme.bg} border ${theme.border} p-8 rounded-[2rem] shadow-2xl w-full max-w-md relative`}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${isDarkMode ? 'bg-[#1a7a5e]/20 text-[#1a7a5e]' : 'bg-[#eef9f5] text-[#1a7a5e]'} flex items-center justify-center shrink-0`}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className={`text-xl font-bold tracking-tight ${theme.text}`}>Create Custom Role</h3>
              <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>Add System Authority</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${theme.textLight}`}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <label className={`text-[10px] font-black uppercase tracking-widest ${theme.textLight}`}>Role Name</label>
            <input
              type="text"
              placeholder="e.g. Educator"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium border outline-none transition-colors ${theme.text} ${theme.inputBg} ${theme.inputBorder} focus:border-[#1a7a5e]`}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className={`text-[10px] font-black uppercase tracking-widest ${theme.textLight}`}>Description</label>
            <textarea
              placeholder="Enter brief description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium border outline-none transition-colors ${theme.text} ${theme.inputBg} ${theme.inputBorder} focus:border-[#1a7a5e]`}
            />
          </div>

          {/* Display in Register toggle */}
          <div className="flex items-center justify-between py-2 border-y dark:border-white/5 border-gray-100">
            <div>
              <div className={`text-xs font-bold ${theme.text}`}>Display in Registration</div>
              <div className={`text-[10px] ${theme.textMuted}`}>Let users select this role on register page</div>
            </div>
            <button
              type="button"
              onClick={() => setDisplayInRegister(prev => !prev)}
              className={`w-10 h-6 rounded-full relative transition-colors ${
                displayInRegister ? theme.toggleOn : theme.toggleOff
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  displayInRegister ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${theme.textLight}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl text-white font-bold uppercase tracking-widest text-xs flex items-center gap-2 bg-[#1a7a5e] hover:scale-105 transition-transform`}
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
