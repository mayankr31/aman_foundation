"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import NotificationBell from "@/components/NotificationBell";
import GlobalSearch from "@/components/GlobalSearch";
import Avatar from "@/components/ui/Avatar";
import { formatRoleLabel } from "@/lib/roles";
import { usePwa } from "@/components/pwa/PwaProvider";

export default function Header({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const { canInstall, install } = usePwa();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const initials = user?.name
    ? user.name.split(" ").map(n => n.charAt(0)).join("").toUpperCase().slice(0, 2)
    : "U";

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="pwa-header-safe bg-white/85 dark:bg-slate-950/85 backdrop-blur-md text-teal-700 dark:text-teal-400 font-sans text-sm tracking-wide uppercase font-semibold sticky top-0 z-40 w-full flex justify-between items-center gap-2 h-16 px-3 sm:px-8 border-b border-surface-container/50 transition-all duration-300 flex-shrink-0">
      <div className="flex items-center gap-1 sm:gap-4 min-w-0">
        <button
          onClick={onMenuToggle}
          className="md:hidden text-slate-500 hover:text-teal-600 p-2 rounded-full hover:bg-slate-100 transition-colors shrink-0"
          aria-label="Open navigation menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <img
          src="/logo.jpeg"
          alt="Aman Foundation"
          className="h-8 w-auto max-w-[92px] object-contain sm:hidden"
        />
        <span className="hidden sm:inline text-xl font-black text-slate-900 dark:text-white normal-case tracking-normal whitespace-nowrap">
          Impact Portal
        </span>
      </div>
      <GlobalSearch />
      <div className="flex items-center gap-1 sm:gap-4 shrink-0">
        <NotificationBell />
        <div className="relative border-l border-slate-200 dark:border-slate-800 pl-2 sm:pl-4" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Open account menu"
            className="flex items-center gap-3 h-8 text-left cursor-pointer rounded-full hover:opacity-85 transition-opacity"
          >
            <div className="hidden lg:flex flex-col text-right max-w-[180px] min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-white normal-case tracking-normal truncate">
                {user?.name || "Guest User"}
              </span>
              <span className="text-[10px] text-slate-400 normal-case tracking-normal leading-none mt-0.5 truncate">
                {user?.email || "no-email@amanfoundation.org"}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1a7a5e]/15 text-[#1a7a5e] flex items-center justify-center font-black text-xs shrink-0 border border-[#1a7a5e]/10">
              <Avatar src={user?.avatar} name={user?.name} fallback={initials} />
            </div>
          </button>

          {menuOpen && (
            <div
              role="menu"
              aria-label="Account menu"
              className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 font-sans normal-case tracking-normal"
            >
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user?.name || "Guest User"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {user?.email || "no-email@amanfoundation.org"}
                </p>
                <p className="text-[10px] font-bold tracking-widest text-[#1a7a5e] dark:text-teal-400 mt-1.5">
                  {user?.roleDisplayName || formatRoleLabel(user?.roleName)}
                </p>
              </div>
              <div className="p-2">
                <Link
                  href="/profile"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px] text-slate-400">person</span>
                  My Profile
                </Link>
                {canInstall && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      install();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <span className="material-symbols-outlined text-[20px] text-slate-400">
                      install_mobile
                    </span>
                    Install app
                  </button>
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
