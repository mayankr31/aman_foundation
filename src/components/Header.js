"use client";

import Link from "next/link";
import { useAuth } from "@/lib/useAuth";

export default function Header({ onMenuToggle }) {
  const { user } = useAuth();

  // Extract name initials, e.g. "SA" for Super Admin
  const initials = user?.name
    ? user.name.split(" ").map(n => n.charAt(0)).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="bg-white/85 dark:bg-slate-950/85 backdrop-blur-md text-teal-700 dark:text-teal-400 font-sans text-sm tracking-wide uppercase font-semibold sticky top-0 z-40 w-full flex justify-between items-center h-16 px-8 border-b border-surface-container/50 transition-all duration-300 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="md:hidden text-slate-500 hover:text-teal-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="text-xl font-black text-slate-900 dark:text-white normal-case tracking-normal">
          Impact Portal
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <button className="text-slate-500 hover:text-teal-600 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full p-2 flex items-center justify-center">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-slate-500 hover:text-teal-600 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full p-2 flex items-center justify-center">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
        
        <Link href="/profile" className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4 h-8 hover:opacity-85 transition-opacity">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-xs font-bold text-slate-800 dark:text-white normal-case tracking-normal">
              {user?.name || "Guest User"}
            </span>
            <span className="text-[10px] text-slate-400 normal-case tracking-normal leading-none mt-0.5">
              {user?.email || "no-email@amanfoundation.org"}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#1a7a5e]/15 text-[#1a7a5e] flex items-center justify-center font-black text-xs shrink-0 border border-[#1a7a5e]/10">
            {initials}
          </div>
        </Link>
      </div>
    </header>
  );
}

