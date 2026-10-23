"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";
import { formatDate, formatDateTime } from "@/lib/date";
import { getISTDateKey } from "@/lib/time";
import { validateDateOrder } from "@/lib/validation";

const STATUSES = ["Pending", "In Progress", "Completed", "Blocked", "Cancelled"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const STATUS_CLASS = {
  Pending: "bg-amber-100 text-amber-800",
  "In Progress": "bg-blue-100 text-blue-800",
  Completed: "bg-emerald-100 text-emerald-800",
  Blocked: "bg-rose-100 text-rose-800",
  Cancelled: "bg-slate-200 text-slate-600",
};

const PRIORITY_CLASS = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-blue-50 text-blue-700",
  High: "bg-amber-100 text-amber-800",
  Urgent: "bg-rose-100 text-rose-800",
};

function toDateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function TaskDetailModal({ task, onClose, token, onChanged, canManage, currentUserId, canWrite }) {
  const [comments, setComments] = useState(task.comments || []);
  const [documents, setDocuments] = useState(task.documents || []);
  const [newComment, setNewComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: task.title || "",
    description: task.description || "",
    plannedDate: toDateInput(task.plannedDate),
    deadline: toDateInput(task.deadline),
    status: task.status || "Pending",
    priority: task.priority || "Medium",
  });
  const toast = useToast();

  const saveChanges = async () => {
    if (!form.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    const dateError = validateDateOrder(
      form.plannedDate || getISTDateKey(),
      form.deadline,
      { startLabel: "Planned date", endLabel: "Deadline" }
    );
    if (dateError) {
      toast.error(dateError);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          plannedDate: form.plannedDate || null,
          deadline: form.deadline || null,
          status: form.status,
          priority: form.priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update task");
      onChanged?.(data.data);
      setForm({
        title: data.data.title || "",
        description: data.data.description || "",
        plannedDate: toDateInput(data.data.plannedDate),
        deadline: toDateInput(data.data.deadline),
        status: data.data.status || "Pending",
        priority: data.data.priority || "Medium",
      });
      setEditing(false);
      toast.success("Task updated");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: newComment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add comment");
      setComments((prev) => [...prev, data.data]);
      setNewComment("");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const uploadDocuments = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      const res = await fetch(`/api/tasks/${task.id}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload documents");
      setDocuments((prev) => [...prev, ...data.data]);
      toast.success("Documents uploaded");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const deleteDocument = async (documentId) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/documents?documentId=${documentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete document");
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deleteTask = async () => {
    if (!confirm("Delete this task permanently?")) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete task");
      toast.success("Task deleted");
      onChanged?.(null);
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const canDelete = task.assignedBy?.id === currentUserId || (!task.assignedBy && task.assignee?.id === currentUserId) || canManage;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-4 sm:p-8 relative">
        <button onClick={onClose} className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-slate-700 bg-slate-100 dark:bg-slate-800 rounded-full p-2">
          <span className="material-symbols-outlined text-lg leading-none">close</span>
        </button>

        <div className="pr-10 mb-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${STATUS_CLASS[task.status] || "bg-slate-100 text-slate-700"}`}>{task.status}</span>
            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${PRIORITY_CLASS[task.priority] || ""}`}>{task.priority}</span>
            {task.assignedBy && <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-teal-100 text-teal-800">Assigned</span>}
          </div>
          {!editing ? (
            <>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white break-words">{task.title}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Assigned to {task.assignee?.name || "—"}
                {task.assignedBy ? ` by ${task.assignedBy.name}` : ""} · {formatDateTime(task.createdAt)}
              </p>
            </>
          ) : (
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit task</h2>
          )}
        </div>

        {editing ? (
          <div className="space-y-4 mb-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg bg-transparent text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg bg-transparent text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Planned Date</label>
                <input type="date" value={form.plannedDate} onChange={(e) => setForm({ ...form, plannedDate: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg bg-transparent text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Deadline</label>
                <input type="date" min={form.plannedDate || undefined} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg bg-transparent text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-sm">
                  {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-sm">
                  {PRIORITIES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 rounded-full border text-xs font-bold">Cancel</button>
              <button type="button" onClick={saveChanges} disabled={saving} className="px-4 py-2 rounded-full bg-primary text-white text-xs font-bold disabled:opacity-60">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Assigned Date</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">{formatDate(task.createdAt)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Planned Date</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">{formatDate(task.plannedDate)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Deadline</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">{formatDate(task.deadline)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Completed</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">{formatDate(task.completionDate)}</p>
              </div>
            </div>

            {task.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap mb-5">{task.description}</p>
            )}
          </>
        )}

        <section className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Documents</h3>
            {canWrite && (
              <label className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-blue-600 text-white cursor-pointer hover:bg-blue-700">
                {uploading ? "Uploading..." : "Upload"}
                <input type="file" multiple className="hidden" onChange={uploadDocuments} disabled={uploading} />
              </label>
            )}
          </div>
          {documents.length === 0 ? (
            <p className="text-xs text-slate-500">No documents attached.</p>
          ) : (
            <div className="space-y-1.5">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-2">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">description</span>
                  <a href={doc.url} target="_blank" rel="noreferrer" className="flex-1 text-xs font-medium text-blue-600 hover:underline truncate">{doc.name}</a>
                  {canWrite && (
                    <button onClick={() => deleteDocument(doc.id)} className="text-rose-500 hover:text-rose-700">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">Comments</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-500">No comments yet.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-1 gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{comment.author?.name || "User"}</span>
                    <span className="text-[10px] text-slate-400">{formatDateTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{comment.text}</p>
                </div>
              ))
            )}
          </div>
          {canWrite && (
            <form onSubmit={addComment} className="flex gap-2 mt-3">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm bg-transparent"
              />
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold">Post</button>
            </form>
          )}
        </section>

        <div className="flex flex-wrap gap-3 justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            {canWrite && canDelete && (
              <button onClick={deleteTask} className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">delete</span> Delete task
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {canWrite && !editing && (
              <button onClick={() => setEditing(true)} className="px-4 py-2 rounded-full bg-primary text-white text-xs font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">edit</span> Edit
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2 rounded-full border text-xs font-bold">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TasksPageContent() {
  const { token, user, can } = useAuth();
  const toast = useToast();
  const searchParams = useSearchParams();

  const [view, setView] = useState(user?.roleName === "ADMIN" ? "all" : "mine");
  const [createFiles, setCreateFiles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [assignables, setAssignables] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigneeId: "",
    plannedDate: getISTDateKey(),
    deadline: "",
    priority: "Medium",
  });

  const isAdmin = user?.roleName === "ADMIN";
  const canWrite = can("tasks", "WRITE");

  useEffect(() => {
    if (isAdmin) {
      setView((prev) => (prev === "mine" ? "all" : prev));
    }
  }, [isAdmin]);

  const loadTasks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ view });
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      const res = await fetch(`/api/tasks?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load tasks");
      setTasks(data.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, view, statusFilter, priorityFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const taskId = searchParams.get("task");
    if (!taskId || !tasks.length) return;
    const found = tasks.find((task) => task.id === taskId);
    if (found) setSelectedTask(found);
  }, [searchParams, tasks]);

  const openCreate = async () => {
    setShowCreate(true);
    setCreateFiles([]);
    try {
      const res = await fetch("/api/tasks/assignable", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAssignables(data.data || []);
        setForm((prev) => ({ ...prev, assigneeId: prev.assigneeId || user.id }));
      }
    } catch {
      // Assignment list is optional; users can still create personal tasks.
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const dateError = validateDateOrder(
      form.plannedDate || getISTDateKey(),
      form.deadline,
      { startLabel: "Planned date", endLabel: "Deadline" }
    );
    if (dateError) {
      toast.error(dateError);
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          assigneeId: form.assigneeId || user.id,
          plannedDate: form.plannedDate || getISTDateKey(),
          deadline: form.deadline || null,
          priority: form.priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create task");

      if (createFiles.length > 0) {
        const formData = new FormData();
        createFiles.forEach((file) => formData.append("files", file));
        const uploadRes = await fetch(`/api/tasks/${data.data.id}/documents`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!uploadRes.ok) {
          toast.error("Task created, but documents could not be uploaded.");
        }
      }

      toast.success("Task created");
      setShowCreate(false);
      setCreateFiles([]);
      setForm({ title: "", description: "", assigneeId: user.id, plannedDate: getISTDateKey(), deadline: "", priority: "Medium" });
      loadTasks();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "Completed").length;
    const overdue = tasks.filter((task) => task.status !== "Completed" && task.status !== "Cancelled" && task.deadline && new Date(task.deadline) < new Date()).length;
    return { total, completed, pending: total - completed, overdue };
  }, [tasks]);

  const handleChanged = (updated) => {
    if (!updated) {
      setSelectedTask(null);
      loadTasks();
      return;
    }
    setTasks((prev) => prev.map((task) => (task.id === updated.id ? updated : task)));
    setSelectedTask(updated);
  };

  return (
    <div className="p-6 md:p-10 pb-24 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="page-title text-on-surface">Tasks</h1>
          <p className="text-sm text-on-surface-variant mt-2">Plan daily work, track assigned tasks and collaborate with your team.</p>
        </div>
        {canWrite && (
          <button onClick={openCreate} className="px-4 py-2 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary-container transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span> New Task
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: "checklist", tone: "text-slate-700 bg-slate-100" },
          { label: "Completed", value: stats.completed, icon: "task_alt", tone: "text-emerald-700 bg-emerald-100" },
          { label: "Pending", value: stats.pending, icon: "pending_actions", tone: "text-amber-700 bg-amber-100" },
          { label: "Overdue", value: stats.overdue, icon: "warning", tone: "text-rose-700 bg-rose-100" },
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{card.label}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p>
            </div>
            <span className={`material-symbols-outlined rounded-xl p-2.5 ${card.tone}`}>{card.icon}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ...(isAdmin ? [{ key: "all", label: "All Tasks" }] : [{ key: "mine", label: "My Tasks" }]),
          { key: "assigned-by-me", label: "Assigned by Me" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
              view === tab.key ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-full text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <option value="">All statuses</option>
            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 rounded-full text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <option value="">All priorities</option>
            {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">checklist</span>
            <p className="text-sm text-slate-500 mt-2">No tasks found for this view.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tasks.map((task) => {
              const isOverdue = task.status !== "Completed" && task.status !== "Cancelled" && task.deadline && new Date(task.deadline) < new Date();
              return (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    task.status === "Completed" ? "bg-emerald-500" : isOverdue ? "bg-rose-500" : "bg-amber-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold break-words ${task.status === "Completed" ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-100"}`}>
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${STATUS_CLASS[task.status] || ""}`}>{task.status}</span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${PRIORITY_CLASS[task.priority] || ""}`}>{task.priority}</span>
                      {task.assignedBy && <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">Assigned by {task.assignedBy.name}</span>}
                      {task.documents?.length > 0 && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><span className="material-symbols-outlined text-[13px]">attachment</span>{task.documents.length}</span>
                      )}
                      <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><span className="material-symbols-outlined text-[13px]">chat_bubble</span>{task.comments?.length || 0}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[10px] font-bold ${isOverdue ? "text-rose-600" : "text-slate-500"}`}>
                      {task.deadline ? `Due ${formatDate(task.deadline)}` : `Planned ${formatDate(task.plannedDate)}`}
                    </p>
                    {task.assignee && <p className="text-[10px] text-slate-400 mt-0.5">{task.assignee.name}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl p-5 sm:p-8 max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 dark:bg-slate-800 rounded-full p-2">
              <span className="material-symbols-outlined text-lg leading-none">close</span>
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 pr-10">Create Task</h2>
            <form onSubmit={createTask} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Title</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg bg-transparent text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg bg-transparent text-sm" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Assign To</label>
                  <select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-sm">
                    <option value={user.id}>{user.name} (me)</option>
                    {assignables.filter((person) => person.id !== user.id).map((person) => (
                      <option key={person.id} value={person.id}>{person.name} ({person.role?.name?.replaceAll("_", " ")})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-sm">
                    {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Planned Date</label>
                  <input type="date" value={form.plannedDate} onChange={(e) => setForm({ ...form, plannedDate: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg bg-transparent text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Deadline</label>
                  <input type="date" min={form.plannedDate || undefined} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg bg-transparent text-sm" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Documents</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setCreateFiles(Array.from(e.target.files || []))}
                  className="mt-1 block w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white file:text-[11px] file:font-bold"
                />
                {createFiles.length > 0 && (
                  <p className="text-[10px] text-slate-500 mt-1">{createFiles.length} file(s) will be uploaded with the task.</p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-full border text-xs font-bold">Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 rounded-full bg-primary text-white text-xs font-bold disabled:opacity-60">
                  {creating ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal
          key={selectedTask.id}
          task={selectedTask}
          token={token}
          onClose={() => setSelectedTask(null)}
          onChanged={handleChanged}
          canManage={isAdmin}
          currentUserId={user.id}
          canWrite={canWrite}
        />
      )}

      <div className="flex justify-end">
        <a href="/tasks/analytics" className={`text-xs font-bold text-primary hover:underline ${can("task-analytics") ? "" : "hidden"}`}>
          Open task analytics →
        </a>
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">Loading tasks...</div>}>
      <TasksPageContent />
    </Suspense>
  );
}
