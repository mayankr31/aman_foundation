"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import Pagination from "@/components/ui/Pagination";
import Avatar from "@/components/ui/Avatar";
import usePagination from "@/lib/usePagination";
import { DEPARTMENTS } from "@/lib/organization";
import { formatRoleLabel } from "@/lib/roles";

export default function HrEmployeeManagement() {
  const router = useRouter();
  const { token, can } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Toast Notification State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

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

  useEffect(() => {
    if (token) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Employees Filter States
  const [directorySearch, setDirectorySearch] = useState("");
  const [directoryDept, setDirectoryDept] = useState("All");
  const [directoryStatus, setDirectoryStatus] = useState("ACTIVE");

  const departmentOptions = useMemo(() => {
    const fromUsers = users.map((u) => u.department).filter(Boolean);
    return [...new Set([...DEPARTMENTS, ...fromUsers])].sort((a, b) => a.localeCompare(b));
  }, [users]);

  const filteredEmployees = useMemo(() => {
    return users.filter((u) => {
      // Admin accounts are managed from Admin & Access, not the HR directory.
      if (u.role?.name === 'ADMIN') return false;

      const matchesStatus =
        directoryStatus === "All"
          ? u.status === "ACTIVE" || u.status === "INACTIVE"
          : u.status === directoryStatus;

      const search = directorySearch.toLowerCase();
      const matchesSearch =
        u.name?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        u.employeeId?.toLowerCase().includes(search) ||
        u.role?.name?.toLowerCase().includes(search) ||
        formatRoleLabel(u.role?.name).toLowerCase().includes(search);
      
      const dept = u.department || 'Unassigned';
      const matchesDept = directoryDept === "All" || dept === directoryDept;
      
      return matchesStatus && matchesSearch && matchesDept;
    });
  }, [users, directorySearch, directoryDept, directoryStatus]);

  const { pageItems: pagedEmployees, currentPage, setCurrentPage } = usePagination(filteredEmployees, 10);

  const handleRowClick = (user) => {
    if (user.fellow?.id && can("education")) {
      router.push(`/education/fellows/${user.fellow.id}`);
      return;
    }
    router.push(`/hr/${user.id}`);
  };

  // Employees Logic only

  return (
    <div className="p-4 sm:p-6 md:p-10 flex-grow flex flex-col overflow-y-auto pb-24 max-w-7xl mx-auto w-full">
      <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-4 group w-fit">
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">arrow_back</span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">Back to Dashboard</span>
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-primary text-xs uppercase tracking-[0.05em] font-bold mb-2 block font-sans">Administration Module</p>
          <h2 className="page-title text-on-surface">Human Resources &amp; Personnel</h2>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 min-h-[450px]">
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h3 className="font-headline font-bold text-xl text-on-surface">Staff &amp; Employee Directory</h3>
              <span className="text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full font-semibold">
                {filteredEmployees.length} employee{filteredEmployees.length !== 1 && "s"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-surface rounded-xl p-4 border border-outline-variant/5">
              <input
                type="text"
                placeholder="Search name, role, email, ID..."
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
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
                <option value="Unassigned">Unassigned</option>
              </select>
              <select
                value={directoryStatus}
                onChange={(e) => setDirectoryStatus(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary bg-transparent text-sm text-on-surface dark:bg-slate-900"
              >
                <option value="ACTIVE">Active employees</option>
                <option value="INACTIVE">Inactive / former</option>
                <option value="All">All statuses</option>
              </select>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="mobile-card-table w-full min-w-[860px] table-fixed text-left border-collapse font-sans text-sm">
                <thead>
                  <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                    <th className="w-[24%] py-3 px-4">Name</th>
                    <th className="w-[28%] py-3 px-4">Email</th>
                    <th className="w-[16%] py-3 px-4">Department</th>
                    <th className="w-[16%] py-3 px-4">Role</th>
                    <th className="w-[16%] py-3 px-4">Reports To</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedEmployees.map((emp) => {
                    const name = emp.name || emp.username || "?";
                    const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
                    return (
                    <tr key={emp.id} onClick={() => handleRowClick(emp)} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors cursor-pointer">
                      <td data-label="" className="py-4 px-4 font-bold text-on-surface">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold">
                            <Avatar src={emp.avatar} name={name} fallback={initials} />
                          </div>
                          <div className="min-w-0">
                            <span className="break-words">{name}</span>
                            <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold tracking-wide">
                              {emp.employeeId && (
                                <span className="text-slate-400 normal-case">{emp.employeeId}</span>
                              )}
                              {emp.status === "INACTIVE" && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                  Inactive
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Email" className="py-4 px-4 text-xs text-on-surface-variant break-words">{emp.email}</td>
                      <td data-label="Department" className="py-4 px-4 text-on-surface-variant break-words">{emp.department || "Unassigned"}</td>
                      <td data-label="Role" className="py-4 px-4 text-xs font-semibold text-slate-500 break-words">{formatRoleLabel(emp.role?.name)}</td>
                      <td data-label="Reports To" className="py-4 px-4 text-xs text-slate-500 break-words">{emp.manager?.name || "—"}</td>
                    </tr>
                    );
                  })}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-on-surface-variant">No employees found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalItems={filteredEmployees.length} itemsPerPage={10} onPageChange={setCurrentPage} />
          </div>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-semibold z-[200]">
          <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
