"use client";

import Link from "next/link";
import { useState } from "react";

export default function DisasterRelief() {
  const [activeAlert, setActiveAlert] = useState({
    severity: "Critical",
    message: "Supply shortage logged for Sector 4 Medical station. Urgent restock requested.",
  });
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastSeverity, setBroadcastSeverity] = useState("Urgent");

  const [activeTab, setActiveTab] = useState("Affected Registry");

  // Registry of Help Providers
  const [providers, setProviders] = useState([
    {
      id: "PROV-401",
      name: "Team Alpha Medical",
      type: "Responders (Medical)",
      contact: "Dr. Sarah (+91 99887 76655)",
      status: "Active in Sector 4",
      statusClass: "bg-primary-fixed text-on-primary-fixed",
    },
    {
      id: "PROV-112",
      name: "Logistics Convoy B",
      type: "Responders (Logistics)",
      contact: "convoy_lead@relief.org",
      status: "Loading supplies",
      statusClass: "bg-secondary-container text-on-secondary-fixed",
    },
    {
      id: "PROV-908",
      name: "Rotary Volunteer Cohort",
      type: "Volunteers (Food)",
      contact: "Volunteer Group",
      status: "Standby / Rest",
      statusClass: "bg-surface-container text-on-surface-variant",
    },
  ]);

  // Registry of Affected People
  const [affected, setAffected] = useState([
    {
      id: "AFF-102",
      family: "Garcia Family",
      location: "Sector 4 Evac Center",
      size: 5,
      requirement: "Medical, Blankets",
      status: "High Priority",
      statusClass: "bg-error-container text-on-error-container",
    },
    {
      id: "AFF-884",
      family: "Elderly Cohort",
      location: "Sector 2 Base",
      size: 8,
      requirement: "Warm Meals, Water",
      status: "Completed",
      statusClass: "bg-primary-fixed text-on-primary-fixed",
    },
    {
      id: "AFF-394",
      family: "Patel Household",
      location: "Temporary Shelter 3",
      size: 4,
      requirement: "Baby Food, Hydration",
      status: "In Progress",
      statusClass: "bg-secondary-container text-on-secondary-fixed",
    },
  ]);

  // Supply Stock Ledger
  const [inventory, setInventory] = useState([
    { item: "MRE Food Packages", stock: 1200, unit: "Boxes", status: "Optimal" },
    { item: "Drinking Water Tanks", stock: 14, unit: "Liters (1k each)", status: "Critical Shortage" },
    { item: "Medical Trauma Kits", stock: 45, unit: "Kits", status: "Optimal" },
    { item: "Blankets & Warm Wear", stock: 250, unit: "Packs", status: "Restock Requested" },
  ]);

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastMsg) return;
    setActiveAlert({
      severity: broadcastSeverity,
      message: broadcastMsg,
    });
    setBroadcastMsg("");
    setShowBroadcastModal(false);
  };

  return (
    <div className="flex-grow flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col px-6 md:px-12 pt-8 md:pt-12 pb-2 z-10 relative">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
        >
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
            arrow_back
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
            Back to Dashboard
          </span>
        </Link>

        {/* Dynamic Warning Alert */}
        {activeAlert && (
          <div className="p-4 rounded-xl flex items-center justify-between border font-sans mb-6 bg-error-container/20 border-error/30 text-error-container">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined shrink-0 text-secondary">gavel</span>
              <p className="text-sm font-medium">
                <strong>[{activeAlert.severity} Alert]</strong> {activeAlert.message}
              </p>
            </div>
            <button onClick={() => setActiveAlert(null)} className="p-1 hover:bg-black/5 rounded-full transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-2 font-sans">
              Operations Portal
            </p>
            <h1 className="text-2xl md:text-[2.75rem] font-headline font-semibold text-on-background leading-tight">
              Disaster Relief Management
            </h1>
          </div>
          <div className="flex flex-wrap gap-3 font-sans shrink-0">
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="flex-1 md:flex-none bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity shadow-[0_4px_12px_rgba(0,104,87,0.2)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_alert</span>
              <span className="whitespace-nowrap">Broadcast Alert</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Page Layout */}
      <div className="flex-grow px-6 md:px-12 pb-24 md:pb-12 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
          
          {/* Map Overlay & Inventory */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Impact Map */}
            <div className="bg-surface-container-lowest rounded-xl p-2 shadow-ambient border border-outline-variant/10">
              <div className="relative w-full h-[320px] rounded-lg overflow-hidden bg-surface-container-low">
                <img
                  alt="Impact Map Coordinate"
                  className="w-full h-full object-cover opacity-70"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCohJz_BffipmMDya16uh_HOFp_4k0SIvfDYfUmf5d_eHfBiL4_30hOALTOEPzHfj-Q6qAzgbrdBRcrvw03_eABEZReM4mFz0Aas9dg3_x0A7WXUum0u6klvnvhfI0dytRHz5WjiuQYj1c1Vp5p4YLvUdjJfO-mav08NQ8k2GlmxF0l4EUgXebassFs9Bde0VfR7qVRZlW5XoFNpmNtEtiV-UeN-APWXuSTSt6fTrMXR1I8fBzVgFYxtWbpUVRna4Xus3BOIy7fPynl"
                />
                <div className="absolute top-4 left-4 glass-panel px-4 py-2 bg-white/80 rounded-lg shadow-sm border border-white/20 font-sans">
                  <p className="text-xs text-on-surface-variant font-bold">Sector Alpha Operations</p>
                  <p className="font-semibold text-xs text-on-surface mt-1">4 Active Dispatch Convoy routes</p>
                </div>
              </div>
            </div>

            {/* Registries Segment Tabs */}
            <div className="flex border-b border-surface-container-highest overflow-x-auto no-scrollbar font-sans">
              {["Affected Registry", "Help Providers", "Resource Inventory"].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? "font-semibold text-primary border-b-2 border-primary"
                        : "font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 border-b-2 border-transparent"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Registries Table */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
              {activeTab === "Affected Registry" && (
                <div>
                  <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Affected Families Registry</h3>
                  <table className="w-full text-left border-collapse font-sans text-sm">
                    <thead>
                      <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                        <th className="py-3 px-4">Family / Group</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4 text-center">Family Size</th>
                        <th className="py-3 px-4">Aid Requirement</th>
                        <th className="py-3 px-4 text-right">Relief Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {affected.map((a) => (
                        <tr key={a.id} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-4 px-4 font-bold text-on-surface">{a.family}</td>
                          <td className="py-4 px-4 text-on-surface-variant">{a.location}</td>
                          <td className="py-4 px-4 text-center font-semibold text-on-surface">{a.size} Members</td>
                          <td className="py-4 px-4 text-xs font-semibold text-primary">{a.requirement}</td>
                          <td className="py-4 px-4 text-right">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${a.statusClass}`}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "Help Providers" && (
                <div>
                  <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Help Providers &amp; Responder Roster</h3>
                  <table className="w-full text-left border-collapse font-sans text-sm">
                    <thead>
                      <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                        <th className="py-3 px-4">Responder Name</th>
                        <th className="py-3 px-4">Capability Type</th>
                        <th className="py-3 px-4">Contact Details</th>
                        <th className="py-3 px-4 text-right">Current Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providers.map((p) => (
                        <tr key={p.id} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-4 px-4 font-bold text-on-surface">{p.name}</td>
                          <td className="py-4 px-4 text-on-surface-variant">{p.type}</td>
                          <td className="py-4 px-4 text-xs font-semibold text-slate-500 font-mono">{p.contact}</td>
                          <td className="py-4 px-4 text-right">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${p.statusClass}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "Resource Inventory" && (
                <div>
                  <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Supply Stocks &amp; Ledger</h3>
                  <table className="w-full text-left border-collapse font-sans text-sm">
                    <thead>
                      <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                        <th className="py-3 px-4">Supply Item</th>
                        <th className="py-3 px-4">Available Stock</th>
                        <th className="py-3 px-4">UoM</th>
                        <th className="py-3 px-4 text-right">Stock Level Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item, idx) => (
                        <tr key={idx} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-4 px-4 font-bold text-on-surface">{item.item}</td>
                          <td className="py-4 px-4 text-on-surface font-semibold">{item.stock}</td>
                          <td className="py-4 px-4 text-on-surface-variant text-xs">{item.unit}</td>
                          <td className="py-4 px-4 text-right">
                            <span className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${
                              item.status === "Optimal" ? "bg-primary-fixed text-on-primary-fixed" : "bg-error-container text-on-error-container"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Distribution Logs */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Distribution log */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
              <h3 className="font-headline font-bold text-base text-on-surface mb-2">Relief Distribution Logs</h3>
              <p className="text-xs text-on-surface-variant mb-6 font-sans">Synced Realtime</p>
              <div className="relative border-l border-surface-container ml-3 space-y-6 font-sans text-sm">
                <div className="relative pl-6">
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-surface-container-lowest"></div>
                  <div className="text-[10px] text-slate-400 font-bold mb-1">10:42 AM</div>
                  <div className="font-bold text-on-surface">500 MRE Kits Delivered</div>
                  <div className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Sector 4 station, signed by Aisha Rahman.
                  </div>
                </div>

                <div className="relative pl-6">
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-surface-container ring-4 ring-surface-container-lowest"></div>
                  <div className="text-[10px] text-slate-400 font-bold mb-1">Yesterday</div>
                  <div className="font-bold text-on-surface">Water Tanker Dispatched</div>
                  <div className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Logistics Convoy B routed to Sector 2 evac point.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Alert Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Broadcast Regional Emergency Alert</h3>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleBroadcast} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Emergency Message
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. Flash flood warning issued for Sector 4."
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent resize-none text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Alert Severity
                </label>
                <select
                  value={broadcastSeverity}
                  onChange={(e) => setBroadcastSeverity(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface"
                >
                  <option value="Info">Info Alert</option>
                  <option value="Urgent">Urgent Alert</option>
                  <option value="Critical">Critical Broadcast</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                >
                  Broadcast Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
