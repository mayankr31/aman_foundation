"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { SEARCH_ENTRIES, SEARCH_GROUPS, getEntryHref } from "@/lib/searchIndex";

function normalize(value) {
  return (value || "").toString().toLowerCase();
}

export default function GlobalSearch() {
  const { user, token, can } = useAuth();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dynamicEntries, setDynamicEntries] = useState([]);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const loadedRef = useRef(false);

  // Lazily fetch dynamic, role-scoped entities the first time the search opens.
  useEffect(() => {
    if (!open || loadedRef.current || !token) return;
    loadedRef.current = true;
    let cancelled = false;
    const headers = { Authorization: `Bearer ${token}` };
    const canPage = (page) => {
      if (!page) return true;
      const perms = user?.permissions;
      if (!perms || typeof perms !== "object") return true;
      return !!perms[page]?.read;
    };

    const load = async () => {
      const results = [];
      const tasks = [];

      if (canPage("livelihood")) {
        tasks.push(
          fetch("/api/livelihood/programs", { headers })
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => {
              (json?.data?.programs || []).forEach((p) => {
                const category = p.category === "FARM" ? "Farm Programs" : "Non-Farm Programs";
                results.push({
                  id: `livelihood-program-${p.id}`,
                  label: p.name,
                  path: ["Livelihood", category, p.name],
                  keywords: [p.name, p.description || "", "program", category],
                  href: `/livelihood/programs/${p.id}`,
                  page: "livelihood",
                  group: category,
                  icon: p.category === "FARM" ? "agriculture" : "pets",
                });
              });
            })
            .catch(() => {})
        );
      }

      if (canPage("education")) {
        tasks.push(
          fetch("/api/programs", { headers })
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => {
              (json?.data || []).forEach((p) => {
                results.push({
                  id: `pta-program-${p.id}`,
                  label: p.title,
                  path: ["Education", "PTA & Programs", "Programs", p.title],
                  keywords: [p.title, p.description || "", "pta program"],
                  href: `/education/pta/program/${p.id}`,
                  page: "education",
                  group: "PTA Programs",
                  icon: "handshake",
                });
              });
            })
            .catch(() => {})
        );
        tasks.push(
          fetch("/api/events", { headers })
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => {
              (json?.data || []).forEach((ev) => {
                results.push({
                  id: `pta-event-${ev.id}`,
                  label: ev.title,
                  path: ["Education", "PTA & Programs", "Events", ev.title],
                  keywords: [ev.title, ev.description || "", ev.location || "", "pta event meeting"],
                  href: `/education/pta/event/${ev.id}`,
                  page: "education",
                  group: "PTA Events",
                  icon: "event",
                });
              });
            })
            .catch(() => {})
        );
      }

      await Promise.all(tasks);
      if (!cancelled) {
        setDynamicEntries(results);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, token, user]);

  const allEntries = useMemo(
    () => [...SEARCH_ENTRIES, ...dynamicEntries],
    [dynamicEntries]
  );

  const filtered = useMemo(() => {
    const q = normalize(query).trim();
    const permitted = allEntries.filter((entry) => can(entry.page));
    if (!q) return permitted.slice(0, 8);

    const tokens = q.split(/\s+/);
    const scored = [];
    for (const entry of permitted) {
      const label = normalize(entry.label);
      const haystack = [entry.label, ...(entry.keywords || []), ...(entry.path || [])]
        .join(" ")
        .toLowerCase();
      if (!tokens.every((t) => haystack.includes(t))) continue;

      let score = 10;
      if (label === q) score += 100;
      else if (label.startsWith(q)) score += 40;
      if ((entry.keywords || []).some((k) => normalize(k).startsWith(q))) score += 20;
      if (normalize((entry.path || []).slice(-1)[0]) === q) score += 30;
      scored.push({ entry, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 30).map((s) => s.entry);
  }, [allEntries, query, can]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const entry of filtered) {
      if (!map.has(entry.group)) map.set(entry.group, []);
      map.get(entry.group).push(entry);
    }
    const order = [...SEARCH_GROUPS, ...map.keys()];
    const seen = new Set();
    return order
      .filter((g) => {
        if (seen.has(g) || !map.has(g)) return false;
        seen.add(g);
        return true;
      })
      .map((g) => ({ group: g, items: map.get(g) }));
  }, [filtered]);

  const flat = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  // Global Ctrl/Cmd+K shortcut.
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const go = (entry) => {
    if (!entry) return;
    const href = getEntryHref(entry, user);
    setOpen(false);
    setMobileOpen(false);
    setQuery("");
    router.push(href);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(flat[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setMobileOpen(false);
      setQuery("");
      inputRef.current?.blur();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMobileOpen(true);
          setOpen(true);
          setActiveIndex(0);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="md:hidden text-slate-500 hover:text-teal-600 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
        aria-label="Open search"
      >
        <span className="material-symbols-outlined">search</span>
      </button>

      <div
        ref={containerRef}
        className={
          mobileOpen
            ? "fixed inset-x-0 top-0 z-[80] flex-1 bg-white dark:bg-slate-950 px-3 py-3 shadow-lg md:static md:z-auto md:bg-transparent md:p-0 md:shadow-none md:relative md:max-w-xl md:mx-6 md:min-w-0"
            : "relative hidden md:block flex-1 max-w-xl mx-6 min-w-0"
        }
      >
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIndex(0);
            }}
            onFocus={() => {
              setOpen(true);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search pages, tabs & forms..."
            className="w-full h-10 pl-10 pr-16 rounded-full bg-slate-100 dark:bg-slate-800/70 border border-transparent focus:border-teal-500/40 focus:bg-white dark:focus:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 normal-case tracking-normal outline-none transition-colors"
          />
          {mobileOpen ? (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setOpen(false);
                setQuery("");
              }}
              className="md:hidden absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              aria-label="Close search"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveIndex(0);
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          ) : (
            <span className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 items-center text-[10px] font-semibold text-slate-400 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 normal-case tracking-normal">
              Ctrl K
            </span>
          )}
        </div>

      {open && (
        <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-[70] normal-case tracking-normal max-h-[70vh] overflow-y-auto">
          {flat.length === 0 ? (
            <div className="py-8 text-center">
              <span className="material-symbols-outlined text-slate-300 text-3xl">search_off</span>
              <p className="text-xs text-slate-400 mt-2">No results for &ldquo;{query}&rdquo;.</p>
            </div>
          ) : (
            grouped.map((g) => (
              <div key={g.group}>
                <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {g.group}
                </div>
                {g.items.map((entry) => {
                  const idx = flat.indexOf(entry);
                  const active = idx === activeIndex;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => go(entry)}
                      className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors ${
                        active
                          ? "bg-teal-50 dark:bg-teal-900/30"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[20px] mt-0.5 ${
                          active ? "text-teal-600 dark:text-teal-400" : "text-slate-400"
                        }`}
                      >
                        {entry.icon || "arrow_outward"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {entry.label}
                        </span>
                        <span className="block text-[11px] text-slate-400 truncate">
                          {entry.path.join("  \u203A  ")}
                        </span>
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-slate-300 mt-1">
                        arrow_forward
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
      </div>
    </>
  );
}
