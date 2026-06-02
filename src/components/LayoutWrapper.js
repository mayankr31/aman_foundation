"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Loader2 } from "lucide-react";

export default function LayoutWrapper({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { token, isInitializing } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (isInitializing) return;

    if (!token && !isAuthPage) {
      router.push("/login");
    } else if (token && isAuthPage) {
      router.push("/");
    }
  }, [token, isInitializing, isAuthPage, pathname]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a7a5e]" />
      </div>
    );
  }

  // Redirecting state bypass
  if (!token && !isAuthPage) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a7a5e]" />
      </div>
    );
  }

  // Render auth views without layout wraps
  if (isAuthPage) {
    return <div className="w-full min-h-screen">{children}</div>;
  }

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
                className="text-slate-400 hover:text-[#1a7a5e] transition-colors duration-300 text-xs tracking-normal"
                href="#"
              >
                Privacy Policy
              </a>
              <a
                className="text-slate-400 hover:text-[#1a7a5e] transition-colors duration-300 text-xs tracking-normal"
                href="#"
              >
                Terms of Service
              </a>
              <a
                className="text-slate-400 hover:text-[#1a7a5e] transition-colors duration-300 text-xs tracking-normal"
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

