"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

export default function HrEmployeeManagement() {
  const router = useRouter();
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Toast Notification State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.data || []);
      }
    } catch (err) {
      triggerToast("Error fetching data");
    } finally {
      setIsLoading(false);
    }
  };

  // Team Directory Filter States
  const [directorySearch, setDirectorySearch] = useState("");
  const [directoryDept, setDirectoryDept] = useState("All");

  const filteredEmployees = useMemo(() => {
    return users.filter((u) => {
      // Only approved users (ACTIVE) and non-admin
      if (u.status !== 'ACTIVE' || u.role?.name === 'ADMIN') return false;
      
      const matchesSearch =
        u.name?.toLowerCase().includes(directorySearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(directorySearch.toLowerCase()) ||
        u.role?.name?.toLowerCase().includes(directorySearch.toLowerCase());
      
      const dept = u.department || 'Unassigned';
      const matchesDept = directoryDept === "All" || dept === directoryDept;
      
      return matchesSearch && matchesDept;
    });
  }, [users, directorySearch, directoryDept]);

  const handleRowClick = (user) => {
    setSelectedUser({ ...user });
    setShowProfileModal(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: selectedUser.name,
          email: selectedUser.email,
          department: selectedUser.department
        })
      });
      if (res.ok) {
        triggerToast("Profile updated successfully");
        setShowProfileModal(false);
        fetchData();
      } else {
        triggerToast("Failed to update profile");
      }
    } catch (err) {
      triggerToast("Error updating profile");
    }
  };

  // Team Directory Logic only

  return (
    <div className="p-6 md:p-10 flex-grow flex flex-col overflow-y-auto max-w-7xl mx-auto w-full">
      <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit">
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">arrow_back</span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">Back to Dashboard</span>
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-primary text-xs uppercase tracking-[0.05em] font-bold mb-2 block font-sans">Administration Module</p>
          <h2 className="text-3xl md:text-[2.75rem] font-headline font-semibold tracking-tight leading-none text-on-surface">Human Resources &amp; Personnel</h2>
        </div>
      </div>

      <div className="flex border-b border-surface-container-highest mb-8 overflow-x-auto no-scrollbar font-sans">
        <div className="px-6 py-3 text-sm whitespace-nowrap transition-colors font-semibold text-primary border-b-2 border-primary cursor-default">
          Team Directory
        </div>
        <Link href="/hr/attendance" className="px-6 py-3 text-sm whitespace-nowrap transition-colors font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 border-b-2 border-transparent">
          Attendance Logs
        </Link>
        <Link href="/hr/leaves" className="px-6 py-3 text-sm whitespace-nowrap transition-colors font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 border-b-2 border-transparent">
          Leave Workflow
        </Link>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 min-h-[450px]">
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h3 className="font-headline font-bold text-xl text-on-surface">Staff &amp; Employee Directory</h3>
              <span className="text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full font-semibold">
                {filteredEmployees.length} employee{filteredEmployees.length !== 1 && "s"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-surface rounded-xl p-4 border border-outline-variant/5">
              <input
                type="text"
                placeholder="Search name, role, email..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary bg-transparent text-sm text-on-surface"
              />
              <select
                value={directoryDept}
                onChange={(e) => setDirectoryDept(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary bg-transparent text-sm text-on-surface dark:bg-slate-900"
              >
                <option value="All">All Departments</option>
                <option value="Operations">Operations</option>
                <option value="Logistics">Logistics</option>
                <option value="Education">Education</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Unassigned">Unassigned</option>
              </select>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-sm">
                <thead>
                  <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} onClick={() => handleRowClick(emp)} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors cursor-pointer">
                      <td className="py-4 px-4 font-bold text-on-surface">{emp.name || emp.username}</td>
                      <td className="py-4 px-4 text-xs text-on-surface-variant">{emp.email}</td>
                      <td className="py-4 px-4 text-on-surface-variant">{emp.department || "Unassigned"}</td>
                      <td className="py-4 px-4 text-xs font-semibold text-slate-500">{emp.role?.name?.replace("_", " ")}</td>
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-on-surface-variant">No employees found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </div>

      {showProfileModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">User Profile</h3>
              <button onClick={() => setShowProfileModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</label>
                <input
                  type="text"
                  value={selectedUser.name || ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  value={selectedUser.email || ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Role (Read Only)</label>
                <input
                  type="text"
                  value={selectedUser.role?.name?.replace("_", " ") || ""}
                  disabled
                  className="px-4 py-2 border rounded-lg border-outline-variant bg-slate-50 text-slate-500 dark:bg-slate-800"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</label>
                <select
                  value={selectedUser.department || ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, department: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface"
                >
                  <option value="">Unassigned</option>
                  <option value="Operations">Operations</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Education">Education</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowProfileModal(false)} className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal removed from here as it belongs to Attendance Logs */}

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-semibold z-[200]">
          <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
