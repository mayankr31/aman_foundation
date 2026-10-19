"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { getPageForPath } from "@/lib/routePermissions";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Loader2 } from "lucide-react";

export default function LayoutWrapper({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { token, isInitializing, can } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const requiredPage = getPageForPath(pathname);
  const isAllowed = !requiredPage || can(requiredPage);

  useEffect(() => {
    if (isInitializing) return;

    if (!token && !isAuthPage) {
      router.push("/login");
    } else if (token && isAuthPage) {
      router.push("/");
    } else if (token && !isAuthPage && !isAllowed) {
      router.push("/");
    }
  }, [token, isInitializing, isAuthPage, pathname, isAllowed]);

  // Any full-screen overlay (modal, drawer, lightbox, full-page form) uses
  // `fixed inset-0`. While one exists, lock scrolling on the page behind it.
  useEffect(() => {
    let frame = null;

    const syncScrollLock = () => {
      frame = null;
      const hasOverlay = Array.from(document.querySelectorAll(".fixed.inset-0")).some((element) => {
        const style = window.getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden";
      });
      document.body.classList.toggle("modal-open", hasOverlay);
      document.documentElement.classList.toggle("modal-open", hasOverlay);
    };

    const scheduleSync = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(syncScrollLock);
    };

    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, { childList: true, subtree: true });
    syncScrollLock();

    return () => {
      observer.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
    };
  }, []);

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

  // Permission denied / redirecting
  if (token && !isAuthPage && !isAllowed) {
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
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />
      <div
        className={`flex-grow flex flex-col min-h-screen min-w-0 transition-[padding] duration-300 ${
          sidebarCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-grow flex flex-col bg-surface justify-between">
          <div className="flex-grow">{children}</div>
          <footer className="flex flex-col md:flex-row justify-between items-center py-8 md:py-12 px-4 sm:px-8 gap-4 md:gap-6 bg-slate-50 dark:bg-slate-950 w-full border-t border-slate-200 dark:border-slate-800 shrink-0 font-sans">
            <div className="text-center md:text-left max-w-full">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs tracking-normal">
                Aman Foundation
              </span>
              <span className="text-slate-500 text-xs ml-2 break-words">
                © 2024 Aman Foundation Impact Systems
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
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

