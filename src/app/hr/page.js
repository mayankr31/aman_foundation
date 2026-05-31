"use client";

import Link from "next/link";
import { useState } from "react";

export default function HrEmployeeManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState("Team Directory");
  const [leaveStatus, setLeaveStatus] = useState("Pending");

  const [employees, setEmployees] = useState([
    {
      id: "EMP-082",
      name: "Sarah Jenkins",
      role: "Field Operations Lead",
      department: "Operations",
      status: "Active Mission",
      statusClass: "bg-primary-fixed text-on-primary-fixed",
      attendance: "09:02 AM (Biometric)",
      leavesUsed: 4,
      sopSigned: true,
    },
    {
      id: "EMP-104",
      name: "David Chen",
      role: "Relief Coordinator",
      department: "Logistics",
      status: "In Office",
      statusClass: "bg-surface-container-high text-on-surface",
      attendance: "08:58 AM (Biometric)",
      leavesUsed: 8,
      sopSigned: true,
    },
    {
      id: "EMP-304",
      name: "Maria Lopez",
      role: "Education Specialist",
      department: "Education",
      status: "On Leave",
      statusClass: "bg-surface-container-high text-on-surface",
      attendance: "On Leave",
      leavesUsed: 12,
      sopSigned: false,
    },
  ]);

  // Form states
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newDept, setNewDept] = useState("Operations");
  const [newStatus, setNewStatus] = useState("In Office");

  const handleNewHire = (e) => {
    e.preventDefault();
    if (!newName || !newRole) return;

    const initials = newName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

    const newEmp = {
      id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      name: newName,
      role: newRole,
      department: newDept,
      status: newStatus,
      statusClass:
        newStatus === "Active Mission"
          ? "bg-primary-fixed text-on-primary-fixed"
          : "bg-surface-container-high text-on-surface",
      attendance: "Not checked-in",
      leavesUsed: 0,
      sopSigned: false,
    };

    setEmployees([...employees, newEmp]);
    setNewName("");
    setNewRole("");
    setNewDept("Operations");
    setNewStatus("In Office");
    setShowAddModal(false);
  };

  return (
    <div className="p-6 md:p-10 flex-grow flex flex-col overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Back Link */}
      <Link
        href="/"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
          Back to Dashboard
        </span>
      </Link>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-primary text-xs uppercase tracking-[0.05em] font-bold mb-2 block font-sans">
            Administration Module
          </p>
          <h2 className="text-3xl md:text-[2.75rem] font-headline font-semibold tracking-tight leading-none text-on-surface">
            Human Resources &amp; Personnel
          </h2>
          <p className="text-on-surface-variant font-body mt-2 text-sm">
            Manage employee databases, daily biometric attendance, leave workflows, and standard operating procedures (SOP).
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-label uppercase tracking-widest text-xs px-6 py-3 rounded-full hover:opacity-90 transition-opacity shadow-ambient flex items-center gap-2 cursor-pointer font-sans shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          New Hire Registration
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-container-highest mb-8 overflow-x-auto no-scrollbar font-sans">
        {["Team Directory", "Biometric Attendance Logs", "Leave workflow & balance", "SOP acknowledged registers", "HR Reports & headcount"].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? "font-semibold text-primary border-b-2 border-primary"
                  : "font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 border-b-2 border-transparent"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 min-h-[450px]">
          {activeTab === "Team Directory" && (
            <div>
              <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Staff &amp; Employee Directory</h3>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-sm">
                  <thead>
                    <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-4 px-4 font-bold text-on-surface">{emp.name}</td>
                        <td className="py-4 px-4 text-on-surface-variant">{emp.department}</td>
                        <td className="py-4 px-4 text-xs font-semibold text-slate-500">{emp.role}</td>
                        <td className="py-4 px-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${emp.statusClass}`}>
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Biometric Attendance Logs" && (
            <div>
              <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Biometric Attendance Ledger</h3>
              <table className="w-full text-left border-collapse font-sans text-sm">
                <thead>
                  <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4 font-center">Department</th>
                    <th className="py-3 px-4">Log stamp source</th>
                    <th className="py-3 px-4 text-right">Punch-in time</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-4 px-4 font-bold text-on-surface">{emp.name}</td>
                      <td className="py-4 px-4 text-on-surface-variant">{emp.department}</td>
                      <td className="py-4 px-4 text-xs font-semibold text-slate-500">Biometric-Device-04</td>
                      <td className="py-4 px-4 text-right font-bold text-primary">{emp.attendance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "Leave workflow & balance" && (
            <div className="space-y-6">
              <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Leave approval &amp; balance workflows</h3>
              <div className="p-5 border border-surface-container rounded-lg bg-surface font-sans text-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-on-surface">Annual leave request</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">David Chen (Logistics)</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    leaveStatus === "Pending" ? "bg-secondary-container text-on-secondary-fixed" : "bg-primary-fixed text-on-primary-fixed"
                  }`}>
                    {leaveStatus}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant mb-4">Requesting leave from Oct 12 - Oct 20 (8 days). Covering fellow distributions.</p>
                {leaveStatus === "Pending" && (
                  <div className="flex gap-3">
                    <button onClick={() => setLeaveStatus("Denied")} className="px-4 py-2 border rounded-full text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer">Deny</button>
                    <button onClick={() => setLeaveStatus("Approved")} className="px-5 py-2 bg-primary text-white rounded-full text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer">Approve</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "SOP acknowledged registers" && (
            <div>
              <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Standard Operating Procedures Acknowledgment Log</h3>
              <table className="w-full text-left border-collapse font-sans text-sm">
                <thead>
                  <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-right">Safety Protocol Signed</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-4 px-4 font-bold text-on-surface">{emp.name}</td>
                      <td className="py-4 px-4 text-on-surface-variant">{emp.role}</td>
                      <td className="py-4 px-4 text-right">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                          emp.sopSigned ? "bg-primary-fixed text-on-primary-fixed" : "bg-error-container text-on-error-container"
                        }`}>
                          {emp.sopSigned ? "Acknowledged" : "Pending Signoff"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "HR Reports & headcount" && (
            <div className="space-y-8 font-sans">
              <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Headcount Distribution &amp; Leave Trends</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-sm mb-4">Department Headcount Distribution</h4>
                  <div className="space-y-4 text-xs font-medium">
                    <div className="flex items-center gap-4">
                      <span className="w-20 text-right">Operations</span>
                      <div className="flex-1 bg-surface-container h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: "60%" }}></div>
                      </div>
                      <span className="w-8 font-bold">140</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="w-20 text-right">Logistics</span>
                      <div className="flex-1 bg-surface-container h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: "30%" }}></div>
                      </div>
                      <span className="w-8 font-bold">72</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="w-20 text-right">Education</span>
                      <div className="flex-1 bg-surface-container h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: "10%" }}></div>
                      </div>
                      <span className="w-8 font-bold">24</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Leave balance checklist */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-base text-on-surface mb-4">General leave Balance Index</h3>
            <div className="space-y-3 font-sans text-sm">
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant">Casual Leaves Balance</span>
                <span className="font-semibold text-on-surface">12 Days remaining</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant">Sick Leaves Balance</span>
                <span className="font-semibold text-on-surface">8 Days remaining</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant">Earned Leaves Balance</span>
                <span className="font-semibold text-on-surface">22 Days remaining</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Hire Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Register New Employee Record</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleNewHire} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Employee Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Job Role / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Field Operations Associate"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Department
                </label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface"
                >
                  <option value="Operations">Operations</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Education">Education</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Deployment Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface"
                >
                  <option value="In Office">In Office</option>
                  <option value="Active Mission">Active Mission</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
