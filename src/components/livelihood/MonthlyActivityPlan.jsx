"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DateInput from "@/components/ui/DateInput";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import { formatDate, toISODateOnly } from "@/lib/date";
import { getISTDateKey } from "@/lib/time";
import {
  getCurrentMonthKey,
  isValidMonthKey,
  LIVELIHOOD_ACTIVITY_STATUS_TONES,
  LIVELIHOOD_ACTIVITY_STATUSES,
} from "@/lib/livelihoodActivityShared";

const EMPTY_FORM = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  componentTypeKey: "",
  status: "Pending",
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function monthLabel(monthKey) {
  if (!isValidMonthKey(monthKey)) return monthKey;
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function shiftMonth(monthKey, delta) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

function monthOf(value) {
  return toISODateOnly(value).slice(0, 7);
}

function defaultDateForMonth(monthKey) {
  const today = getISTDateKey();
  return today.slice(0, 7) === monthKey ? today : `${monthKey}-01`;
}

function formatRange(start, end) {
  const startIso = toISODateOnly(start);
  const endIso = toISODateOnly(end);
  if (!startIso) return "—";
  if (!endIso || endIso === startIso) return formatDate(startIso);
  return `${formatDate(startIso)} – ${formatDate(endIso)}`;
}

function isOverdue(activity) {
  if (activity.status === "Completed" || activity.status === "Cancelled") return false;
  const endIso = toISODateOnly(activity.endDate);
  return Boolean(endIso) && endIso < getISTDateKey();
}

function initials(name) {
  return (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function MonthlyActivityPlan({
  programId,
  components = [],
  getTypeConfig,
  canManagePlans = false,
  currentUserId,
  token,
}) {
  const toast = useToast();
  const confirm = useConfirm();

  const [month, setMonth] = useState(getCurrentMonthKey);
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [componentFilter, setComponentFilter] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentBusy, setCommentBusy] = useState(null);
  const [statusBusy, setStatusBusy] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const scrolledFor = useRef(null);

  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const load = useCallback(async () => {
    if (!programId) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ month });
      if (componentFilter) params.set("component", componentFilter);
      const res = await fetch(`/api/livelihood/programs/${programId}/activities?${params}`, { headers });
      const json = await res.json();
      if (json.success) {
        setActivities(json.data || []);
        setSummary(json.meta?.summary || null);
      } else {
        setError(json.error || "Failed to load activities");
      }
    } catch (err) {
      console.error("Load monthly activities error:", err);
      setError("Failed to load activities");
    } finally {
      setLoading(false);
    }
  }, [programId, month, componentFilter, headers]);

  useEffect(() => {
    load();
  }, [load]);

  // Deep links from notifications: ?planMonth=YYYY-MM&activity=<id>
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const planMonth = params.get("planMonth");
    const activityId = params.get("activity");
    if (planMonth && isValidMonthKey(planMonth)) setMonth(planMonth);
    if (activityId) {
      setExpandedId(activityId);
      setHighlightId(activityId);
    }
  }, []);

  useEffect(() => {
    if (!highlightId || loading) return;
    if (scrolledFor.current === highlightId) return;
    const node = document.getElementById(`activity-${highlightId}`);
    if (node) {
      scrolledFor.current = highlightId;
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, loading, activities]);

  const componentByKey = useMemo(() => {
    const map = new Map();
    components.forEach((component) => {
      const config = getTypeConfig?.(component.typeKey);
      map.set(component.typeKey, config?.label || component.typeKey);
    });
    return map;
  }, [components, getTypeConfig]);

  const visibleActivities = useMemo(() => {
    const query = search.trim().toLowerCase();
    return activities.filter((activity) => {
      if (statusFilter && activity.status !== statusFilter) return false;
      if (!query) return true;
      return (
        activity.title?.toLowerCase().includes(query) ||
        activity.description?.toLowerCase().includes(query) ||
        activity.createdBy?.name?.toLowerCase().includes(query)
      );
    });
  }, [activities, statusFilter, search]);

  const completedPct =
    summary?.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;

  const openCreate = () => {
    const start = defaultDateForMonth(month);
    setEditing(null);
    setForm({ ...EMPTY_FORM, startDate: start, endDate: start });
    setShowModal(true);
  };

  const openEdit = (activity) => {
    setEditing(activity);
    setForm({
      title: activity.title || "",
      description: activity.description || "",
      startDate: toISODateOnly(activity.startDate),
      endDate: toISODateOnly(activity.endDate),
      componentTypeKey: activity.componentTypeKey || "",
      status: activity.status || "Pending",
    });
    setShowModal(true);
  };

  const setField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "startDate") {
        if (!next.endDate || (value && next.endDate < value)) next.endDate = value;
      }
      return next;
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Activity title is required");
      return;
    }
    if (!form.startDate) {
      toast.error("Start date is required");
      return;
    }
    if (form.endDate && form.endDate < form.startDate) {
      toast.error("End date cannot be before the start date");
      return;
    }

    setSaving(true);
    try {
      const url = editing
        ? `/api/livelihood/programs/${programId}/activities/${editing.id}`
        : `/api/livelihood/programs/${programId}/activities`;
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          startDate: form.startDate,
          endDate: form.endDate || form.startDate,
          componentTypeKey: form.componentTypeKey || null,
          status: form.status,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed to save activity");
        return;
      }

      setShowModal(false);
      setEditing(null);
      toast.success(editing ? "Activity updated" : "Activity added");

      const savedMonth = monthOf(json.data?.startDate) || month;
      if (savedMonth !== month) setMonth(savedMonth);
      else await load();
    } catch (err) {
      console.error("Save livelihood activity error:", err);
      toast.error("Failed to save activity");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (activity) => {
    const confirmed = await confirm({
      title: "Delete Activity",
      message: `Delete "${activity.title}"? Any comments on it will also be removed.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/livelihood/programs/${programId}/activities/${activity.id}`,
        { method: "DELETE", headers }
      );
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed to delete activity");
        return;
      }
      setActivities((prev) => prev.filter((item) => item.id !== activity.id));
      setSummary((prev) => (prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev));
      toast.success("Activity deleted");
      await load();
    } catch (err) {
      console.error("Delete livelihood activity error:", err);
      toast.error("Failed to delete activity");
    }
  };

  const updateStatus = async (activity, status) => {
    if (status === activity.status) return;
    setStatusBusy(activity.id);
    try {
      const res = await fetch(
        `/api/livelihood/programs/${programId}/activities/${activity.id}`,
        {
          method: "PATCH",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed to update status");
        return;
      }
      setActivities((prev) =>
        prev.map((item) => (item.id === activity.id ? json.data : item))
      );
      await load();
    } catch (err) {
      console.error("Update activity status error:", err);
      toast.error("Failed to update status");
    } finally {
      setStatusBusy(null);
    }
  };

  const postComment = async (activityId) => {
    const text = (commentDrafts[activityId] || "").trim();
    if (!text) return;
    setCommentBusy(activityId);
    try {
      const res = await fetch(
        `/api/livelihood/programs/${programId}/activities/${activityId}/comments`,
        {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        }
      );
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed to post comment");
        return;
      }
      setActivities((prev) =>
        prev.map((item) =>
          item.id === activityId
            ? { ...item, comments: [...(item.comments || []), json.data] }
            : item
        )
      );
      setCommentDrafts((prev) => ({ ...prev, [activityId]: "" }));
    } catch (err) {
      console.error("Post activity comment error:", err);
      toast.error("Failed to post comment");
    } finally {
      setCommentBusy(null);
    }
  };

  const deleteComment = async (activityId, commentId) => {
    const confirmed = await confirm({
      title: "Delete Comment",
      message: "Delete this comment permanently?",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/livelihood/programs/${programId}/activities/${activityId}/comments/${commentId}`,
        { method: "DELETE", headers }
      );
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed to delete comment");
        return;
      }
      setActivities((prev) =>
        prev.map((item) =>
          item.id === activityId
            ? { ...item, comments: (item.comments || []).filter((c) => c.id !== commentId) }
            : item
        )
      );
    } catch (err) {
      console.error("Delete activity comment error:", err);
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div
      id="monthly-plan"
      className="bg-surface-container-lowest rounded-lg shadow-ambient border border-outline-variant/10 overflow-hidden"
    >
      <div className="p-4 sm:p-6 border-b border-outline-variant/10">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              Monthly Activity Plan
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Pre-plan the month&apos;s work, track completion and discuss progress with the whole program team.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-surface-container rounded-full border border-outline-variant/20">
              <button
                type="button"
                onClick={() => setMonth((prev) => shiftMonth(prev, -1))}
                className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant cursor-pointer border-none bg-transparent"
                aria-label="Previous month"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span className="px-1 text-xs font-bold text-on-surface whitespace-nowrap min-w-[120px] text-center">
                {monthLabel(month)}
              </span>
              <button
                type="button"
                onClick={() => setMonth((prev) => shiftMonth(prev, 1))}
                className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant cursor-pointer border-none bg-transparent"
                aria-label="Next month"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setMonth(getCurrentMonthKey())}
              className="px-3 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer border border-outline-variant/20 bg-transparent"
            >
              This month
            </button>
            {canManagePlans && (
              <button
                type="button"
                onClick={openCreate}
                className="bg-primary text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-primary-container transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 cursor-pointer border-none"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add Activity
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { label: "Total planned", value: summary?.total ?? 0, tone: "text-on-surface" },
            { label: "Completed", value: summary?.completed ?? 0, tone: "text-emerald-600" },
            { label: "In progress", value: summary?.inProgress ?? 0, tone: "text-blue-600" },
            { label: "Overdue", value: summary?.overdue ?? 0, tone: "text-rose-600" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-outline-variant/15 bg-surface-container-low/40 px-3 py-2.5"
            >
              <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                {card.label}
              </p>
              <p className={`text-lg font-bold mt-0.5 ${card.tone}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {(summary?.total ?? 0) > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-on-surface-variant mb-1">
              <span>Completion progress</span>
              <span>{completedPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface-container overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${completedPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full px-3 py-2 rounded-full text-xs font-semibold border border-outline-variant/20 bg-transparent text-on-surface cursor-pointer"
          >
            <option value="">All statuses</option>
            {LIVELIHOOD_ACTIVITY_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {components.length > 1 && (
            <select
              value={componentFilter}
              onChange={(event) => setComponentFilter(event.target.value)}
              className="w-full px-3 py-2 rounded-full text-xs font-semibold border border-outline-variant/20 bg-transparent text-on-surface cursor-pointer"
            >
              <option value="">All activity types</option>
              {components.map((component) => (
                <option key={component.typeKey} value={component.typeKey}>
                  {componentByKey.get(component.typeKey) || component.typeKey}
                </option>
              ))}
            </select>
          )}

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search activities..."
            className="w-full px-4 py-2 rounded-full text-xs border border-outline-variant/20 bg-transparent text-on-surface focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-3">
        {loading ? (
          <p className="text-sm text-on-surface-variant text-center py-8">Loading activities...</p>
        ) : error ? (
          <p className="text-sm text-error text-center py-8">{error}</p>
        ) : visibleActivities.length === 0 ? (
          <div className="text-center py-8 px-4">
            <span className="material-symbols-outlined text-4xl text-slate-300">event_note</span>
            <p className="text-sm text-on-surface-variant mt-2">
              {activities.length === 0
                ? `No activities planned for ${monthLabel(month)}.`
                : "No activities match the selected filters."}
            </p>
            {canManagePlans && activities.length === 0 && (
              <button
                type="button"
                onClick={openCreate}
                className="mt-3 text-primary text-xs font-bold hover:underline cursor-pointer bg-transparent border-none"
              >
                Plan the first activity
              </button>
            )}
          </div>
        ) : (
          visibleActivities.map((activity) => {
            const comments = activity.comments || [];
            const expanded = expandedId === activity.id;
            const overdue = isOverdue(activity);
            const typeLabel = activity.componentTypeKey
              ? componentByKey.get(activity.componentTypeKey) || activity.componentTypeKey
              : null;
            const highlighted = highlightId === activity.id;

            return (
              <div
                key={activity.id}
                id={`activity-${activity.id}`}
                className={`rounded-xl border p-4 transition-colors ${
                  highlighted
                    ? "border-primary/40 bg-primary/5"
                    : "border-outline-variant/15 bg-surface-container-low/30"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          LIVELIHOOD_ACTIVITY_STATUS_TONES[activity.status] || LIVELIHOOD_ACTIVITY_STATUS_TONES.Pending
                        }`}
                      >
                        {activity.status}
                      </span>
                      {typeLabel && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant">
                          {typeLabel}
                        </span>
                      )}
                      {overdue && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700">
                          Overdue
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm sm:text-base text-on-surface mt-2 break-words">
                      {activity.title}
                    </h4>
                    <p className="text-[11px] text-on-surface-variant mt-1 font-semibold">
                      {formatRange(activity.startDate, activity.endDate)}
                    </p>
                    {activity.description && (
                      <p className="text-xs text-on-surface-variant mt-2 leading-relaxed whitespace-pre-line">
                        {activity.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-slate-400">
                      <span>Planned by {activity.createdBy?.name || "—"}</span>
                      {activity.completedBy?.name && <span>Completed by {activity.completedBy.name}</span>}
                      {activity.completedAt && <span>on {formatDate(activity.completedAt)}</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <select
                      value={activity.status}
                      onChange={(event) => updateStatus(activity, event.target.value)}
                      disabled={statusBusy === activity.id}
                      className="px-2.5 py-1.5 rounded-full text-[11px] font-bold border border-outline-variant/20 bg-white dark:bg-slate-900 text-on-surface cursor-pointer disabled:opacity-60"
                      aria-label={`Status for ${activity.title}`}
                    >
                      {LIVELIHOOD_ACTIVITY_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : activity.id)}
                      className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant cursor-pointer border-none bg-transparent flex items-center gap-1 text-[11px] font-semibold"
                      title="Comments"
                    >
                      <span className="material-symbols-outlined text-[18px]">forum</span>
                      {comments.length}
                    </button>
                    {canManagePlans && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEdit(activity)}
                          className="p-1.5 rounded-full hover:bg-amber-100 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer border-none bg-transparent"
                          title="Edit activity"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(activity)}
                          className="p-1.5 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer border-none bg-transparent"
                          title="Delete activity"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {expanded && (
                  <div className="mt-4 pt-4 border-t border-outline-variant/15 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Discussion ({comments.length})
                    </p>

                    {comments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        No comments yet. Share an update, blocker or suggestion.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {comments.map((comment) => {
                          const canDeleteComment =
                            canManagePlans || (currentUserId && comment.author?.id === currentUserId);
                          return (
                            <div
                              key={comment.id}
                              className="flex items-start gap-2.5 rounded-lg bg-white dark:bg-slate-900 border border-outline-variant/10 p-2.5"
                            >
                              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                {initials(comment.author?.name)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-xs font-bold text-on-surface">
                                    {comment.author?.name || "Unknown"}
                                  </p>
                                  <span className="text-[10px] text-slate-400">
                                    {formatDate(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-xs text-on-surface-variant mt-1 whitespace-pre-line break-words">
                                  {comment.text}
                                </p>
                              </div>
                              {canDeleteComment && (
                                <button
                                  type="button"
                                  onClick={() => deleteComment(activity.id, comment.id)}
                                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer border-none bg-transparent"
                                  title="Delete comment"
                                >
                                  <span className="material-symbols-outlined text-[15px]">delete</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
                      <textarea
                        value={commentDrafts[activity.id] || ""}
                        onChange={(event) =>
                          setCommentDrafts((prev) => ({ ...prev, [activity.id]: event.target.value }))
                        }
                        rows={2}
                        maxLength={2000}
                        placeholder="Add your input or update..."
                        className="flex-1 w-full px-3 py-2 rounded-lg border border-outline-variant/25 bg-transparent text-on-surface text-xs resize-none focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => postComment(activity.id)}
                        disabled={commentBusy === activity.id || !(commentDrafts[activity.id] || "").trim()}
                        className="px-4 py-2 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-container transition-colors cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      >
                        {commentBusy === activity.id ? "Posting..." : "Post"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4"
          onClick={() => !saving && setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4 border border-outline-variant/10 text-on-surface"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <h3 className="text-lg font-bold">{editing ? "Edit Activity" : "Plan Monthly Activity"}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{monthLabel(month)}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined font-bold">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Activity title <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(event) => setField("title", event.target.value)}
                  placeholder="e.g. Distribute seeds to enrolled farmers"
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/25 bg-transparent text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Start date <span className="text-error">*</span>
                  </label>
                  <DateInput
                    required
                    value={form.startDate}
                    onChange={(event) => setField("startDate", event.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/25 bg-transparent text-on-surface text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    End date
                  </label>
                  <DateInput
                    value={form.endDate}
                    min={form.startDate || undefined}
                    onChange={(event) => setField("endDate", event.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/25 bg-transparent text-on-surface text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {components.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Activity type
                    </label>
                    <select
                      value={form.componentTypeKey}
                      onChange={(event) => setField("componentTypeKey", event.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/25 bg-transparent text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="">No specific type</option>
                      {components.map((component) => (
                        <option key={component.typeKey} value={component.typeKey}>
                          {componentByKey.get(component.typeKey) || component.typeKey}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(event) => setField("status", event.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/25 bg-transparent text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {LIVELIHOOD_ACTIVITY_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Details
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) => setField("description", event.target.value)}
                  rows={3}
                  placeholder="What needs to be done, who is involved, any notes..."
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/25 bg-transparent text-on-surface text-sm resize-none focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface text-xs font-semibold cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-colors cursor-pointer border-none disabled:opacity-60"
                >
                  {saving ? "Saving..." : editing ? "Save Changes" : "Add Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
