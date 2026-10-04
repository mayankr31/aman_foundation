"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

function relativeTime(value) {
  if (!value) return "";
  const then = new Date(value).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

export default function NotificationBell() {
  const { token } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setNotifications(json.data || []);
        setUnreadCount(json.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const initial = setTimeout(load, 0);
    const interval = setInterval(load, 60000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [token, load]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const handleOpenToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setIsLoading(true);
      load();
    }
  };

  const handleItemClick = (notification) => {
    if (!notification.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      fetch(`/api/notifications/${notification.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ read: true }),
      }).catch(() => {});
    }
    if (notification.link) {
      setOpen(false);
      router.push(notification.link);
    }
  };

  const handleDeleteOne = async (e, notification) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    if (!notification.read) setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch(`/api/notifications/${notification.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ action: "markAllRead" }),
      });
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  const handleDeleteAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ all: true }),
      });
    } catch (err) {
      console.error("Failed to delete notifications:", err);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleOpenToggle}
        className="relative text-slate-500 hover:text-teal-600 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full p-2 flex items-center justify-center"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-950">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-[60] normal-case tracking-normal font-sans">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800 dark:text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                Mark all read
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={notifications.length === 0}
                className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                Delete all
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <span className="material-symbols-outlined text-slate-300 text-3xl">notifications_off</span>
                <p className="text-xs text-slate-400 mt-2">You&apos;re all caught up.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`group relative flex gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-800/60 cursor-pointer transition-colors ${
                    n.read
                      ? "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      : "bg-teal-50/50 dark:bg-teal-900/10 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {n.read ? (
                      <span className="material-symbols-outlined text-slate-400 text-lg">mark_email_read</span>
                    ) : (
                      <span className="material-symbols-outlined text-teal-600 text-lg">notifications_active</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pr-5">
                    <p className={`text-xs ${n.read ? "font-semibold text-slate-600 dark:text-slate-300" : "font-bold text-slate-800 dark:text-white"}`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug break-words">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{relativeTime(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteOne(e, n)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-500 p-0.5 rounded"
                    aria-label="Delete notification"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                  {!n.read && (
                    <span className="absolute right-3 bottom-3 w-1.5 h-1.5 rounded-full bg-teal-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
