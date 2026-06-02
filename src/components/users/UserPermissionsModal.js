'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Save, ShieldAlert } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function UserPermissionsModal({ isOpen, onClose, user, isDarkMode, token }) {
  const toast = useToast();
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localState, setLocalState] = useState({});

  const theme = {
    bg: isDarkMode ? 'bg-[#151e2d]' : 'bg-white',
    border: isDarkMode ? 'border-white/10' : 'border-gray-200',
    textWhite: isDarkMode ? 'text-white' : 'text-gray-900',
    textLight: isDarkMode ? 'text-gray-400' : 'text-gray-600',
    textMuted: isDarkMode ? 'text-gray-500' : 'text-gray-400',
    iconBg: isDarkMode ? 'bg-white/5' : 'bg-gray-100',
    iconHover: isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200',
    borderLight: isDarkMode ? 'border-white/5' : 'border-gray-100',
    toggleOn: 'bg-[#1a7a5e]',
    toggleOff: isDarkMode ? 'bg-white/10' : 'bg-gray-200',
  };

  useEffect(() => {
    if (isOpen && user && token) {
      fetchData();
    }
  }, [isOpen, user, token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [permsRes, userPermsRes, rolePermsRes] = await Promise.all([
        fetch('/api/permissions', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/users/${user.id}/permissions`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/roles/${user.roleId}/permissions`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const permsData = await permsRes.json();
      const userPermsData = await userPermsRes.json();
      const rolePermsData = await rolePermsRes.json();

      if (!permsRes.ok || !userPermsRes.ok || !rolePermsRes.ok) {
        throw new Error('Failed to fetch permissions');
      }

      setAllPermissions(permsData.data || []);
      const needsInit = !userPermsData.data || userPermsData.data.length === 0;
      initializeLocalState(permsData.data || [], userPermsData.data || [], rolePermsData.data || [], needsInit);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeLocalState = (perms, userPerms, rolePerms, needsInit) => {
    const state = {};
    const userPermsMap = {};
    (userPerms || []).forEach(up => {
      userPermsMap[up.permissionId] = up;
    });

    const rolePermsMap = {};
    (rolePerms || []).forEach(rp => {
      rolePermsMap[rp.id] = true;
    });

    perms.forEach(p => {
      const userPerm = userPermsMap[p.id];
      if (userPerm) {
        state[p.id] = {
          hasPermission: userPerm.type === 'GRANT',
          changed: false,
        };
      } else if (needsInit) {
        const hasRolePerm = rolePermsMap[p.id];
        state[p.id] = {
          hasPermission: !!hasRolePerm,
          changed: false,
        };
      } else {
        state[p.id] = {
          hasPermission: false,
          changed: false,
        };
      }
    });

    setLocalState(state);
  };

  const pages = useMemo(() => {
    const pageMap = {};
    allPermissions.forEach(p => {
      if (!pageMap[p.page]) {
        pageMap[p.page] = {};
      }
      pageMap[p.page][p.action] = p;
    });
    return Object.keys(pageMap).sort().map(page => ({
      name: page,
      permissions: pageMap[page],
    }));
  }, [allPermissions]);

  const allReadEnabled = useMemo(() => {
    const readPerms = allPermissions.filter(p => p.action === 'READ');
    if (readPerms.length === 0) return false;
    return readPerms.every(p => localState[p.id]?.hasPermission === true);
  }, [allPermissions, localState]);

  const allWriteEnabled = useMemo(() => {
    const writePerms = allPermissions.filter(p => p.action === 'WRITE');
    if (writePerms.length === 0) return false;
    return writePerms.every(p => localState[p.id]?.hasPermission === true);
  }, [allPermissions, localState]);

  const handleToggle = (permId, action, currentValue) => {
    setLocalState(prev => {
      const newState = { ...prev };
      const perm = allPermissions.find(p => p.id === permId);
      if (!perm) return prev;

      if (action === 'READ') {
        newState[permId] = {
          hasPermission: !currentValue,
          changed: true,
        };
        const writePerm = allPermissions.find(p => p.page === perm.page && p.action === 'WRITE');
        if (writePerm && newState[writePerm.id]) {
          if (!newState[permId].hasPermission) {
            newState[writePerm.id] = {
              ...newState[writePerm.id],
              hasPermission: false,
              changed: true,
            };
          }
        }
      } else if (action === 'WRITE') {
        newState[permId] = {
          hasPermission: !currentValue,
          changed: true,
        };
        const readPerm = allPermissions.find(p => p.page === perm.page && p.action === 'READ');
        if (readPerm && !newState[permId].hasPermission) {
          newState[readPerm.id] = {
            ...newState[readPerm.id],
            hasPermission: false,
            changed: true,
          };
        } else if (readPerm && newState[permId].hasPermission) {
          newState[readPerm.id] = {
            ...newState[readPerm.id],
            hasPermission: true,
            changed: true,
          };
        }
      }

      return newState;
    });
  };

  const handleToggleAllRead = () => {
    const newValue = !allReadEnabled;
    setLocalState(prev => {
      const newState = { ...prev };
      allPermissions.forEach(p => {
        if (p.action === 'READ') {
          newState[p.id] = { hasPermission: newValue, changed: true };
        }
        if (p.action === 'WRITE' && !newValue) {
          newState[p.id] = { ...newState[p.id], hasPermission: false, changed: true };
        }
      });
      return newState;
    });
  };

  const handleToggleAllWrite = () => {
    const newValue = !allWriteEnabled;
    setLocalState(prev => {
      const newState = { ...prev };
      allPermissions.forEach(p => {
        if (p.action === 'WRITE') {
          newState[p.id] = { hasPermission: newValue, changed: true };
        }
        if (p.action === 'READ' && newValue) {
          newState[p.id] = { ...newState[p.id], hasPermission: true, changed: true };
        }
      });
      return newState;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const changes = Object.entries(localState)
        .filter(([_, state]) => state.changed)
        .map(([permId, state]) => ({
          permissionId: permId,
          type: state.hasPermission ? 'GRANT' : 'DENY',
        }));

      const promises = changes.map(change =>
        fetch(`/api/users/${user.id}/permissions`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(change),
        })
      );

      await Promise.all(promises);
      toast.success('Permissions override saved successfully!');
      onClose();
    } catch (err) {
      console.error('Error saving overrides:', err);
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[110] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-md`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${theme.bg} border ${theme.border} p-8 rounded-[2rem] shadow-2xl w-full max-w-3xl relative my-8`}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${isDarkMode ? 'bg-[#1a7a5e]/20 text-[#1a7a5e]' : 'bg-[#eef9f5] text-[#1a7a5e]'} flex items-center justify-center shrink-0`}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className={`text-xl font-bold tracking-tight ${theme.textWhite}`}>{user?.name || user?.username}</h3>
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
            <div className={`border-t ${theme.borderLight} my-4`} />
            <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              <table className="w-full">
                <thead className={`sticky top-0 ${theme.bg} z-10`}>
                  <tr className={`text-left text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>
                    <th className="py-3 pr-4">Page / Feature</th>
                    <th className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span>READ</span>
                        <button
                          onClick={handleToggleAllRead}
                          className={`w-8 h-4 rounded-full relative transition-colors ${
                            allReadEnabled ? theme.toggleOn : theme.toggleOff
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                              allReadEnabled ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </th>
                    <th className="py-3 pl-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span>WRITE</span>
                        <button
                          onClick={handleToggleAllWrite}
                          className={`w-8 h-4 rounded-full relative transition-colors ${
                            allWriteEnabled ? theme.toggleOn : theme.toggleOff
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                              allWriteEnabled ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map(({ name, permissions }) => {
                    const readPerm = permissions.READ;
                    const writePerm = permissions.WRITE;
                    const readState = readPerm ? localState[readPerm.id] : null;
                    const writeState = writePerm ? localState[writePerm.id] : null;

                    return (
                      <tr key={name} className={`border-t ${theme.borderLight}`}>
                        <td className={`py-4 pr-4 font-semibold text-xs tracking-wider uppercase ${theme.textWhite}`}>
                          {name.replace(/_/g, ' ')}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {readPerm && (
                            <button
                              onClick={() => handleToggle(readPerm.id, 'READ', readState?.hasPermission)}
                              className={`w-10 h-6 rounded-full relative transition-colors ${
                                readState?.hasPermission ? theme.toggleOn : theme.toggleOff
                              }`}
                            >
                              <div
                                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                                    readState?.hasPermission ? 'translate-x-5' : 'translate-x-1'
                                  }`}
                              />
                            </button>
                          )}
                        </td>
                        <td className="py-4 pl-4 text-center">
                          {writePerm && (
                            <button
                              onClick={() => handleToggle(writePerm.id, 'WRITE', writeState?.hasPermission)}
                              disabled={readState?.hasPermission === false}
                              className={`w-10 h-6 rounded-full relative transition-colors ${
                                writeState?.hasPermission ? theme.toggleOn : theme.toggleOff
                              } ${readState?.hasPermission === false ? 'opacity-30 cursor-not-allowed' : ''}`}
                            >
                              <div
                                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                                    writeState?.hasPermission ? 'translate-x-5' : 'translate-x-1'
                                  }`}
                              />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={`flex gap-4 justify-end pt-6 mt-6 border-t ${theme.borderLight}`}>
              <button
                onClick={onClose}
                className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-colors ${theme.textLight}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-8 py-3 rounded-2xl text-white font-bold uppercase tracking-widest text-xs flex items-center gap-2 bg-[#1a7a5e] hover:scale-105 transition-transform shadow-xl`}
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
