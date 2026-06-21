"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";

export default function DisasterRelief() {
  const { token, isInitializing } = useAuth();
  
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastSeverity, setBroadcastSeverity] = useState("Urgent");

  const [activeTab, setActiveTab] = useState("Help Providers");

  // Live state registries
  const [incidentsList, setIncidentsList] = useState([]);
  const [providers, setProviders] = useState([]);
  const [resourceNeeds, setResourceNeeds] = useState([]);
  const [ledgerLogs, setLedgerLogs] = useState([]);

  // Transaction form states
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerResourceNeedId, setLedgerResourceNeedId] = useState("");
  const [ledgerQuantity, setLedgerQuantity] = useState("");
  const [ledgerNotes, setLedgerNotes] = useState("");

  // New Modals
  const [showCalamityModal, setShowCalamityModal] = useState(false);
  const [calamityForm, setCalamityForm] = useState({
    name: "", location: "", type: "", expectedFamiliesAffected: "", humanLossDied: "", humanLossInjured: "", humanLossMissing: "", propertyLossEstimate: ""
  });

  const [showResourceNeedModal, setShowResourceNeedModal] = useState(false);
  const [resourceNeedForm, setResourceNeedForm] = useState({
    incidentId: "", itemName: "", unit: "units", quantityNeeded: "", quantityReceived: "", transactionsCount: ""
  });

  const [showProviderModal, setShowProviderModal] = useState(false);
  const [providerForm, setProviderForm] = useState({
    name: "", capabilityType: "", contactDetails: "", status: "Active"
  });

  const loadData = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Load Incidents (Calamity Information)
      const resIncidents = await fetch("/api/disaster-relief/incidents", { headers });
      const jsonIncidents = await resIncidents.json();
      if (jsonIncidents.success) {
        setIncidentsList(jsonIncidents.data);
      }

      // Load help providers
      const resProviders = await fetch("/api/disaster-relief/help-providers", { headers });
      const jsonProviders = await resProviders.json();
      if (jsonProviders.success) {
        setProviders(jsonProviders.data.map(p => ({
          id: p.id,
          name: p.name,
          type: p.capabilityType,
          contact: p.contactDetails
        })));
      }

      // Load Resource Needs (Inventory for Calamities)
      const resNeeds = await fetch("/api/disaster-relief/resource-needs", { headers });
      const jsonNeeds = await resNeeds.json();
      if (jsonNeeds.success) {
        setResourceNeeds(jsonNeeds.data.map(n => ({
          id: n.id,
          resourceItemId: n.resourceItemId,
          calamity: n.incident?.name || "Unknown",
          item: n.resourceItem?.itemName || "Unknown",
          unit: n.resourceItem?.unit || "units",
          needed: n.quantityNeeded,
          received: n.quantityReceived,
          transactions: n.transactionsCount
        })));
      }

      // Load ledger logs
      const resLedger = await fetch("/api/disaster-relief/ledger", { headers });
      const jsonLedger = await resLedger.json();
      if (jsonLedger.success) {
        setLedgerLogs(jsonLedger.data);
      }
    } catch (err) {
      console.error("Failed to load disaster relief data:", err);
    }
  };

  useEffect(() => {
    if (!isInitializing && token) {
      loadData();
    }
  }, [token, isInitializing]);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMsg) return;

    // Dummy functionality as requested
    alert(`Dummy Broadcast Alert sent!\nSeverity: ${broadcastSeverity}\nMessage: ${broadcastMsg}`);
    setBroadcastMsg("");
    setShowBroadcastModal(false);
  };

  const handleAddLedger = async (e) => {
    e.preventDefault();
    if (!ledgerResourceNeedId || !ledgerQuantity) return;
    
    // Find the resourceItemId from the selected need
    const selectedNeed = resourceNeeds.find(n => n.id === ledgerResourceNeedId);
    if (!selectedNeed) return;

    try {
      const res = await fetch("/api/disaster-relief/ledger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          resourceItemId: selectedNeed.resourceItemId,
          transactionType: "IN", // Fulfilling a need is "IN" to the calamity's allocation
          quantity: ledgerQuantity,
          incidentResourceNeedId: ledgerResourceNeedId,
          notes: ledgerNotes
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowLedgerModal(false);
        setLedgerResourceNeedId("");
        setLedgerQuantity("");
        setLedgerNotes("");
        loadData();
      } else {
        alert(json.error || "Failed to log transaction");
      }
    } catch (err) {
      console.error(err);
      alert("Error logging transaction");
    }
  };

  const handleAddCalamity = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/disaster-relief/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(calamityForm)
      });
      const json = await res.json();
      if (json.success) {
        setShowCalamityModal(false);
        setCalamityForm({ name: "", location: "", type: "", expectedFamiliesAffected: "", humanLossDied: "", humanLossInjured: "", humanLossMissing: "", propertyLossEstimate: "" });
        loadData();
      } else {
        alert(json.error || "Failed to add calamity");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding calamity");
    }
  };

  const handleAddResourceNeed = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/disaster-relief/resource-needs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(resourceNeedForm)
      });
      const json = await res.json();
      if (json.success) {
        setShowResourceNeedModal(false);
        setResourceNeedForm({ incidentId: "", itemName: "", unit: "units", quantityNeeded: "", quantityReceived: "", transactionsCount: "" });
        loadData();
      } else {
        alert(json.error || "Failed to add resource need");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding resource need");
    }
  };

  const handleAddProvider = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/disaster-relief/help-providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(providerForm)
      });
      const json = await res.json();
      if (json.success) {
        setShowProviderModal(false);
        setProviderForm({ name: "", capabilityType: "", contactDetails: "", status: "Active" });
        loadData();
      } else {
        alert(json.error || "Failed to add help provider");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding help provider");
    }
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
              onClick={() => setShowCalamityModal(true)}
              className="flex-1 md:flex-none bg-surface-container-low text-on-surface border border-outline-variant px-5 py-2.5 rounded-full text-sm font-medium hover:bg-surface-container-lowest transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">emergency</span>
              <span className="whitespace-nowrap">Add Calamity</span>
            </button>
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="flex-1 md:flex-none bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity shadow-[0_4px_12px_rgba(0,104,87,0.2)] flex items-center justify-center gap-2 cursor-pointer border-none"
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
          
          {/* Main Content & Inventory */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Calamity Information Section */}
            {incidentsList.length > 0 ? (
              <div className="space-y-6">
                {incidentsList.map((incident) => (
                  <div key={incident.id} className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-headline font-bold text-error flex items-center gap-2">
                          <span className="material-symbols-outlined">warning</span>
                          {incident.name}
                        </h2>
                        <p className="text-sm text-on-surface-variant font-sans mt-1">
                          Location: {incident.location} | Type: {incident.type}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${incident.active ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-on-surface-variant'}`}>
                        {incident.active ? 'Active Calamity' : 'Resolved'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                      <div className="p-4 bg-surface-container-low rounded-lg border border-surface-container">
                        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1">Families Affected</p>
                        <p className="text-2xl font-bold text-on-surface">{incident.expectedFamiliesAffected.toLocaleString()}</p>
                      </div>
                      
                      <div className="p-4 bg-error-container/20 rounded-lg border border-error/20">
                        <p className="text-xs font-semibold text-error uppercase tracking-wide mb-1">Human Loss</p>
                        <div className="flex gap-4 text-sm text-on-surface font-medium">
                          <div><span className="text-error font-bold">{incident.humanLossDied}</span> Died</div>
                          <div><span className="text-secondary font-bold">{incident.humanLossInjured}</span> Injured</div>
                          <div><span className="text-on-surface-variant font-bold">{incident.humanLossMissing}</span> Missing</div>
                        </div>
                      </div>

                      <div className="p-4 bg-surface-container-low rounded-lg border border-surface-container">
                        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1">Property Loss Est.</p>
                        <p className="text-2xl font-bold text-on-surface">₹ {incident.propertyLossEstimate.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-xl p-8 shadow-ambient border border-outline-variant/10 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">check_circle</span>
                <h2 className="text-xl font-headline font-bold text-on-surface">No Active Calamities</h2>
                <p className="text-sm text-on-surface-variant font-sans mt-2">There are currently no active disasters reported in the system.</p>
              </div>
            )}

            {/* Registries Segment Tabs */}
            <div className="flex border-b border-surface-container-highest overflow-x-auto no-scrollbar font-sans">
              {["Help Providers", "Resource Inventory"].map((tab) => {
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
              {activeTab === "Help Providers" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-headline font-bold text-xl text-on-surface">Help Providers &amp; Responder Roster</h3>
                    <button
                      onClick={() => setShowProviderModal(true)}
                      className="bg-surface-container-low text-on-surface border border-outline-variant px-4 py-2 rounded-full text-sm font-medium hover:bg-surface-container-lowest transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">person_add</span>
                      <span className="whitespace-nowrap">Add Provider</span>
                    </button>
                  </div>
                  <table className="w-full text-left border-collapse font-sans text-sm">
                    <thead>
                      <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                        <th className="py-3 px-4">Responder Name</th>
                        <th className="py-3 px-4">Immediate Support Capability</th>
                        <th className="py-3 px-4">Contact Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providers.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="py-8 text-center text-on-surface-variant">No help providers registered.</td>
                        </tr>
                      ) : (
                        providers.map((p) => (
                          <tr key={p.id} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors">
                            <td className="py-4 px-4 font-bold text-on-surface">{p.name}</td>
                            <td className="py-4 px-4 text-on-surface-variant">
                              <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded-md text-xs font-semibold">
                                {p.type}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-xs font-semibold text-slate-500 font-mono">{p.contact}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "Resource Inventory" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-headline font-bold text-xl text-on-surface">Calamity Resource Needs</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowResourceNeedModal(true)}
                        className="bg-surface-container-low text-on-surface border border-outline-variant px-4 py-2 rounded-full text-sm font-medium hover:bg-surface-container-lowest transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                        <span className="whitespace-nowrap">Add Need</span>
                      </button>
                      <button
                        onClick={() => setShowLedgerModal(true)}
                        className="bg-gradient-to-br from-secondary to-secondary-container text-on-secondary px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity shadow-[0_2px_8px_rgba(0,0,0,0.1)] flex items-center justify-center gap-2 cursor-pointer border-none"
                      >
                        <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                        <span className="whitespace-nowrap">Log Transaction</span>
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-sans text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                          <th className="py-3 px-4">Aid Needed (Item)</th>
                          <th className="py-3 px-4">Associated Calamity</th>
                          <th className="py-3 px-4 text-center">Stock Needed</th>
                          <th className="py-3 px-4 text-center">Stock Received</th>
                          <th className="py-3 px-4 text-center">Fulfillment</th>
                          <th className="py-3 px-4 text-right">Transactions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resourceNeeds.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-8 text-center text-on-surface-variant">No resources currently needed.</td>
                          </tr>
                        ) : (
                          resourceNeeds.map((item) => {
                            const percent = item.needed > 0 ? Math.min(100, Math.round((item.received / item.needed) * 100)) : 0;
                            return (
                              <tr key={item.id} className="border-b border-surface-container last:border-none hover:bg-surface-container-low/50 transition-colors">
                                <td className="py-4 px-4 font-bold text-on-surface">{item.item}</td>
                                <td className="py-4 px-4 text-on-surface-variant text-xs">{item.calamity}</td>
                                <td className="py-4 px-4 text-center text-error font-semibold">{item.needed} {item.unit}</td>
                                <td className="py-4 px-4 text-center text-primary font-semibold">{item.received} {item.unit}</td>
                                <td className="py-4 px-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-16 h-2 bg-surface-container rounded-full overflow-hidden">
                                      <div className="h-full bg-primary" style={{ width: `${percent}%` }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-on-surface-variant">{percent}%</span>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-right font-mono text-xs text-on-surface-variant">
                                  {item.transactions} Parts
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
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
              <div className="relative border-l border-surface-container ml-3 space-y-6 font-sans text-sm font-medium max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                {ledgerLogs.length === 0 ? (
                  <p className="text-xs text-on-surface-variant">No ledger transactions logged.</p>
                ) : (
                  ledgerLogs.map((log) => {
                    const dateStr = new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
                    return (
                      <div key={log.id} className="relative pl-6">
                        <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full ring-4 ring-surface-container-lowest ${
                          log.transactionType === "IN" ? "bg-primary" : "bg-secondary"
                        }`}></div>
                        <div className="text-[10px] text-slate-400 font-bold mb-1">{dateStr}</div>
                        <div className="font-bold text-on-surface">
                          {log.quantity} {log.resourceItem?.unit} {log.resourceItem?.itemName} {log.transactionType === "IN" ? "Received" : "Distributed"}
                        </div>
                        {log.incidentResourceNeed?.incident?.name && (
                          <div className="text-xs font-semibold text-primary mt-0.5">
                            For: {log.incidentResourceNeed.incident.name}
                          </div>
                        )}
                        <div className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                          {log.notes}
                          <span className="block text-[9px] text-slate-400 mt-1 font-mono">Logged by {log.handledByUser?.name || "System"}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Alert Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface">
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
                  placeholder="e.g. Beki River water levels rising. Residents in Bartari advised to move to school shelter."
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
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary/95 transition-colors cursor-pointer border-none"
                >
                  Broadcast Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Transaction Modal */}
      {showLedgerModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Log Supply Transaction</h3>
              <button
                onClick={() => setShowLedgerModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddLedger} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Select Resource Need To Fulfill <span className="text-error">*</span></label>
                <select required value={ledgerResourceNeedId} onChange={(e) => setLedgerResourceNeedId(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface">
                  <option value="">-- Select Resource Need --</option>
                  {resourceNeeds.map(need => (
                    <option key={need.id} value={need.id}>{need.item} ({need.calamity}) - Needed: {need.needed - need.received}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quantity Being Provided <span className="text-error">*</span></label>
                <input required type="number" step="any" placeholder="0" value={ledgerQuantity} onChange={(e) => setLedgerQuantity(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Transaction Notes</label>
                <textarea rows="2" placeholder="e.g. Delivered via ABC Transport" value={ledgerNotes} onChange={(e) => setLedgerNotes(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent resize-none text-on-surface" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLedgerModal(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-secondary text-white font-semibold hover:bg-secondary/95 transition-colors cursor-pointer border-none"
                >
                  Log Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Calamity Modal */}
      {showCalamityModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Add New Calamity</h3>
              <button
                onClick={() => setShowCalamityModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddCalamity} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Calamity Name <span className="text-error">*</span></label>
                  <input required type="text" placeholder="e.g. Assam Floods" value={calamityForm.name} onChange={(e) => setCalamityForm({ ...calamityForm, name: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Location <span className="text-error">*</span></label>
                  <input required type="text" placeholder="e.g. Kalgachia" value={calamityForm.location} onChange={(e) => setCalamityForm({ ...calamityForm, location: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Type <span className="text-error">*</span></label>
                  <input required type="text" placeholder="e.g. Flood, Earthquake" value={calamityForm.type} onChange={(e) => setCalamityForm({ ...calamityForm, type: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Expected Families Affected</label>
                  <input type="number" placeholder="0" value={calamityForm.expectedFamiliesAffected} onChange={(e) => setCalamityForm({ ...calamityForm, expectedFamiliesAffected: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-error uppercase tracking-wide">People Died</label>
                  <input type="number" placeholder="0" value={calamityForm.humanLossDied} onChange={(e) => setCalamityForm({ ...calamityForm, humanLossDied: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-error border-error/50 bg-error-container/10 text-on-surface" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-secondary uppercase tracking-wide">People Injured</label>
                  <input type="number" placeholder="0" value={calamityForm.humanLossInjured} onChange={(e) => setCalamityForm({ ...calamityForm, humanLossInjured: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-secondary border-secondary/50 bg-secondary-container/10 text-on-surface" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">People Missing</label>
                  <input type="number" placeholder="0" value={calamityForm.humanLossMissing} onChange={(e) => setCalamityForm({ ...calamityForm, humanLossMissing: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Property Loss (₹)</label>
                  <input type="number" step="any" placeholder="0.00" value={calamityForm.propertyLossEstimate} onChange={(e) => setCalamityForm({ ...calamityForm, propertyLossEstimate: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCalamityModal(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary/95 transition-colors cursor-pointer border-none"
                >
                  Add Calamity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Resource Need Modal */}
      {showResourceNeedModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Add/Update Resource Need</h3>
              <button
                onClick={() => setShowResourceNeedModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddResourceNeed} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Associated Calamity <span className="text-error">*</span></label>
                <select required value={resourceNeedForm.incidentId} onChange={(e) => setResourceNeedForm({ ...resourceNeedForm, incidentId: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface">
                  <option value="">-- Select Calamity --</option>
                  {incidentsList.map(inc => (
                    <option key={inc.id} value={inc.id}>{inc.name} ({inc.location})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Item Name <span className="text-error">*</span></label>
                <input required type="text" placeholder="e.g. Rice, Water Bottles" value={resourceNeedForm.itemName} onChange={(e) => setResourceNeedForm({ ...resourceNeedForm, itemName: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Unit Measure</label>
                <input type="text" placeholder="e.g. kg, liters, units" value={resourceNeedForm.unit} onChange={(e) => setResourceNeedForm({ ...resourceNeedForm, unit: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-error uppercase tracking-wide">Quantity Needed</label>
                  <input type="number" step="any" placeholder="0" value={resourceNeedForm.quantityNeeded} onChange={(e) => setResourceNeedForm({ ...resourceNeedForm, quantityNeeded: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-primary uppercase tracking-wide">Quantity Received</label>
                  <input type="number" step="any" placeholder="0" value={resourceNeedForm.quantityReceived} onChange={(e) => setResourceNeedForm({ ...resourceNeedForm, quantityReceived: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Complete Transactions (Parts)</label>
                <input type="number" placeholder="0" value={resourceNeedForm.transactionsCount} onChange={(e) => setResourceNeedForm({ ...resourceNeedForm, transactionsCount: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowResourceNeedModal(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary/95 transition-colors cursor-pointer border-none"
                >
                  Save Resource Need
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Help Provider Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans border border-outline-variant/10 text-on-surface">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Add Help Provider</h3>
              <button
                onClick={() => setShowProviderModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddProvider} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Responder / Organization Name <span className="text-error">*</span></label>
                <input required type="text" placeholder="e.g. Red Cross Society" value={providerForm.name} onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Immediate Support Capability <span className="text-error">*</span></label>
                <input required type="text" placeholder="e.g. Medical Relief, Food Supply" value={providerForm.capabilityType} onChange={(e) => setProviderForm({ ...providerForm, capabilityType: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact Details <span className="text-error">*</span></label>
                <input required type="text" placeholder="e.g. +91 9876543210, email@example.com" value={providerForm.contactDetails} onChange={(e) => setProviderForm({ ...providerForm, contactDetails: e.target.value })} className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProviderModal(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary/95 transition-colors cursor-pointer border-none"
                >
                  Add Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
