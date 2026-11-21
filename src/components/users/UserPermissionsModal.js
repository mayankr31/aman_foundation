'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Save, ShieldAlert, RotateCcw, Search } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/lib/useAuth';
import { PERMISSION_GROUPS_WITH_PAGES } from '@/lib/permissionCatalog';

export default function UserPermissionsModal({ isOpen, onClose, user, isDarkMode, token }) {
  const toast = useToast();
  const { user: currentUser, refreshPermissions } = useAuth();
  const [allPermissions, setAllPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localState, setLocalState] = useState({});
  const [initialState, setInitialState] = useState({});
  const [query, setQuery] = useState('');

  const theme = {
    bg: isDarkMode ? 'bg-[#151e2d]' : 'bg-white',
    border: isDarkMode ? 'border-white/10' : 'border-gray-200',
    textWhite: isDarkMode ? 'text-white' : 'text-gray-900',
    textLight: isDarkMode ? 'text-gray-400' : 'text-gray-600',
    textMuted: isDarkMode ? 'text-gray-500' : 'text-gray-400',
    borderLight: isDarkMode ? 'border-white/5' : 'border-gray-100',
    select: isDarkMode
      ? 'bg-[#0d1320] text-white border-white/10'
      : 'bg-white text-gray-900 border-gray-200',
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [permsRes, userPermsRes, rolePermsRes] = await Promise.all([
        fetch('/api/permissions', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/users/${user.id}/permissions`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/roles/${user.roleId || user.role?.id}/permissions`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const permsData = await permsRes.json();
      const userPermsData = await userPermsRes.json();
      const rolePermsData = await rolePermsRes.json();

      if (!permsRes.ok || !userPermsRes.ok || !rolePermsRes.ok) {
        throw new Error('Failed to fetch permissions');
      }

      const perms = permsData.data || [];
      const rolePerms = rolePermsData.data || [];
      setAllPermissions(perms);
      setRolePermissions(rolePerms);

      const userOverrideMap = {};
      (userPermsData.data || []).forEach((up) => {
        userOverrideMap[up.permissionId] = up.type === 'GRANT' ? 'allow' : 'deny';
      });

      const state = {};
      perms.forEach((p) => {
        state[p.id] = userOverrideMap[p.id] || 'inherit';
      });
      setLocalState(state);
      setInitialState(state);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user && token) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user, token]);

  const rolePermIds = useMemo(() => new Set((rolePermissions || []).map((p) => p.id)), [rolePermissions]);

  const permsByPage = useMemo(() => {
    const map = {};
    allPermissions.forEach((p) => {
      if (!map[p.page]) map[p.page] = {};
      map[p.page][p.action] = p;
    });
    return map;
  }, [allPermissions]);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return PERMISSION_GROUPS_WITH_PAGES.map((group) => ({
      ...group,
      pages: group.pages.filter((page) => {
        if (!permsByPage[page.key]) return false;
        if (!needle) return true;
        return (
          page.label.toLowerCase().includes(needle) ||
          group.label.toLowerCase().includes(needle)
        );
      }),
    })).filter((group) => group.pages.length > 0);
  }, [permsByPage, query]);

  const visibleCount = useMemo(
    () => groups.reduce((total, group) => total + group.pages.length, 0),
    [groups]
  );

  const handleChange = (permId, value) => {
    const permission = allPermissions.find((p) => p.id === permId);
    setLocalState((prev) => {
      const next = { ...prev, [permId]: value };

      // Keep READ/WRITE relationships sensible when using the switches.
      if (permission?.action === "READ" && value === "deny") {
        const writePerm = allPermissions.find(
          (p) => p.page === permission.page && p.action === "WRITE"
        );
        if (writePerm) next[writePerm.id] = "deny";
      }
      if (permission?.action === "WRITE" && value === "allow") {
        const readPerm = allPermissions.find(
          (p) => p.page === permission.page && p.action === "READ"
        );
        if (readPerm) next[readPerm.id] = "allow";
      }

      return next;
    });
  };

  const roleAllows = (permission) => {
    if (!permission) return false;
    if (rolePermIds.has(permission.id)) return true;
    if (permission.action === "READ") {
      const writePerm = allPermissions.find(
        (p) => p.page === permission.page && p.action === "WRITE"
      );
      return !!writePerm && rolePermIds.has(writePerm.id);
    }
    return false;
  };

  const handleResetPage = (permissions) => {
    setLocalState((prev) => {
      const next = { ...prev };
      Object.values(permissions).forEach((p) => {
        next[p.id] = 'inherit';
      });
      return next;
    });
  };

  const handleResetGroup = (pageKeys) => {
    setLocalState((prev) => {
      const next = { ...prev };
      pageKeys.forEach((key) => {
        Object.values(permsByPage[key] || {}).forEach((p) => {
          next[p.id] = 'inherit';
        });
      });
      return next;
    });
  };

  const handleResetAll = () => {
    const next = {};
    allPermissions.forEach((p) => {
      next[p.id] = 'inherit';
    });
    setLocalState(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const requests = [];
      for (const permission of allPermissions) {
        const next = localState[permission.id] || 'inherit';
        const prev = initialState[permission.id] || 'inherit';
        if (next === prev) continue;

        if (next === 'inherit') {
          requests.push(
            fetch(`/api/users/${user.id}/permissions?permissionId=${permission.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            })
          );
        } else {
          requests.push(
            fetch(`/api/users/${user.id}/permissions`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                permissionId: permission.id,
                type: next === 'allow' ? 'GRANT' : 'DENY',
              }),
            })
          );
        }
      }

      const results = await Promise.all(requests);
      const failed = results.find((res) => !res.ok);
      if (failed) throw new Error('Some permission changes could not be saved');

      if (currentUser?.id === user.id) {
        await refreshPermissions();
      }
      toast.success('Permission overrides saved successfully!');
      onClose();
    } catch (err) {
      console.error('Error saving overrides:', err);
      toast.error(err.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${theme.bg} border ${theme.border} p-5 sm:p-8 rounded-[2rem] shadow-2xl w-full max-w-4xl relative my-8`}
      >
        <div className="flex justify-between items-center gap-3 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl ${isDarkMode ? 'bg-[#1a7a5e]/20 text-[#1a7a5e]' : 'bg-[#eef9f5] text-[#1a7a5e]'} flex items-center justify-center shrink-0`}>
              <ShieldAlert size={20} />
            </div>
            <div className="min-w-0">
              <h3 className={`text-xl font-bold tracking-tight truncate ${theme.textWhite}`}>{user?.name || user?.username}</h3>
              <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>Custom Override Permissions</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${theme.textLight}`}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[#1a7a5e]" />
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
              <p className={`text-xs flex-1 ${theme.textMuted}`}>
                Switches show the effective permission for each individual page. Changing a switch creates an explicit override; <strong>Reset</strong> returns that page to the role default. READ controls page access; WRITE controls create, edit, delete, approve and upload actions.
              </p>
              <button
                onClick={handleResetAll}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border ${theme.border} ${theme.textLight} hover:bg-black/5 dark:hover:bg-white/5`}
              >
                <RotateCcw size={12} /> Reset all to role
              </button>
            </div>

            <div className="relative mb-3">
              <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`} />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pages..."
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border ${theme.select} focus:outline-none focus:ring-2 focus:ring-[#1a7a5e]/30`}
              />
            </div>

            <div className="max-h-[55vh] overflow-y-auto overflow-x-auto pr-2 custom-scrollbar">
              <table className={`mobile-card-table w-full min-w-[620px] ${isDarkMode ? 'mobile-card-table-dark' : ''}`}>
                <thead className={`sticky top-0 ${theme.bg} z-10`}>
                  <tr className={`text-left text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>
                    <th className="py-3 pr-4">Page</th>
                    <th className="py-3 px-4 text-center">READ</th>
                    <th className="py-3 px-4 text-center">WRITE</th>
                    <th className="py-3 pl-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <React.Fragment key={group.id}>
                      <tr className={`${isDarkMode ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                        <td colSpan={4} className={`py-2 pr-4 text-[10px] font-black uppercase tracking-widest ${theme.textLight}`}>
                          <div className="flex items-center justify-between gap-2">
                            <span>{group.label}</span>
                            <button
                              onClick={() => handleResetGroup(group.pages.map((page) => page.key))}
                              className={`text-[9px] font-bold uppercase tracking-wider ${theme.textMuted} hover:text-[#1a7a5e]`}
                            >
                              Reset group
                            </button>
                          </div>
                        </td>
                      </tr>
                      {group.pages.map((page) => {
                        const permissions = permsByPage[page.key] || {};

                        const renderCell = (perm) => {
                          if (!perm) return null;
                          const value = localState[perm.id] || 'inherit';
                          const inheritedAllowed = roleAllows(perm);
                          const isOn = value === 'allow' || (value === 'inherit' && inheritedAllowed);

                          return (
                            <div className="flex flex-col items-center gap-1.5">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={isOn}
                                onClick={() => handleChange(perm.id, isOn ? 'deny' : 'allow')}
                                className={`w-11 h-6 p-0 rounded-full relative shrink-0 transition-colors ${
                                  isOn ? 'bg-[#1a7a5e]' : isDarkMode ? 'bg-white/15' : 'bg-gray-200'
                                }`}
                                title={isOn ? 'Allowed — click to deny' : 'Denied — click to allow'}
                              >
                                <span
                                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                    isOn ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                              {value !== 'inherit' && (
                                <button
                                  type="button"
                                  onClick={() => handleChange(perm.id, 'inherit')}
                                  className={`text-[9px] font-bold uppercase tracking-wider ${theme.textMuted} hover:text-[#1a7a5e]`}
                                  title="Reset to role permissions"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          );
                        };

                        return (
                          <tr key={page.key} className={`border-t ${theme.borderLight}`}>
                            <td data-label="" className={`py-3 pr-4 font-semibold text-xs tracking-wider uppercase ${theme.textWhite}`}>
                              {page.label}
                            </td>
                            <td data-label="Read" className="py-3 px-4 text-center">{renderCell(permissions.READ)}</td>
                            <td data-label="Write" className="py-3 px-4 text-center">{renderCell(permissions.WRITE)}</td>
                            <td data-label="Actions" className="py-3 pl-4 text-center">
                              <button
                                onClick={() => handleResetPage(permissions)}
                                className={`text-[10px] font-bold uppercase tracking-wider ${theme.textMuted} hover:text-[#1a7a5e]`}
                              >
                                Reset page
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                  {visibleCount === 0 && (
                    <tr>
                      <td colSpan={4} className={`py-10 text-center text-xs ${theme.textMuted}`}>
                        No pages match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className={`flex gap-4 justify-end pt-6 mt-6 border-t ${theme.borderLight}`}>
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest transition-colors ${theme.textLight}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-2xl text-white font-bold uppercase tracking-widest text-xs flex items-center gap-2 bg-[#1a7a5e] hover:scale-105 transition-transform shadow-xl disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Overrides
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
