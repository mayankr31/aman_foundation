'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, UserX, Loader2, Users as UsersIcon, CheckCircle2, ShieldAlert, ArrowRight, Shield, Users, Search, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { useToast } from '@/context/ToastContext';
import UserPermissionsModal from '@/components/users/UserPermissionsModal';
import RolePermissionsModal from '@/components/users/RolePermissionsModal';
import AddRoleModal from '@/components/users/AddRoleModal';
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Tab control
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'approvals' | 'roles' | 'deactivated'
  const [roles, setRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState({});
  
  const handleDepartmentChange = (userId, value) => {
    setSelectedDepartments(prev => ({ ...prev, [userId]: value }));
  };
  
  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [deleteUserModalOpen, setDeleteUserModalOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);

  const { token, user: currentUser } = useAuth();
  const pendingApprovalsCount = useMemo(() => {
    return users.filter(u => u.status === 'PENDING').length;
  }, [users]);
  const toast = useToast();

  const isDarkMode = true; // Match premium dark theme of dashboard panels

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchRoles();
    }
  }, [token]);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
      setUsers(data.data || []);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/roles?all=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRoles(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      setActionLoading(userId);
      const body = { status: newStatus };
      if (newStatus === 'ACTIVE' && selectedDepartments[userId]) {
        body.department = selectedDepartments[userId];
      }
      
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to update status`);

      toast.success(`User status updated to ${newStatus}.`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRole = (roleId) => {
    setDeleteItemId(roleId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteRole = async () => {
    if (!deleteItemId) return;

    try {
      const res = await fetch(`/api/roles/${deleteItemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete role');

      toast.success("Role deleted successfully!");
      setRoles(prev => prev.filter(r => r.id !== deleteItemId));
    } catch (error) {
      toast.error(error.message);
    }
    setDeleteModalOpen(false);
    setDeleteItemId(null);
  };

  const handleDeleteUser = (userId) => {
    setDeleteUserId(userId);
    setDeleteUserModalOpen(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteUserId) return;
    try {
      setActionLoading(deleteUserId);
      const res = await fetch(`/api/users/${deleteUserId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');

      toast.success("User and all associated profile records deleted successfully!");
      setUsers(prev => prev.filter(u => u.id !== deleteUserId));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
    setDeleteUserModalOpen(false);
    setDeleteUserId(null);
  };

  // Filtered lists
  const pendingUsers = useMemo(() => users.filter(u => u.status === 'PENDING'), [users]);
  const activeUsers = useMemo(() => users.filter(u => u.status === 'ACTIVE'), [users]);
  const deactivatedUsers = useMemo(() => users.filter(u => u.status === 'INACTIVE'), [users]);

  const filteredUsers = useMemo(() => {
    let list = activeUsers;
    if (activeTab === 'approvals') list = pendingUsers;
    else if (activeTab === 'deactivated') list = deactivatedUsers;
    
    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(
      u =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.mobile && u.mobile.includes(q))
    );
  }, [activeTab, pendingUsers, activeUsers, deactivatedUsers, searchQuery]);

  if (currentUser?.roleName !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-3 font-sans">
        <ShieldAlert className="w-12 h-12 text-rose-500 animate-pulse" />
        <p className="text-rose-500 font-bold uppercase tracking-widest text-sm">Access Denied</p>
        <p className="text-xs text-slate-500">Administrator authorization is required to access this system.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Admin Portal
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mt-2">
            Dynamic access parameters & user authorization dashboard
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'roles' && (
            <button
              onClick={() => setIsAddRoleOpen(true)}
              className="px-5 py-2.5 rounded-full bg-[#1a7a5e] hover:bg-[#135d47] text-white text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 hover:scale-105 active:scale-100 shadow-[0_4px_12px_rgba(26,122,94,0.2)]"
            >
              <Plus size={14} /> Add Role
            </button>
          )}

          <div className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <UsersIcon size={14} />
            {activeUsers.length} Active
          </div>
          
          <button
            onClick={() => setActiveTab('approvals')}
            className={`relative px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
              activeTab === 'approvals'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300 dark:border-white/10 text-slate-600 border-slate-200'
            }`}
          >
            Pending Approvals <ArrowRight size={14} />
            {pendingApprovalsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-black">
                {pendingApprovalsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5 w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <Users size={14} />
          Active Users
        </button>
        <button
          onClick={() => setActiveTab('deactivated')}
          className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'deactivated'
              ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <UserX size={14} />
          Deactivated
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'approvals'
              ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <UserCheck size={14} />
          Approvals Queue
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'roles'
              ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <Shield size={14} />
          Role Switches
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-teal-400" />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* USERS / APPROVALS TAB */}
          {(activeTab === 'users' || activeTab === 'approvals' || activeTab === 'deactivated') && (
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === 'users' ? 'users' : 'pending approvals'} by name, email...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-xs font-medium border outline-none transition-all bg-white dark:bg-[#0d1320] dark:border-white/5 border-slate-200 dark:text-white text-slate-900 placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#1a7a5e] shadow-sm"
                />
              </div>

              {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed dark:border-white/5 border-slate-200 bg-white dark:bg-[#0d1320] text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/5 text-slate-400 flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-base font-bold dark:text-white text-slate-800">No entries found</h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">There are no matches for your query in this section.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#0d1320] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-4 px-6">Name</th>
                          <th className="py-4 px-6">Username</th>
                          <th className="py-4 px-6">Email Address</th>
                          <th className="py-4 px-6">Mobile</th>
                          <th className="py-4 px-6">Role</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((item, idx) => (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className="border-t border-slate-200 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors"
                          >
                            <td className="py-4 px-6 font-bold dark:text-white text-slate-800">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#1a7a5e]/15 text-[#1a7a5e] flex items-center justify-center font-bold">
                                  {item.name ? item.name.charAt(0).toUpperCase() : item.username.charAt(0).toUpperCase()}
                                </div>
                                {item.name || item.username}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-slate-500">@{item.username}</td>
                            <td className="py-4 px-6 text-slate-500">{item.email}</td>
                            <td className="py-4 px-6 text-slate-500">{item.mobile || '—'}</td>
                            <td className="py-4 px-6 font-semibold dark:text-gray-300 text-slate-700">
                              <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 uppercase tracking-wide text-[10px]">
                                {item.role?.name?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                item.status === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : item.status === 'PENDING'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-end gap-2">
                                {activeTab === 'approvals' ? (
                                  <>
                                    <select
                                      value={selectedDepartments[item.id] || ''}
                                      onChange={(e) => handleDepartmentChange(item.id, e.target.value)}
                                      className="py-1.5 px-2 rounded-lg text-[10px] font-bold tracking-wider bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300 outline-none"
                                    >
                                      <option value="" disabled>Select Dept</option>
                                      <option value="Operations">Operations</option>
                                      <option value="Logistics">Logistics</option>
                                      <option value="Education">Education</option>
                                      <option value="HR">HR</option>
                                      <option value="Finance">Finance</option>
                                    </select>
                                    <button
                                      onClick={() => {
                                        if (!selectedDepartments[item.id]) {
                                          toast.error("Please select a department before approving.");
                                          return;
                                        }
                                        handleStatusUpdate(item.id, 'ACTIVE');
                                      }}
                                      disabled={actionLoading === item.id}
                                      className="py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all hover:scale-105 active:scale-100"
                                    >
                                      {actionLoading === item.id ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleStatusUpdate(item.id, 'REJECTED')}
                                      disabled={actionLoading === item.id}
                                      className="py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all hover:scale-105 active:scale-100"
                                    >
                                      {actionLoading === item.id ? <Loader2 size={12} className="animate-spin" /> : <UserX size={12} />}
                                      Reject
                                    </button>
                                    {item.id !== currentUser?.id && (
                                      <button
                                        onClick={() => handleDeleteUser(item.id)}
                                        disabled={actionLoading === item.id}
                                        className="py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 bg-[#f43f5e]/10 hover:bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/20 transition-all hover:scale-105 cursor-pointer"
                                      >
                                        <Trash2 size={12} />
                                        Delete
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {item.status !== 'ACTIVE' ? (
                                      <button
                                        onClick={() => handleStatusUpdate(item.id, 'ACTIVE')}
                                        disabled={actionLoading === item.id}
                                        className="py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all hover:scale-105"
                                      >
                                        {actionLoading === item.id ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                                        Activate
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleStatusUpdate(item.id, 'INACTIVE')}
                                        disabled={actionLoading === item.id}
                                        className="py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 bg-slate-500/10 hover:bg-slate-500/20 text-slate-500 border border-slate-500/20 transition-all hover:scale-105"
                                      >
                                        {actionLoading === item.id ? <Loader2 size={12} className="animate-spin" /> : <UserX size={12} />}
                                        Deactivate
                                      </button>
                                    )}
                                    <button
                                      onClick={() => setSelectedUser(item)}
                                      className="py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300 dark:border-white/10 border border-slate-200 text-slate-600 transition-all hover:scale-105"
                                    >
                                      <ShieldAlert size={12} />
                                      Edit Permissions
                                    </button>
                                    {item.id !== currentUser?.id && activeTab === 'deactivated' && (
                                      <button
                                        onClick={() => handleDeleteUser(item.id)}
                                        disabled={actionLoading === item.id}
                                        className="py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 bg-[#f43f5e]/10 hover:bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/20 transition-all hover:scale-105 cursor-pointer"
                                      >
                                        <Trash2 size={12} />
                                        Delete
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ROLES TAB */}
          {activeTab === 'roles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map(roleItem => {
                const isAdmin = roleItem.name === 'ADMIN';

                return (
                  <motion.div
                    key={roleItem.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-3xl border dark:border-white/5 border-slate-200 bg-white dark:bg-[#0d1320] flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                          <Shield size={20} />
                        </div>
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          roleItem.displayInRegister
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-500/10 text-slate-500'
                        }`}>
                          {roleItem.displayInRegister ? 'Register Visible' : 'Hidden Role'}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold dark:text-white text-slate-800">
                        {roleItem.name.replace('_', ' ')}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {roleItem.description || 'Provides default capability profile inside system apps.'}
                      </p>
                    </div>

                    {!isAdmin && (
                      <div className="flex gap-2 mt-6">
                        <button
                          onClick={() => setSelectedRole(roleItem)}
                          className="flex-grow py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 bg-[#1a7a5e]/15 text-[#1a7a5e] hover:bg-[#1a7a5e]/25 border border-[#1a7a5e]/10 transition-colors"
                        >
                          <ShieldAlert size={12} />
                          Permissions
                        </button>
                        <button
                          onClick={() => handleDeleteRole(roleItem.id)}
                          className="py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/10 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Permissions modals */}
      <UserPermissionsModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
        isDarkMode={isDarkMode}
        token={token}
      />

      <RolePermissionsModal
        isOpen={!!selectedRole}
        onClose={() => setSelectedRole(null)}
        role={selectedRole}
        isDarkMode={isDarkMode}
        token={token}
      />

      <AddRoleModal
        isOpen={isAddRoleOpen}
        onClose={() => setIsAddRoleOpen(false)}
        isDarkMode={isDarkMode}
        token={token}
        onRoleAdded={(newRole) => setRoles(prev => [...prev, newRole])}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteItemId(null);
        }}
        onConfirm={handleConfirmDeleteRole}
        title="Delete Role"
        message="Are you sure you want to delete this role? This action is permanent and cannot be undone."
      />

      <ConfirmDeleteModal
        isOpen={deleteUserModalOpen}
        onClose={() => {
          setDeleteUserModalOpen(false);
          setDeleteUserId(null);
        }}
        onConfirm={handleConfirmDeleteUser}
        title="Delete User Account"
        message="Are you sure you want to delete this user? All corresponding profile records, goals, and evaluations will be permanently deleted. This action cannot be undone."
      />
      
    </div>
  );
}
