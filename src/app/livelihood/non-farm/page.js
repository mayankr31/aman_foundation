"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { getTypesByCategory, getTypeConfig } from "@/lib/livelihoodTypes";

export default function NonFarmPrograms() {
  const { token } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("");
  const [newTarget, setNewTarget] = useState("");

  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");

  const nonFarmTypes = getTypesByCategory("NON_FARM");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch("/api/livelihood/programs?category=NON_FARM", { headers });
        const json = await res.json();
        if (json.success) {
          setPrograms(json.data.programs || []);
        }
      } catch (err) {
        console.error("Failed to load non-farm programs:", err);
      }
      setLoading(false);
    }
    load();
  }, [token, refreshTrigger]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName || !newType) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
      const res = await fetch("/api/livelihood/programs", {
        method: "POST",
        headers,
        body: JSON.stringify({ category: "NON_FARM", type: newType, name: newName, description: newDesc, totalTarget: newTarget || null }),
      });
      const json = await res.json();
      if (json.success) {
        setNewName(""); setNewDesc(""); setNewType(""); setNewTarget("");
        setShowAddModal(false);
        setRefreshTrigger((p) => p + 1);
      } else {
        alert(json.error || "Failed to create program");
      }
    } catch (err) {
      console.error("Add program error:", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/livelihood/programs/${deleteId}`, { method: "DELETE", headers });
      const json = await res.json();
      if (json.success) {
        setDeleteId(null); setDeleteName("");
        setRefreshTrigger((p) => p + 1);
      } else {
        alert(json.error || "Failed to delete program");
      }
    } catch (err) {
      console.error("Delete program error:", err);
    }
  };

  let totalParticipants = 0;
  let totalTarget = 0;
  programs.forEach((p) => {
    totalParticipants += p._count?.assignments || 0;
    totalTarget += p.totalTarget || 0;
  });

  return (
    <div className="p-8 flex-1 flex flex-col gap-8 max-w-7xl mx-auto w-full pb-24">
      <Link href="/livelihood" className="flex items-center gap-2 text-slate-500 hover:text-amber-600 transition-colors mb-6 group w-fit">
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">arrow_back</span>
        <span className="text-[10px] font-bold uppercase tracking-widest">Back to Livelihood Hub</span>
      </Link>

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[2.75rem] font-headline tracking-[-0.02em] leading-tight text-on-surface mb-2 font-bold">Non-Farm Programs</h2>
          <p className="text-on-surface-variant font-body text-sm max-w-2xl">Livestock &amp; allied activities: goat rearing, fish farming, poultry, and more.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-amber-600 text-white px-6 py-3 rounded-full text-xs font-semibold hover:bg-amber-700 transition-all flex items-center gap-2 shadow-lg shadow-amber-600/30 active:scale-95 cursor-pointer border-none"
        >
          <span className="material-symbols-outlined text-sm">add_box</span>Add Program
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest rounded-lg p-6 shadow-ambient border border-outline-variant/10">
          <span className="font-label text-xs uppercase tracking-[0.05em] text-on-surface-variant mb-4 block font-bold">Active Programs</span>
          <span className="text-4xl font-headline font-bold text-amber-600">{programs.length}</span>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-6 shadow-ambient border border-outline-variant/10">
          <span className="font-label text-xs uppercase tracking-[0.05em] text-on-surface-variant mb-4 block font-bold">Total Participants</span>
          <span className="text-4xl font-headline font-bold text-on-surface">{totalParticipants}</span>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-6 shadow-ambient border border-outline-variant/10">
          <span className="font-label text-xs uppercase tracking-[0.05em] text-on-surface-variant mb-4 block font-bold">Total Target</span>
          <span className="text-4xl font-headline font-bold text-on-surface">{totalTarget.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-lg p-6 shadow-ambient border border-outline-variant/10">
        <h3 className="text-lg font-bold text-on-surface mb-6">Non-Farm Programs Overview</h3>
        {loading ? (
          <p className="text-sm text-on-surface-variant text-center py-8">Loading...</p>
        ) : programs.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-8 italic">No non-farm programs yet. Click "Add Program" to create one.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((prog) => {
              const config = getTypeConfig(prog.type);
              return (
                <div key={prog.id} className="p-5 border border-surface-container-high rounded-xl bg-surface-container-low/20 space-y-4 hover:bg-surface-container-low transition-colors relative group">
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.preventDefault(); setDeleteId(prog.id); setDeleteName(prog.name); }}
                      className="p-1.5 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer border-none bg-transparent"
                      title="Delete program"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                  <Link href={`/livelihood/programs/${prog.id}`} className="no-underline text-left block">
                    <span className="px-2.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-700 uppercase tracking-wider font-bold">
                      {config?.label || prog.type}
                    </span>
                    <h4 className="font-bold text-base text-on-surface mt-2">{prog.name}</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{prog.description || "—"}</p>
                    <div className="grid grid-cols-2 gap-4 border-t border-surface-container-high pt-4 mt-3 text-xs font-semibold">
                      <div>
                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Target</p>
                        <p className="text-on-surface font-bold mt-0.5">{prog.totalTarget ? `${prog.totalTarget} ${config?.programTargetUnit || "units"}` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Participants</p>
                        <p className="text-amber-600 font-bold mt-0.5">{prog._count?.assignments || 0} Families</p>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Program Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Add Non-Farm Program</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer border-none bg-transparent">
                <span className="material-symbols-outlined font-bold">close</span>
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Program Type</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value)} required className="px-4 py-2 border rounded-lg focus:outline-none focus:border-amber-500 border-outline-variant bg-transparent text-on-surface font-sans">
                  <option value="">Select type...</option>
                  {nonFarmTypes.map((t) => (
                    <option key={t.type} value={t.type}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Program Name</label>
                <input type="text" required placeholder="e.g. Black Bengal Multiplication Phase I" value={newName} onChange={(e) => setNewName(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-amber-500 border-outline-variant bg-transparent text-on-surface font-sans" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</label>
                <textarea placeholder="Describe program details..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-amber-500 border-outline-variant bg-transparent text-on-surface font-sans resize-none" rows="3" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Target</label>
                <input type="number" step="1" placeholder="e.g. 200" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-amber-500 border-outline-variant bg-transparent text-on-surface font-sans" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer bg-transparent">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-full bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors cursor-pointer border-none">Create Program</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4" onClick={() => { setDeleteId(null); setDeleteName(""); }}>
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 font-sans border border-outline-variant/10 text-on-surface" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-on-surface">Delete Program</h3>
            <p className="text-sm text-on-surface-variant">Are you sure you want to delete <strong>{deleteName}</strong>? This will permanently remove all associated beneficiary assignments and events.</p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setDeleteId(null); setDeleteName(""); }} className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer bg-transparent">Cancel</button>
              <button onClick={handleDelete} className="px-5 py-2 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors cursor-pointer border-none">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
