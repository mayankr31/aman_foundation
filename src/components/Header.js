"use client";

import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import NotificationBell from "@/components/NotificationBell";
import GlobalSearch from "@/components/GlobalSearch";

export default function Header({ onMenuToggle }) {
  const { user } = useAuth();

  // Extract name initials, e.g. "SA" for Super Admin
  const initials = user?.name
    ? user.name.split(" ").map(n => n.charAt(0)).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="bg-white/85 dark:bg-slate-950/85 backdrop-blur-md text-teal-700 dark:text-teal-400 font-sans text-sm tracking-wide uppercase font-semibold sticky top-0 z-40 w-full flex justify-between items-center gap-2 h-16 px-3 sm:px-8 border-b border-surface-container/50 transition-all duration-300 flex-shrink-0">
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
        <Link href="/profile" className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-2 sm:pl-4 h-8 hover:opacity-85 transition-opacity">
          <div className="hidden lg:flex flex-col text-right max-w-[180px] min-w-0">
            <span className="text-xs font-bold text-slate-800 dark:text-white normal-case tracking-normal truncate">
              {user?.name || "Guest User"}
            </span>
            <span className="text-[10px] text-slate-400 normal-case tracking-normal leading-none mt-0.5 truncate">
              {user?.email || "no-email@amanfoundation.org"}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1a7a5e]/15 text-[#1a7a5e] flex items-center justify-center font-black text-xs shrink-0 border border-[#1a7a5e]/10">
            {user?.avatar ? (
              <img alt="avatar" className="w-full h-full object-cover" src={user.avatar} />
            ) : (
              initials
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}

