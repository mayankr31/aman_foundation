"use client";

import Link from "next/link";
import { useState } from "react";

export default function HrEmployeeManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState("Team Directory");
  const [leaveStatus, setLeaveStatus] = useState("Pending");

  // Toast Notification State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Employees dummy database
  const [employees, setEmployees] = useState([
    {
      id: "EMP-082",
      name: "Sarah Jenkins",
      role: "Field Operations Lead",
      department: "Operations",
      status: "Active Mission",
      statusClass: "bg-primary-fixed text-on-primary-fixed",
      attendance: "09:02 AM",
      leavesUsed: 4,
      sopSigned: true,
      email: "sarah.jenkins@amanfoundation.org",
    },
    {
      id: "EMP-104",
      name: "David Chen",
      role: "Relief Coordinator",
      department: "Logistics",
      status: "In Office",
      statusClass: "bg-surface-container-high text-on-surface",
      attendance: "08:58 AM",
      leavesUsed: 8,
      sopSigned: true,
      email: "david.chen@amanfoundation.org",
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
      email: "maria.lopez@amanfoundation.org",
    },
    {
      id: "EMP-201",
      name: "Ahsan Kamal",
      role: "Field Representative",
      department: "Operations",
      status: "Active Mission",
      statusClass: "bg-primary-fixed text-on-primary-fixed",
      attendance: "08:45 AM",
      leavesUsed: 3,
      sopSigned: true,
      email: "ahsan.kamal@amanfoundation.org",
    },
    {
      id: "EMP-205",
      name: "Ibrahim Khan",
      role: "Logistics Specialist",
      department: "Logistics",
      status: "In Office",
      statusClass: "bg-surface-container-high text-on-surface",
      attendance: "08:50 AM",
      leavesUsed: 2,
      sopSigned: true,
      email: "ibrahim.khan@amanfoundation.org",
    },
    {
      id: "EMP-206",
      name: "Darshan Mohankar",
      role: "Area Manager",
      department: "Operations",
      status: "In Office",
      statusClass: "bg-surface-container-high text-on-surface",
      attendance: "09:15 AM",
      leavesUsed: 5,
      sopSigned: true,
      email: "darshan.mohankar@amanfoundation.org",
    },
    {
      id: "EMP-207",
      name: "Minakshi Kansare",
      role: "Health Educator",
      department: "Education",
      status: "On Leave",
      statusClass: "bg-surface-container-high text-on-surface",
      attendance: "On Leave",
      leavesUsed: 7,
      sopSigned: true,
      email: "minakshi.kansare@amanfoundation.org",
    },
    {
      id: "EMP-208",
      name: "Aman Sharma",
      role: "HR Director",
      department: "HR",
      status: "In Office",
      statusClass: "bg-surface-container-high text-on-surface",
      attendance: "08:30 AM",
      leavesUsed: 1,
      sopSigned: true,
      email: "aman.sharma@amanfoundation.org",
    },
    {
      id: "EMP-209",
      name: "Priya Das",
      role: "Finance Officer",
      department: "Finance",
      status: "In Office",
      statusClass: "bg-surface-container-high text-on-surface",
      attendance: "09:00 AM",
      leavesUsed: 0,
      sopSigned: true,
      email: "priya.das@amanfoundation.org",
    }
  ]);

  // Team Directory Filter States
  const [directorySearch, setDirectorySearch] = useState("");
  const [directoryDept, setDirectoryDept] = useState("All");
  const [directoryStatus, setDirectoryStatus] = useState("All");

  // Attendance Logs State (Image 1 style)
  const [attendanceLogs, setAttendanceLogs] = useState([
    {
      id: "att-1",
      email: "mayuriaoti@gmail.com",
      status: "Working: 7h 14m",
      statusType: "working", // green
      workHours: "7h 14m",
      loginTime: "N/A",
      tasks: "1 tasks",
      lastUpdated: "11:41:15 PM",
    },
    {
      id: "att-2",
      email: "muralikade@gmail.com",
      status: "No Data",
      statusType: "nodata", // red
      workHours: "N/A",
      loginTime: "N/A",
      tasks: "No tasks",
      lastUpdated: "11:41:15 PM",
    },
    {
      id: "att-3",
      email: "nathajisadhana188@gmail.com",
      status: "No Data",
      statusType: "nodata", // red
      workHours: "N/A",
      loginTime: "N/A",
      tasks: "No tasks",
      lastUpdated: "11:41:15 PM",
    },
    {
      id: "att-4",
      email: "pavan.yafdsv@gmail.com",
      status: "Logged in at 12:30",
      statusType: "loggedin", // blue
      workHours: "Calculating...",
      loginTime: "12:30",
      tasks: "2 tasks",
      lastUpdated: "11:41:15 PM",
    },
    {
      id: "att-5",
      email: "pooja.gramurja@gmail.com",
      status: "No Data",
      statusType: "nodata", // red
      workHours: "N/A",
      loginTime: "N/A",
      tasks: "No tasks",
      lastUpdated: "11:41:15 PM",
    },
    {
      id: "att-6",
      email: "pratibhadesmukh672@gmail.com",
      status: "Working: 7h 3m",
      statusType: "working", // green
      workHours: "7h 3m",
      loginTime: "N/A",
      tasks: "3 tasks",
      lastUpdated: "11:41:16 PM",
    },
    {
      id: "att-7",
      email: "sagarbhagat2020@gmail.com",
      status: "No Data",
      statusType: "nodata", // red
      workHours: "N/A",
      loginTime: "N/A",
      tasks: "No tasks",
      lastUpdated: "11:41:15 PM",
    },
    {
      id: "att-8",
      email: "samyashaikh150@gmail.com",
      status: "No Data",
      statusType: "nodata", // red
      workHours: "N/A",
      loginTime: "N/A",
      tasks: "No tasks",
      lastUpdated: "11:41:15 PM",
    }
  ]);

  const handleDeleteLog = (id, email) => {
    setAttendanceLogs(prev => prev.filter(log => log.id !== id));
    triggerToast(`Attendance log for ${email} deleted.`);
  };

  // Leave Workflow State (Image 2 style)
  const [leaveApprovals, setLeaveApprovals] = useState([
    {
      id: "leave-1",
      coach: "Ahsan Kamal",
      type: "Casual Leave",
      requestedDates: "2026-06-02 to 2026-06-04",
      leavesTaken: 1,
      leavesRemaining: 14,
      status: "APPROVED"
    },
    {
      id: "leave-2",
      coach: "Ibrahim Khan",
      type: "Casual Leave",
      requestedDates: "2026-05-30",
      leavesTaken: 0,
      leavesRemaining: 15,
      status: "REJECTED"
    },
    {
      id: "leave-3",
      coach: "Darshan Mohankar",
      type: "Casual Leave",
      requestedDates: "2026-06-02",
      leavesTaken: 0,
      leavesRemaining: 15,
      status: "REJECTED"
    },
    {
      id: "leave-4",
      coach: "Minakshi Kansare",
      type: "Sick Leave",
      requestedDates: "2026-06-02",
      leavesTaken: 1,
      leavesRemaining: 14,
      status: "REJECTED"
    },
    {
      id: "leave-5",
      coach: "Minakshi Kansare",
      type: "Sick Leave",
      requestedDates: "2026-05-25",
      leavesTaken: 1,
      leavesRemaining: 14,
      status: "APPROVED"
    },
    {
      id: "leave-6",
      coach: "Sarah Jenkins",
      type: "Casual Leave",
      requestedDates: "2026-06-10 to 2026-06-12",
      leavesTaken: 4,
      leavesRemaining: 12,
      status: "PENDING"
    },
    {
      id: "leave-7",
      coach: "David Chen",
      type: "Sick Leave",
      requestedDates: "2026-06-15",
      leavesTaken: 8,
      leavesRemaining: 8,
      status: "PENDING"
    }
  ]);

  // Leave Workflow Filter States
  const [leaveSearch, setLeaveSearch] = useState("");
  const [leaveStatusFilter, setLeaveStatusFilter] = useState("ALL");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");

  const handleApproveLeave = (id, coach) => {
    setLeaveApprovals(prev => prev.map(l => l.id === id ? { ...l, status: "APPROVED", leavesTaken: l.leavesTaken + 1, leavesRemaining: Math.max(0, l.leavesRemaining - 1) } : l));
    triggerToast(`Approved leave request for ${coach}`);
  };

  const handleRejectLeave = (id, coach) => {
    setLeaveApprovals(prev => prev.map(l => l.id === id ? { ...l, status: "REJECTED" } : l));
    triggerToast(`Rejected leave request for ${coach}`);
  };

  const handleExportLeave = () => {
    triggerToast("Exporting leave records to CSV...");
  };

  // Form states
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newDept, setNewDept] = useState("Operations");
  const [newStatus, setNewStatus] = useState("In Office");

  const handleNewHire = (e) => {
    e.preventDefault();
    if (!newName || !newRole) return;

    const email = `${newName.toLowerCase().replace(/\s+/g, ".")}@amanfoundation.org`;
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
      email: email,
    };

    setEmployees([...employees, newEmp]);
    setNewName("");
    setNewRole("");
    setNewDept("Operations");
    setNewStatus("In Office");
    setShowAddModal(false);
    triggerToast(`Successfully registered new hire: ${newName}`);
  };

  // Directory filter logic
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
      emp.role.toLowerCase().includes(directorySearch.toLowerCase()) ||
      emp.department.toLowerCase().includes(directorySearch.toLowerCase()) ||
      emp.id.toLowerCase().includes(directorySearch.toLowerCase());
    const matchesDept = directoryDept === "All" || emp.department === directoryDept;
    const matchesStatus = directoryStatus === "All" || emp.status === directoryStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Leave approvals filter logic
  const filteredLeaves = leaveApprovals.filter((l) => {
    const matchesSearch = l.coach.toLowerCase().includes(leaveSearch.toLowerCase()) ||
                          l.type.toLowerCase().includes(leaveSearch.toLowerCase());
    const matchesStatus = leaveStatusFilter === "ALL" || l.status === leaveStatusFilter;
    
    let matchesDates = true;
    if (leaveStartDate) {
      matchesDates = matchesDates && l.requestedDates >= leaveStartDate;
    }
    if (leaveEndDate) {
      matchesDates = matchesDates && l.requestedDates <= leaveEndDate;
    }

    return matchesSearch && matchesStatus && matchesDates;
  });

  // Status Badge Rendering Helper (Image 1 style)
  const renderStatusPill = (statusType, statusText) => {
    let dotColor = "";
    let badgeClass = "";
    if (statusType === "working") {
      dotColor = "bg-emerald-500 animate-pulse";
      badgeClass = "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30";
    } else if (statusType === "nodata") {
      dotColor = "bg-rose-500";
      badgeClass = "bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30";
    } else {
      dotColor = "bg-blue-500";
      badgeClass = "bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30";
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
        <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
        {statusText}
      </span>
    );
  };

  // Leave Status Pill Rendering Helper (Image 2 style)
  const renderLeaveStatusPill = (status) => {
    if (status === "APPROVED") {
      return (
        <span className="inline-block px-2.5 py-1 rounded font-bold tracking-widest text-[9px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-400">
          APPROVED
        </span>
      );
    } else if (status === "REJECTED") {
      return (
        <span className="inline-block px-2.5 py-1 rounded font-bold tracking-widest text-[9px] bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-400">
          REJECTED
        </span>
      );
    } else {
      return (
        <span className="inline-block px-2.5 py-1 rounded font-bold tracking-widest text-[9px] bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-400">
          PENDING
        </span>
      );
    }
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
            Manage employee databases, daily attendance tracking, approval workflows, and standard operating procedures (SOP).
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-label uppercase tracking-widest text-xs px-6 py-3 rounded-full hover:opacity-90 transition-opacity shadow-ambient flex items-center gap-2 cursor-pointer font-sans shrink-0 animate-fade-in"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          New Hire Registration
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-container-highest mb-8 overflow-x-auto no-scrollbar font-sans">
        {[
          "Team Directory",
          "Attendance Logs",
          "Leave Workflow",
          "SOP acknowledged registers",
          "HR Reports & headcount"
        ].map((tab) => {
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

      {/* Tab Contents Layout - Conditional Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Content Column */}
        <div className={`${
          activeTab === "Team Directory" || activeTab === "Attendance Logs" || activeTab === "Leave Workflow"
            ? "lg:col-span-12"
            : "lg:col-span-8"
        } bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 min-h-[450px] transition-all`}>
          
          {/* TEAM DIRECTORY TAB */}
          {activeTab === "Team Directory" && (
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h3 className="font-headline font-bold text-xl text-on-surface">Staff &amp; Employee Directory</h3>
                <span className="text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full font-semibold">
                  {filteredEmployees.length} employee{filteredEmployees.length !== 1 && "s"} found
                </span>
              </div>

              {/* Filters Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-surface rounded-xl p-4 border border-outline-variant/5">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
                  <input
                    type="text"
                    placeholder="Search name, role, ID..."
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-surface-container rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest text-sm text-on-surface"
                  />
                </div>
                
                <div>
                  <select
                    value={directoryDept}
                    onChange={(e) => setDirectoryDept(e.target.value)}
                    className="w-full px-3 py-2 border border-surface-container rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest text-sm text-on-surface dark:bg-slate-900"
                  >
                    <option value="All">All Departments</option>
                    <option value="Operations">Operations</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Education">Education</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div>
                  <select
                    value={directoryStatus}
                    onChange={(e) => setDirectoryStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-surface-container rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest text-sm text-on-surface dark:bg-slate-900"
                  >
                    <option value="All">All Statuses</option>
                    <option value="In Office">In Office</option>
                    <option value="Active Mission">Active Mission</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              {/* Employees Table */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-sm">
                  <thead>
                    <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                      <th className="py-3 px-4">Employee ID</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-4 px-4 font-mono text-xs font-semibold text-slate-500">{emp.id}</td>
                          <td className="py-4 px-4 font-bold text-on-surface">{emp.name}</td>
                          <td className="py-4 px-4 text-xs text-on-surface-variant">{emp.email}</td>
                          <td className="py-4 px-4 text-on-surface-variant">{emp.department}</td>
                          <td className="py-4 px-4 text-xs font-semibold text-slate-500">{emp.role}</td>
                          <td className="py-4 px-4 text-right">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${emp.statusClass}`}>
                              {emp.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-on-surface-variant">
                          No employees matched the search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ATTENDANCE LOGS TAB */}
          {activeTab === "Attendance Logs" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline font-bold text-xl text-on-surface">Daily Attendance Ledger</h3>
                <span className="text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full font-semibold">
                  {attendanceLogs.length} Records
                </span>
              </div>
              
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-sm">
                  <thead>
                    <tr className="border-b border-surface-container text-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Work Hours</th>
                      <th className="py-3 px-4">Login Time</th>
                      <th className="py-3 px-4">Daily Tasks</th>
                      <th className="py-3 px-4">Last Updated</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLogs.length > 0 ? (
                      attendanceLogs.map((log) => {
                        const initial = log.email.charAt(0).toUpperCase();
                        const hasTasks = log.tasksCount !== 0 && log.tasks !== "No tasks";
                        return (
                          <tr key={log.id} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors">
                            {/* Employee */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-sm shrink-0">
                                  {initial}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-on-surface text-[13px]">{log.email}</span>
                                  <span className="text-[11px] text-on-surface-variant/70">{log.email}</span>
                                </div>
                              </div>
                            </td>

                            {/* Status badge */}
                            <td className="py-4 px-4">
                              {renderStatusPill(log.statusType, log.status)}
                            </td>

                            {/* Work Hours */}
                            <td className="py-4 px-4 text-on-surface font-medium text-xs">
                              {log.workHours}
                            </td>

                            {/* Login Time */}
                            <td className="py-4 px-4 text-on-surface text-xs font-semibold">
                              {log.loginTime}
                            </td>

                            {/* Daily Tasks */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1.5 text-xs font-medium">
                                {hasTasks ? (
                                  <>
                                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">check_box</span>
                                    <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">{log.tasks}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-rose-600 dark:text-rose-400 text-[18px]">close</span>
                                    <span className="text-slate-400 dark:text-slate-500">{log.tasks}</span>
                                  </>
                                )}
                              </div>
                            </td>

                            {/* Last Updated */}
                            <td className="py-4 px-4 text-[11px] font-mono text-slate-500">
                              {log.lastUpdated}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 text-right">
                              <div className="flex justify-end gap-3 text-xs font-bold font-sans">
                                <button 
                                  onClick={() => triggerToast(`Viewing attendance log for ${log.email}`)}
                                  className="text-blue-600 hover:underline hover:opacity-85 cursor-pointer"
                                >
                                  View
                                </button>
                                <button 
                                  onClick={() => handleDeleteLog(log.id, log.email)}
                                  className="text-rose-600 hover:underline hover:opacity-85 cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-on-surface-variant">
                          No attendance records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LEAVE WORKFLOW TAB */}
          {activeTab === "Leave Workflow" && (
            <div>
              {/* Header and counter */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-surface-container/50 pb-6">
                <div>
                  <h3 className="font-headline font-bold text-3xl text-on-surface tracking-tight">Leave Approvals</h3>
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-1.5">
                    {filteredLeaves.length} Records Found
                  </p>
                </div>

                {/* Filter and controls bar */}
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  {/* Select Date Range */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Select Date Range</span>
                    <div className="flex items-center border border-surface-container rounded-lg px-3 py-1.5 bg-surface text-xs text-on-surface">
                      <input 
                        type="date" 
                        value={leaveStartDate} 
                        onChange={(e) => setLeaveStartDate(e.target.value)} 
                        className="bg-transparent focus:outline-none text-[11px] w-28" 
                      />
                      <span className="px-2 text-slate-400 uppercase text-[9px] font-bold">To</span>
                      <input 
                        type="date" 
                        value={leaveEndDate} 
                        onChange={(e) => setLeaveEndDate(e.target.value)} 
                        className="bg-transparent focus:outline-none text-[11px] w-28" 
                      />
                    </div>
                  </div>

                  {/* Search Records */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Search Records</span>
                    <div className="relative bg-surface rounded-lg">
                      <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-base">search</span>
                      <input
                        type="text"
                        placeholder="Search records..."
                        value={leaveSearch}
                        onChange={(e) => setLeaveSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 w-44 border border-surface-container rounded-lg focus:outline-none bg-transparent text-xs text-on-surface"
                      />
                    </div>
                  </div>

                  {/* Select Status */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Select Status</span>
                    <select
                      value={leaveStatusFilter}
                      onChange={(e) => setLeaveStatusFilter(e.target.value)}
                      className="px-3 py-1.5 border border-surface-container rounded-lg focus:outline-none bg-surface text-xs text-on-surface dark:bg-slate-900 min-w-[100px]"
                    >
                      <option value="ALL">All Status</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="PENDING">PENDING</option>
                    </select>
                  </div>

                  {/* Export Button */}
                  <button
                    onClick={handleExportLeave}
                    className="flex items-center gap-1.5 bg-emerald-600/10 text-emerald-600 border border-emerald-500/20 font-bold uppercase tracking-wider text-[10px] px-4 py-2 rounded-lg hover:bg-emerald-600/20 transition-all cursor-pointer h-[32px] self-end"
                  >
                    <span className="material-symbols-outlined text-[14px]">download</span>
                    Export
                  </button>
                </div>
              </div>

              {/* Leave Approvals Table */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-sm">
                  <thead>
                    <tr className="border-b border-surface-container text-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                      <th className="py-3 px-4">Coach</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Requested Dates</th>
                      <th className="py-3 px-4">Leaves Taken</th>
                      <th className="py-3 px-4">Leaves Remaining</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaves.length > 0 ? (
                      filteredLeaves.map((l) => (
                        <tr key={l.id} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-4 px-4 font-bold text-on-surface">{l.coach}</td>
                          <td className="py-4 px-4 text-on-surface-variant font-medium text-xs">{l.type}</td>
                          <td className="py-4 px-4 font-semibold text-xs text-slate-500">{l.requestedDates}</td>
                          <td className="py-4 px-4 text-on-surface font-semibold text-xs">{l.leavesTaken}</td>
                          <td className="py-4 px-4 text-on-surface font-semibold text-xs">{l.leavesRemaining}</td>
                          <td className="py-4 px-4">{renderLeaveStatusPill(l.status)}</td>
                          <td className="py-4 px-4 text-right">
                            {l.status === "PENDING" ? (
                              <div className="flex justify-end gap-2 text-xs">
                                <button
                                  onClick={() => handleApproveLeave(l.id, l.coach)}
                                  className="px-2.5 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-semibold text-[10px] uppercase tracking-wide cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectLeave(l.id, l.coach)}
                                  className="px-2.5 py-1 bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors font-semibold text-[10px] uppercase tracking-wide cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setLeaveApprovals(prev => prev.map(item => item.id === l.id ? { ...item, status: "PENDING" } : item));
                                  triggerToast(`Reset leave request for ${l.coach} to PENDING.`);
                                }}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium text-[11px] cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-on-surface-variant">
                          No leave approvals found matching filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SOP ACKNOWLEDGED REGISTERS TAB */}
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

          {/* HR REPORTS TAB */}
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

        {/* Sidebar Info - Conditional Column */}
        {(activeTab === "SOP acknowledged registers" || activeTab === "HR Reports & headcount") && (
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
        )}
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
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
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
                  <option value="On Leave">On Leave</option>
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

      {/* Toast Notification Element */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-semibold animate-bounce z-[200]">
          <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

