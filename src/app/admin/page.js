"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminAccessControl() {
  const [simulatedRole, setSimulatedRole] = useState("Super Admin");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState("User Management");

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([
    {
      icon: "key",
      iconColor: "text-primary border-primary",
      title: "Role Elevated",
      detail: (
        <>
          Super Admin <span className="font-semibold text-on-surface">J. Doe</span> changed role of{" "}
          <span className="font-semibold text-on-surface">T. Smith</span> to Program Mgr.
        </>
      ),
      time: "10 mins ago",
    },
    {
      icon: "warning",
      iconColor: "text-secondary border-secondary",
      title: "Failed Login Attempt",
      detail: (
        <>
          3 failed attempts detected from IP 192.168.1.45 for user{" "}
          <span className="font-semibold text-on-surface">admin_root</span>.
        </>
      ),
      time: "1 hour ago",
    },
    {
      icon: "person_add",
      iconColor: "text-on-surface-variant border-surface-variant",
      title: "New User Invited",
      detail: (
        <>
          System sent invitation email to{" "}
          <span className="font-semibold text-on-surface">new.hire@aman.org</span>.
        </>
      ),
      time: "3 hours ago",
    },
  ]);

  const [users, setUsers] = useState([
    {
      initials: "AS",
      name: "Aisha Sharma",
      email: "aisha.s@aman.org",
      role: "Program Mgr",
      status: "Active",
      statusClass: "bg-primary-fixed text-on-primary-fixed",
    },
    {
      initials: "RK",
      name: "Rahul Kumar",
      email: "rahul.k@aman.org",
      role: "Field Officer",
      status: "On Leave",
      statusClass: "bg-secondary-fixed text-on-secondary-fixed",
    },
    {
      initials: "MF",
      name: "Maria Fernandez",
      email: "maria.f@aman.org",
      role: "Super Admin",
      status: "Active",
      statusClass: "bg-primary-fixed text-on-primary-fixed",
    },
  ]);

  // Form states
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("Program Mgr");

  const handleInviteUser = (e) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const initials = newUserName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

    const newUser = {
      initials,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      status: "Active",
      statusClass: "bg-primary-fixed text-on-primary-fixed",
    };

    setUsers([newUser, ...users]);

    // Add security audit trail log
    const newLog = {
      icon: "person_add",
      iconColor: "text-primary border-primary",
      title: "New User Invited",
      detail: (
        <>
          System Admin invited <span className="font-semibold text-on-surface">{newUserName}</span> (
          {newUserEmail}) as {newUserRole}.
        </>
      ),
      time: "Just now",
    };
    setAuditLogs([newLog, ...auditLogs]);

    setNewUserName("");
    setNewUserEmail("");
    setNewUserRole("Program Mgr");
    setShowInviteModal(false);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-grow flex flex-col overflow-y-auto max-w-7xl mx-auto w-full p-6 md:p-10 pb-24">
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

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-primary text-xs uppercase tracking-[0.05em] font-bold mb-2 block font-sans">
            Administration Module
          </p>
          <h2 className="text-3xl md:text-[2.75rem] font-headline font-semibold tracking-tight leading-none text-on-surface">
            Control Center &amp; Access Controls
          </h2>
          <p className="text-on-surface-variant font-body mt-2 text-sm">
            Simulate multi-level access hierarchies, manage users, configure default settings, and track system audits.
          </p>
        </div>
      </div>

      {/* Role Switcher Simulator (Proposal Section 2.10) */}
      <div className="bg-primary/5 rounded-xl p-6 border border-primary/20 mb-8 font-sans flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full"></div>
        <div className="relative z-10">
          <h3 className="font-bold text-base text-on-surface">Access Role Simulator Switcher</h3>
          <p className="text-xs text-on-surface-variant mt-1">Select a role to simulate permissions and data visibility limits across panels.</p>
        </div>
        <div className="relative z-10 font-sans text-sm">
          <select
            value={simulatedRole}
            onChange={(e) => setSimulatedRole(e.target.value)}
            className="px-4 py-2 border rounded-full focus:outline-none focus:border-primary border-outline-variant bg-transparent font-semibold cursor-pointer dark:bg-slate-900 text-on-surface"
          >
            <option value="Super Admin">Super Admin (All Access)</option>
            <option value="Program Manager">Program Manager (Read-Write Hubs)</option>
            <option value="Field Officer">Field Officer (View Only Hubs)</option>
            <option value="Viewer">Viewer (Read Only Overview)</option>
          </select>
        </div>
      </div>

      {/* Dynamic Role Capability Warning Banner */}
      <div className="p-4 rounded-xl flex items-center justify-between border font-sans mb-8 bg-secondary-container/20 border-secondary/30 text-secondary">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined shrink-0 text-secondary">shield_person</span>
          <p className="text-xs md:text-sm font-semibold">
            <strong>[{simulatedRole} Permissions Active]</strong> {
              simulatedRole === "Super Admin" ? "Full administration privileges. All system actions, user invites, settings adjustments, and audit reports are unlocked." :
              simulatedRole === "Program Manager" ? "Moderate access. You can register beneficiaries and launch programs, but system-wide setting configurations and database resets are locked." :
              simulatedRole === "Field Officer" ? "Standard access. You can view records and input details in Livelihood/Education hubs, but user invitation and leave approvals are locked." :
              "Read-only visibility across hubs. No write or approval actions can be executed."
            }
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-container-highest mb-8 overflow-x-auto no-scrollbar font-sans">
        {["User Management", "Simulated Donor Progress View", "System settings & alerts", "Security Audit Logs"].map((tab) => {
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
        
        {/* Main Panel */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 min-h-[450px]">
          {activeTab === "User Management" && (
            <div>
              <div className="flex justify-between items-center mb-6 bg-surface-container-lowest">
                <h3 className="font-headline text-lg font-semibold text-on-surface">User Directory</h3>
                {simulatedRole === "Super Admin" && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-primary-container transition-colors font-sans cursor-pointer"
                  >
                    Invite User
                  </button>
                )}
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-sm">
                  <thead>
                    <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, i) => (
                      <tr key={i} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-4 px-4 font-bold text-on-surface">{u.name}</td>
                        <td className="py-4 px-4 text-on-surface-variant">{u.role}</td>
                        <td className="py-4 px-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${u.statusClass}`}>
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Simulated Donor Progress View" && (
            <div className="space-y-6">
              <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Simulated Donor Dashboards View</h3>
              
              {/* Financial Support card */}
              <div className="bg-surface p-5 rounded-lg border border-surface-container-high grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-sm">
                <div>
                  <span className="text-on-surface-variant block mb-1 font-medium">Total Grant Funding Support</span>
                  <span className="font-headline text-2xl font-black text-primary">$250,000</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block mb-1 font-medium">Linked Active Programs</span>
                  <span className="font-semibold text-on-surface">Education Phonics Drive, Sugarcane Phase 2</span>
                </div>
              </div>

              {/* Progress Milestones */}
              <div className="space-y-3 pl-2 border-l-2 border-surface-container">
                <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-2">Funded Program Goals</p>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm text-primary">check_box</span>
                  <span className="text-sm text-on-surface-variant">Classrooms builds at Oakridge Academy completed</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm text-primary">check_box</span>
                  <span className="text-sm text-on-surface-variant">45 fellows deployed in North District</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm text-on-surface-variant">check_box_outline_blank</span>
                  <span className="text-sm text-on-surface">Water drip setups in Wardha Maharashtra (75% Complete)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "System settings & alerts" && (
            <div className="space-y-6 font-sans">
              <h3 className="font-headline font-bold text-xl text-on-surface">System Configuration &amp; Alert settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Default Alert Notification Channel</label>
                  <select className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface">
                    <option>Email and Portal Alerts</option>
                    <option>SMS and Email</option>
                    <option>Portal Alerts Only</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Daily database Auto-Backup</label>
                  <select className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface">
                    <option>Enabled (02:00 AM)</option>
                    <option>Disabled</option>
                  </select>
                </div>
              </div>
              <button className="bg-primary text-white text-xs font-semibold px-6 py-2.5 rounded-full hover:bg-primary-container transition-colors cursor-pointer">
                Save System Configurations
              </button>
            </div>
          )}

          {activeTab === "Security Audit Logs" && (
            <div className="space-y-6 relative pl-4 border-l-2 border-surface-container font-sans text-sm">
              <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Security Audit logs</h3>
              {auditLogs.map((log, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className={`w-8 h-8 rounded-full bg-surface-container-lowest border-2 flex items-center justify-center relative z-10 shrink-0 ${log.iconColor}`}>
                    <span className="material-symbols-outlined text-[16px]">{log.icon}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-on-surface">{log.title}</div>
                    <div className="text-xs text-on-surface-variant mt-1 leading-relaxed">{log.detail}</div>
                    <div className="text-[10px] font-label uppercase tracking-widest text-outline mt-2">
                      {log.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Status Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 font-sans text-sm">
            <h3 className="font-headline font-bold text-base text-on-surface mb-4 font-sans">Role distribution</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant font-medium">Super Admins</span>
                <span className="font-bold text-on-surface">2 Active</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant font-medium">Program Managers</span>
                <span className="font-bold text-on-surface">12 Active</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant font-medium">Field Officers</span>
                <span className="font-bold text-on-surface">34 Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Staff Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Invite New Staff / User</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleInviteUser} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Timothy Smith"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Corporate Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. timothy.s@aman.org"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Account Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface"
                >
                  <option value="Program Mgr">Program Mgr</option>
                  <option value="Field Officer">Field Officer</option>
                  <option value="System Admin">System Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                >
                  Invite User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
