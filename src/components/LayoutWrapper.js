"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function LayoutWrapper({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex w-full min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-grow flex flex-col min-h-screen md:pl-64">
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-grow flex flex-col bg-surface justify-between">
          <div className="flex-grow">{children}</div>
          <footer className="flex flex-col md:flex-row justify-between items-center py-12 px-8 bg-slate-50 dark:bg-slate-950 w-full border-t border-slate-200 dark:border-slate-800 shrink-0 font-sans">
            <div className="mb-4 md:mb-0">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs tracking-normal">
                Aman Foundation
              </span>
              <span className="text-slate-500 text-xs ml-2">
                © 2024 Aman Foundation Impact Systems
              </span>
            </div>
            <div className="flex gap-6">
              <a
                className="text-slate-400 hover:text-emerald-600 transition-opacity duration-300 text-xs tracking-normal"
                href="#"
              >
                Privacy Policy
              </a>
              <a
                className="text-slate-400 hover:text-emerald-600 transition-opacity duration-300 text-xs tracking-normal"
                href="#"
              >
                Terms of Service
              </a>
              <a
                className="text-slate-400 hover:text-emerald-600 transition-opacity duration-300 text-xs tracking-normal"
                href="#"
              >
                Impact Data Transparency
              </a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
