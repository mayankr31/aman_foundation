"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  // Dropdown states
  const [eduOpen, setEduOpen] = useState(false);
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
      ].some(path => pathname === path)
    ) {
      setEduOpen(true);
    }
    if (
      [
        "/livelihood",
        "/livelihood/goat-rearing",
        "/livelihood/sugarcane",
        "/beneficiaries",
      ].some(path => pathname === path)
    ) {
      setLivelihoodOpen(true);
    }
  }, [pathname]);

  const navItemClass = (isActive) =>
    `flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-300 ease-in-out ${
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
        className={`bg-slate-50 dark:bg-slate-900 text-teal-800 dark:text-teal-400 font-sans tracking-tight text-sm font-medium h-screen w-64 fixed left-0 top-0 overflow-y-auto shadow-[8px_0_24px_rgba(0,0,0,0.04)] z-[60] flex flex-col p-6 gap-2 border-r border-slate-100 dark:border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8 px-2 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary shrink-0 ambient-shadow">
            <span className="material-symbols-outlined text-2xl icon-filled">local_library</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tighter text-teal-900 dark:text-teal-100 leading-tight whitespace-nowrap">
              Aman Foundation
            </h1>
            <p className="text-xs text-on-surface-variant whitespace-nowrap">Impact Portal</p>
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
          {/* Dashboard */}
          <Link
            href="/"
            className={navItemClass(pathname === "/")}
            onClick={onClose}
          >
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </Link>

          {/* Education Submenu */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setEduOpen(!eduOpen)}
              className="flex items-center justify-between gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-full transition-all w-full text-left font-medium"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">school</span>
                Education
              </div>
              <span
                className={`material-symbols-outlined transition-transform duration-300 ${
                  eduOpen ? "rotate-180" : ""
                }`}
              >
                expand_more
              </span>
            </button>
            
            {eduOpen && (
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

          {/* Livelihood Submenu */}
          {user?.roleName !== "FELLOW" && (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setLivelihoodOpen(!livelihoodOpen)}
                className="flex items-center justify-between gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-full transition-all w-full text-left font-medium"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">agriculture</span>
                  Livelihood
                </div>
                <span
                  className={`material-symbols-outlined transition-transform duration-300 ${
                    livelihoodOpen ? "rotate-180" : ""
                  }`}
                >
                  expand_more
                </span>
              </button>

              {livelihoodOpen && (
                <div className="ml-8 mt-1 flex flex-col gap-1 border-l-2 border-primary-container pl-2 transition-all duration-300">
                  <Link
                    className={sublinkClass(pathname === "/livelihood")}
                    href="/livelihood"
                    onClick={onClose}
                  >
                    Hub Overview
                  </Link>
                  <Link
                    className={sublinkClass(pathname === "/livelihood/goat-rearing")}
                    href="/livelihood/goat-rearing"
                    onClick={onClose}
                  >
                    Goat Rearing
                  </Link>
                  <Link
                    className={sublinkClass(pathname === "/livelihood/sugarcane")}
                    href="/livelihood/sugarcane"
                    onClick={onClose}
                  >
                    Sugarcane Cultivation
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
            >
              <span className="material-symbols-outlined">emergency</span>
              Disaster Relief
            </Link>
          )}

          {/* Leaves */}
          {user?.roleName !== "ADMIN" && (
            <Link
              href={user?.roleName === "HR" ? "/hr/leaves" : "/hr/leaves/apply"}
              className={navItemClass(pathname.includes("/leaves"))}
              onClick={onClose}
            >
              <span className="material-symbols-outlined">event_note</span>
              Leaves
            </Link>
          )}

          {/* HR Management */}
          {user?.roleName !== "FELLOW" && (
            <Link
              href="/hr"
              className={navItemClass(pathname === "/hr")}
              onClick={onClose}
            >
              <span className="material-symbols-outlined">group</span>
              HR Management
            </Link>
          )}

          {/* Admin & Access */}
          {user?.roleName === 'ADMIN' && (
            <Link
              href="/admin"
              className={navItemClass(pathname === "/admin")}
              onClick={onClose}
            >
              <span className="material-symbols-outlined">admin_panel_settings</span>
              Admin &amp; Access
            </Link>
          )}
        </div>

        {/* Bottom utility links */}
        <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-2 shrink-0">
          <a
            className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-all font-medium"
            href="#"
          >
            <span className="material-symbols-outlined">help</span>
            Help
          </a>
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-700 rounded-full transition-all font-medium w-full text-left bg-transparent border-none cursor-pointer outline-none"
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </nav>
    </>
  );
}
