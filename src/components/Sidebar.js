"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";

export default function Sidebar({ isOpen, onClose, collapsed = false, onToggleCollapse }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Dropdown states
  const [eduOpen, setEduOpen] = useState(false);
  const [observationsOpen, setObservationsOpen] = useState(false);
  const [livelihoodOpen, setLivelihoodOpen] = useState(false);

  // Auto-expand active folder on path change
  useEffect(() => {
    if (
      [
        "/education",
        "/education/fellows",
        "/education/students",
        "/education/schools",
        "/education/pta",
        "/education/after-school-students",
        "/education/after-school-centres",
      ].some(path => pathname === path)
    ) {
      setEduOpen(true);
    }
    if (pathname.startsWith("/fellow-observations")) {
      setObservationsOpen(true);
    }
    if (
      [
        "/livelihood",
        "/livelihood/farm",
        "/livelihood/non-farm",
        "/livelihood/programs",
        "/beneficiaries",
      ].some(path => pathname.startsWith(path))
    ) {
      setLivelihoodOpen(true);
    }
  }, [pathname]);

  const navItemClass = (isActive) =>
    `flex items-center gap-3 py-3 px-4 rounded-full transition-all duration-300 ease-in-out ${
      collapsed ? "md:justify-center md:px-0" : ""
    } ${
      isActive
        ? "bg-teal-700 text-white shadow-lg shadow-teal-900/20"
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-900/30 font-medium"
    }`;

  const sublinkClass = (isActive) =>
    `text-xs px-3 py-2 rounded-full transition-all duration-200 ${
      isActive
        ? "text-primary bg-primary-container/10 font-semibold"
        : "text-slate-500 hover:text-primary transition-colors hover:bg-slate-200/50 font-medium"
    }`;

  // On desktop the labels hide when collapsed; on mobile they always show.
  const labelClass = collapsed ? "md:hidden" : "";

  const handleFolderToggle = (isOpenState, setOpenState) => {
    if (collapsed) {
      onToggleCollapse?.();
      setOpenState(true);
    } else {
      setOpenState(!isOpenState);
    }
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[55] md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* SideNavBar */}
      <nav
        id="side-nav"
        className={`bg-slate-50 dark:bg-slate-900 text-teal-800 dark:text-teal-400 font-sans tracking-tight text-sm font-medium h-screen w-64 fixed left-0 top-0 overflow-y-auto shadow-[8px_0_24px_rgba(0,0,0,0.04)] z-[60] flex flex-col p-6 gap-2 border-r border-slate-100 dark:border-slate-800 transition-all duration-300 ease-in-out ${
          collapsed ? "md:w-20 md:px-3" : "md:w-64"
        } ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Brand */}
        <div
          className={`flex items-center gap-3 mb-2 px-2 shrink-0 ${
            collapsed ? "md:justify-center md:px-0" : ""
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary shrink-0 ambient-shadow">
            <span className="material-symbols-outlined text-2xl icon-filled">local_library</span>
          </div>
          <div className={labelClass}>
            <h1 className="text-lg font-bold tracking-tighter text-teal-900 dark:text-teal-100 leading-tight whitespace-nowrap">
              Aman Foundation
            </h1>
            <p className="text-xs text-on-surface-variant whitespace-nowrap">Impact Portal</p>
          </div>
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`hidden md:flex items-center gap-2 mb-4 py-2 px-4 rounded-full text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-teal-700 dark:hover:text-teal-400 transition-colors cursor-pointer ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
          {!collapsed && <span className="text-xs font-semibold">Collapse</span>}
        </button>

        {/* Nav Links */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
          {/* Dashboard */}
          <Link
            href="/"
            className={navItemClass(pathname === "/")}
            onClick={onClose}
            title="Dashboard"
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className={labelClass}>Dashboard</span>
          </Link>

          {/* Education Submenu */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleFolderToggle(eduOpen, setEduOpen)}
              title="Education"
              className={`flex items-center gap-3 py-3 px-4 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-full transition-all w-full text-left font-medium ${
                collapsed ? "md:justify-center md:px-0" : "justify-between"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">school</span>
                <span className={labelClass}>Education</span>
              </div>
              {!collapsed && (
                <span
                  className={`material-symbols-outlined transition-transform duration-300 ${
                    eduOpen ? "rotate-180" : ""
                  }`}
                >
                  expand_more
                </span>
              )}
            </button>

            {eduOpen && !collapsed && (
              <div className="ml-8 mt-1 flex flex-col gap-1 border-l-2 border-primary-container pl-2 transition-all duration-300">
                {user?.roleName !== "FELLOW" && (
                  <Link
                    className={sublinkClass(pathname === "/education")}
                    href="/education"
                    onClick={onClose}
                  >
                    Hub Overview
                  </Link>
                )}
                {user?.roleName !== "FELLOW" && (
                  <Link
                    className={sublinkClass(pathname === "/education/fellows")}
                    href="/education/fellows"
                    onClick={onClose}
                  >
                    Fellows
                  </Link>
                )}
                <Link
                  className={sublinkClass(pathname === "/education/students")}
                  href="/education/students"
                  onClick={onClose}
                >
                  Students
                </Link>
                <Link
                  className={sublinkClass(pathname === "/education/schools")}
                  href="/education/schools"
                  onClick={onClose}
                >
                  Schools
                </Link>
                <Link
                  className={sublinkClass(pathname === "/education/after-school-students")}
                  href="/education/after-school-students"
                  onClick={onClose}
                >
                  After School Students
                </Link>
                <Link
                  className={sublinkClass(pathname === "/education/after-school-centres")}
                  href="/education/after-school-centres"
                  onClick={onClose}
                >
                  After School Centres
                </Link>
                {user?.roleName !== "FELLOW" && (
                  <Link
                    className={sublinkClass(pathname === "/education/pta")}
                    href="/education/pta"
                    onClick={onClose}
                  >
                    PTA and Programs
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Fellow Observations Submenu */}
          {(user?.roleName === "ADMIN" || user?.roleName === "PROGRAM_MANAGER") && (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleFolderToggle(observationsOpen, setObservationsOpen)}
                title="Fellow Observations"
                className={`flex items-center gap-3 py-3 px-4 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-full transition-all w-full text-left font-medium ${
                  collapsed ? "md:justify-center md:px-0" : "justify-between"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">rate_review</span>
                  <span className={labelClass}>Fellow Observations</span>
                </div>
                {!collapsed && (
                  <span
                    className={`material-symbols-outlined transition-transform duration-300 ${
                      observationsOpen ? "rotate-180" : ""
                    }`}
                  >
                    expand_more
                  </span>
                )}
              </button>

              {observationsOpen && !collapsed && (
                <div className="ml-8 mt-1 flex flex-col gap-1 border-l-2 border-primary-container pl-2 transition-all duration-300">
                  <Link
                    className={sublinkClass(pathname === "/fellow-observations/pm-reflection")}
                    href="/fellow-observations/pm-reflection"
                    onClick={onClose}
                  >
                    PM Reflection
                  </Link>
                  <Link
                    className={sublinkClass(pathname === "/fellow-observations/fellow-performance")}
                    href="/fellow-observations/fellow-performance"
                    onClick={onClose}
                  >
                    Fellow Performance
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Livelihood Submenu */}
          {true && (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleFolderToggle(livelihoodOpen, setLivelihoodOpen)}
                title="Livelihood"
                className={`flex items-center gap-3 py-3 px-4 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-full transition-all w-full text-left font-medium ${
                  collapsed ? "md:justify-center md:px-0" : "justify-between"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">agriculture</span>
                  <span className={labelClass}>Livelihood</span>
                </div>
                {!collapsed && (
                  <span
                    className={`material-symbols-outlined transition-transform duration-300 ${
                      livelihoodOpen ? "rotate-180" : ""
                    }`}
                  >
                    expand_more
                  </span>
                )}
              </button>

              {livelihoodOpen && !collapsed && (
                <div className="ml-8 mt-1 flex flex-col gap-1 border-l-2 border-primary-container pl-2 transition-all duration-300">
                  <Link
                    className={sublinkClass(pathname === "/livelihood")}
                    href="/livelihood"
                    onClick={onClose}
                  >
                    Hub Overview
                  </Link>
                  <Link
                    className={sublinkClass(pathname === "/livelihood/farm")}
                    href="/livelihood/farm"
                    onClick={onClose}
                  >
                    Farm Programs
                  </Link>
                  <Link
                    className={sublinkClass(pathname === "/livelihood/non-farm")}
                    href="/livelihood/non-farm"
                    onClick={onClose}
                  >
                    Non-Farm Programs
                  </Link>
                  <Link
                    className={sublinkClass(pathname === "/beneficiaries")}
                    href="/beneficiaries"
                    onClick={onClose}
                  >
                    Beneficiaries
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Fellow Workspace removed, now accessed via Dashboard Modal */}

          {/* Disaster Relief */}
          {user?.roleName !== "FELLOW" && (
            <Link
              href="/disaster-relief"
              className={navItemClass(pathname === "/disaster-relief")}
              onClick={onClose}
              title="Disaster Relief"
            >
              <span className="material-symbols-outlined">emergency</span>
              <span className={labelClass}>Disaster Relief</span>
            </Link>
          )}

          {/* Leaves */}
          {user?.roleName !== "ADMIN" && (
            <Link
              href={user?.roleName === "HR" ? "/hr/leaves" : "/hr/leaves/apply"}
              className={navItemClass(pathname.includes("/leaves"))}
              onClick={onClose}
              title="Leaves"
            >
              <span className="material-symbols-outlined">event_note</span>
              <span className={labelClass}>Leaves</span>
            </Link>
          )}

          {/* Travel - Fellow & Program Manager */}
          {(user?.roleName === "FELLOW" || user?.roleName === "PROGRAM_MANAGER") && (
            <Link
              href="/travel"
              className={navItemClass(pathname === "/travel")}
              onClick={onClose}
              title="Travel"
            >
              <span className="material-symbols-outlined">flight</span>
              <span className={labelClass}>Travel</span>
            </Link>
          )}

          {/* Travel Management - Admin/Manager only */}
          {(user?.roleName === "ADMIN" || user?.roleName === "PROGRAM_MANAGER") && (
            <Link
              href="/travel/manage"
              className={navItemClass(pathname === "/travel/manage")}
              onClick={onClose}
              title="Travel Management"
            >
              <span className="material-symbols-outlined">flight_takeoff</span>
              <span className={labelClass}>Travel Management</span>
            </Link>
          )}

          {/* HR Management */}
          {user?.roleName !== "FELLOW" && (
            <Link
              href="/hr"
              className={navItemClass(pathname === "/hr")}
              onClick={onClose}
              title="HR Management"
            >
              <span className="material-symbols-outlined">group</span>
              <span className={labelClass}>HR Management</span>
            </Link>
          )}

          {/* Admin & Access */}
          {user?.roleName === 'ADMIN' && (
            <Link
              href="/admin"
              className={navItemClass(pathname === "/admin")}
              onClick={onClose}
              title="Admin & Access"
            >
              <span className="material-symbols-outlined">admin_panel_settings</span>
              <span className={labelClass}>Admin &amp; Access</span>
            </Link>
          )}
        </div>

        {/* Bottom utility links */}
        <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-2 shrink-0">
          <a
            className={`flex items-center gap-3 py-3 px-4 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-all font-medium ${
              collapsed ? "md:justify-center md:px-0" : ""
            }`}
            href="#"
            title="Help"
          >
            <span className="material-symbols-outlined">help</span>
            <span className={labelClass}>Help</span>
          </a>
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            title="Logout"
            className={`flex items-center gap-3 py-3 px-4 text-slate-600 dark:text-slate-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-700 rounded-full transition-all font-medium w-full text-left bg-transparent border-none cursor-pointer outline-none ${
              collapsed ? "md:justify-center md:px-0" : ""
            }`}
          >
            <span className="material-symbols-outlined">logout</span>
            <span className={labelClass}>Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}
