"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

export default function HrEmployeeManagement() {
  const router = useRouter();
  const { token } = useAuth();
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

  // Employees Filter States
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
    router.push(`/hr/${user.id}`);
  };

  // Employees Logic only

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
          Employees
        </div>
        <Link href="/hr/attendance" className="px-6 py-3 text-sm whitespace-nowrap transition-colors font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 border-b-2 border-transparent">
          Attendance Logs
        </Link>
        <Link href="/hr/leaves" className="px-6 py-3 text-sm whitespace-nowrap transition-colors font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 border-b-2 border-transparent">
          Leave Requests
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
                  {filteredEmployees.map((emp) => {
                    const name = emp.name || emp.username || "?";
                    const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
                    return (
                    <tr key={emp.id} onClick={() => handleRowClick(emp)} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors cursor-pointer">
                      <td className="py-4 px-4 font-bold text-on-surface">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold">
                            {emp.avatar ? (
                              <img alt="avatar" className="w-full h-full object-cover" src={emp.avatar} />
                            ) : (
                              initials
                            )}
                          </div>
                          <span>{name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs text-on-surface-variant">{emp.email}</td>
                      <td className="py-4 px-4 text-on-surface-variant">{emp.department || "Unassigned"}</td>
                      <td className="py-4 px-4 text-xs font-semibold text-slate-500">{emp.role?.name?.replace("_", " ")}</td>
                    </tr>
                    );
                  })}
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

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-semibold z-[200]">
          <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
