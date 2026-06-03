"use client";

import Link from "next/link";
import { useState } from "react";

export default function SugarcaneCultivation() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [farmers, setFarmers] = useState([
    {
      id: 1,
      initials: "AB",
      bgInitials: "bg-primary-container text-on-primary-container",
      name: "Amina Begum",
      location: "Bartari, Kalgachia",
      parcel: 4.5,
      stage: "Growing",
      stageClass: "bg-primary/10 text-primary",
      soilType: "Clay Loam",
      waterSource: "Drip Irrigation",
      estYield: 202.5, // 4.5 * 45
      estIncome: 631800, // 202.5 * 3120
    },
    {
      id: 2,
      initials: "JA",
      bgInitials: "bg-secondary-container text-on-secondary-container",
      name: "Joynal Abedin",
      location: "Digjani, Kalgachia",
      parcel: 2.1,
      stage: "Harvesting",
      stageClass: "bg-tertiary-container/20 text-tertiary",
      soilType: "Sandy Soil",
      waterSource: "Rainfed",
      estYield: 94.5, // 2.1 * 45
      estIncome: 294840, // 94.5 * 3120
    },
    {
      id: 3,
      initials: "SD",
      bgInitials: "bg-surface-variant text-on-surface-variant",
      name: "Sawpan Das",
      location: "Sawpur, Kalgachia",
      parcel: 8.0,
      stage: "Planting",
      stageClass: "bg-inverse-primary/20 text-primary-container",
      soilType: "Alluvial Soil",
      waterSource: "Canal Linkage",
      estYield: 360.0,
      estIncome: 1123200, // 360 * 3120
    },
    {
      id: 4,
      initials: "RA",
      bgInitials: "bg-primary-container text-on-primary-container",
      name: "Rahmat Ali",
      location: "Balikuri, Kalgachia",
      parcel: 5.2,
      stage: "Growing",
      stageClass: "bg-primary/10 text-primary",
      soilType: "Clay Loam",
      waterSource: "Drip Irrigation",
      estYield: 234.0, // 5.2 * 45
      estIncome: 730080, // 234 * 3120
    },
    {
      id: 5,
      initials: "BD",
      bgInitials: "bg-secondary-container text-on-secondary-container",
      name: "Bhanu Das",
      location: "Gunialguri, Kalgachia",
      parcel: 3.8,
      stage: "Planting",
      stageClass: "bg-inverse-primary/20 text-primary-container",
      soilType: "Alluvial Soil",
      waterSource: "Canal Linkage",
      estYield: 171.0, // 3.8 * 45
      estIncome: 533520, // 171 * 3120
    },
    {
      id: 6,
      initials: "AB",
      bgInitials: "bg-surface-variant text-on-surface-variant",
      name: "Abdul Baten",
      location: "Moinbari, Kalgachia",
      parcel: 2.5,
      stage: "Harvesting",
      stageClass: "bg-tertiary-container/20 text-tertiary",
      soilType: "Sandy Soil",
      waterSource: "Rainfed",
      estYield: 112.5, // 2.5 * 45
      estIncome: 351000, // 112.5 * 3120
    },
  ]);

  const [selectedFarmer, setSelectedFarmer] = useState(null);

  // Initialize selected farmer once farmers state is loaded
  if (selectedFarmer === null && farmers.length > 0) {
    setSelectedFarmer(farmers[0]);
  }

  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedStage, setSelectedStage] = useState("All");

  const locations = ["All", ...new Set(farmers.map((f) => f.location.split(",")[0].trim()))];
  const stages = ["All", "Planting", "Growing", "Harvesting"];

  // Form states
  const [newFarmerName, setNewFarmerName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newParcel, setNewParcel] = useState("");
  const [newStage, setNewStage] = useState("Planting");
  const [newSoil, setNewSoil] = useState("Clay Loam");
  const [newWater, setNewWater] = useState("Rainfed");

  const handleEnrollFarmer = (e) => {
    e.preventDefault();
    if (!newFarmerName || !newLocation || !newParcel) return;

    const initials = newFarmerName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

    const hectares = parseFloat(newParcel);
    const tons = hectares * 45;
    const income = tons * 3120; // Rupee standard rate multiplier

    const newFarmer = {
      id: farmers.length + 1,
      initials,
      bgInitials: "bg-primary-container text-on-primary-container",
      name: newFarmerName,
      location: newLocation,
      parcel: hectares,
      stage: newStage,
      stageClass:
        newStage === "Growing"
          ? "bg-primary/10 text-primary"
          : newStage === "Harvesting"
          ? "bg-tertiary-container/20 text-tertiary"
          : "bg-inverse-primary/20 text-primary-container",
      soilType: newSoil,
      waterSource: newWater,
      estYield: tons,
      estIncome: income,
    };

    setFarmers([newFarmer, ...farmers]);
    setSelectedFarmer(newFarmer);
    
    // reset form
    setNewFarmerName("");
    setNewLocation("");
    setNewParcel("");
    setNewStage("Planting");
    setNewSoil("Clay Loam");
    setNewWater("Rainfed");
    setShowEnrollModal(false);
  };

  const filteredFarmers = farmers.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === "All" || f.location.includes(selectedLocation);
    const matchesStage = selectedStage === "All" || f.stage === selectedStage;
    return matchesSearch && matchesLocation && matchesStage;
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
      {/* Header Section */}
      <div>
        <Link
          href="/livelihood"
          className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
        >
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal">
            arrow_back
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
            Back to Livelihood Hub
          </span>
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="text-primary text-xs uppercase tracking-[0.05em] font-bold mb-2 block font-sans">
              Livelihood Module
            </span>
            <h2 className="text-4xl md:text-5xl font-headline tracking-[-0.02em] font-semibold text-on-surface">
              Sugarcane Cultivation
            </h2>
            <p className="text-on-surface-variant mt-2 max-w-2xl text-body font-body leading-relaxed text-sm">
              Tracking farmer enrolment, seasonal growth cycles, and yield forecasts for the current harvest year.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button className="bg-surface-container-highest text-on-surface px-6 py-3 rounded-full text-sm font-medium hover:bg-surface-variant transition-colors flex items-center gap-2 font-sans">
              <span className="material-symbols-outlined text-sm">download</span>
              Export Report
            </button>
            <button
              onClick={() => setShowEnrollModal(true)}
              className="bg-primary text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-primary-container transition-all flex items-center gap-2 shadow-lg shadow-primary/30 active:scale-95 font-sans cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              Enroll Farmer
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
        {/* KPI Cards */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-lg p-6 impact-glow pt-8 pl-8">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant text-[0.75rem] uppercase tracking-[0.05em] font-semibold">
              Active Farmers
            </span>
            <div className="bg-primary-fixed text-on-primary-fixed px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> +12%
            </div>
          </div>
          <div className="text-4xl font-headline tracking-[-0.02em] text-on-surface mb-1">
            {farmers.length + 1245}
          </div>
          <p className="text-sm text-on-surface-variant">Enrolled this season</p>
        </div>

        <div className="md:col-span-4 bg-surface-container-lowest rounded-lg p-6 impact-glow pt-8 pl-8">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant text-[0.75rem] uppercase tracking-[0.05em] font-semibold">
              Total Land Parcel
            </span>
            <span className="material-symbols-outlined text-tertiary">landscape</span>
          </div>
          <div className="text-4xl font-headline tracking-[-0.02em] text-on-surface mb-1">
            {farmers.reduce((acc, f) => acc + f.parcel, 0).toFixed(1)} <span className="text-xl text-on-surface-variant">Hectares</span>
          </div>
          <p className="text-sm text-on-surface-variant">Across Kalgachia circle</p>
        </div>

        <div className="md:col-span-4 bg-surface-container-lowest rounded-lg p-6 impact-glow pt-8 pl-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-bl-full"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-on-surface-variant text-[0.75rem] uppercase tracking-[0.05em] font-semibold">
              Est. Yield Forecast
            </span>
            <span className="material-symbols-outlined text-secondary">monitoring</span>
          </div>
          <div className="text-4xl font-headline tracking-[-0.02em] text-on-surface mb-1 relative z-10">
            {farmers.reduce((acc, f) => acc + f.estYield, 0).toFixed(0)} <span className="text-xl text-on-surface-variant">Tons</span>
          </div>
          <p className="text-sm text-on-surface-variant relative z-10">Expected Q4 Harvest</p>
        </div>

        {/* Main Content Left (Map/Parcels) */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-lg impact-glow overflow-hidden flex flex-col h-full">
          <div className="p-6 pb-4 pt-8 pl-8 border-b border-surface-container-highest flex justify-between items-center">
            <h3 className="text-lg font-semibold text-on-surface">Land Parcel Distribution</h3>
            <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1 font-sans">
              View Full Map <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <div className="relative flex-1 min-h-[300px] bg-surface-container text-on-surface">
            <img
              alt="Map view of sugarcane plots near Kalgachia, Assam"
              className="w-full h-full object-cover opacity-80"
              src="/sugarcane_map_kalgachia.png"
            />
            {/* Floating Map Legend */}
            <div className="absolute bottom-6 right-6 glass-panel p-4 rounded-lg impact-glow w-48 bg-white/80">
              <h4 className="text-xs uppercase tracking-[0.05em] font-semibold text-on-surface mb-3 font-sans">
                Crop Status
              </h4>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-sm text-on-surface-variant">Maturing (60%)</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-inverse-primary"></div>
                <span className="text-sm text-on-surface-variant">Early Growth (25%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                <span className="text-sm text-on-surface-variant">Harvesting (15%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side (Seasonal Timeline) */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-lg p-6 impact-glow pt-8 pl-8 flex flex-col">
          <h3 className="text-lg font-semibold text-on-surface mb-6">Seasonal Activity Log</h3>
          <div className="relative border-l-2 border-surface-container-highest ml-3 space-y-8 pb-4 flex-1">
            {/* Timeline Item 1 */}
            <div className="relative pl-6">
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-surface-container-lowest shadow-sm"></div>
              <div className="text-[0.75rem] uppercase tracking-[0.05em] text-primary font-bold mb-1 font-sans">
                Current Phase
              </div>
              <h4 className="text-md font-semibold text-on-surface">Growth Monitoring</h4>
              <p className="text-sm text-on-surface-variant mt-1 mb-2">
                Weeks 12-24. Assessing water stress and fertilizer application.
              </p>
              <div className="flex items-center gap-2">
                <span className="bg-surface-container px-2 py-1 rounded text-xs text-on-surface-variant font-medium">
                  85% Complete
                </span>
                <div className="h-1.5 flex-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full relative"
                    style={{ width: "85%" }}
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/30 blur-[1px]"></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Timeline Item 2 */}
            <div className="relative pl-6">
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-surface-container-highest border-4 border-surface-container-lowest"></div>
              <div className="text-[0.75rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold mb-1 font-sans">
                Upcoming
              </div>
              <h4 className="text-md font-semibold text-on-surface">Pre-Harvest Inspection</h4>
              <p className="text-sm text-on-surface-variant mt-1">
                Scheduled for Month 8. Quality assessment and logistics planning.
              </p>
            </div>
            {/* Timeline Item 3 */}
            <div className="relative pl-6 opacity-60">
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-tertiary-container border-4 border-surface-container-lowest"></div>
              <div className="text-[0.75rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold mb-1 font-sans">
                Completed
              </div>
              <h4 className="text-md font-semibold text-on-surface">Planting Phase</h4>
              <p className="text-sm text-on-surface-variant mt-1">
                Seedling distribution and initial land preparation finished.
              </p>
            </div>
          </div>
        </div>

        {/* Farmer Enrolment Details (Interactive Calculator & details panel) */}
        {selectedFarmer && (
          <div className="md:col-span-12 bg-surface-container-lowest rounded-lg p-6 shadow-ambient pt-8 pl-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg">
                  {selectedFarmer.initials}
                </div>
                <div>
                  <h3 className="text-xl font-headline font-semibold text-on-surface">Enrollment File: {selectedFarmer.name}</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">{selectedFarmer.location}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-sm mb-6">
                <div className="border-b border-surface-container pb-3">
                  <span className="text-on-surface-variant block mb-1 font-medium">Soil Profile type</span>
                  <span className="font-semibold text-on-surface">{selectedFarmer.soilType}</span>
                </div>
                <div className="border-b border-surface-container pb-3">
                  <span className="text-on-surface-variant block mb-1 font-medium">Watering Irrigation Resource</span>
                  <span className="font-semibold text-on-surface">{selectedFarmer.waterSource}</span>
                </div>
                <div className="border-b border-surface-container pb-3">
                  <span className="text-on-surface-variant block mb-1 font-medium">Active Parcel Area Size</span>
                  <span className="font-semibold text-on-surface">{selectedFarmer.parcel} Hectares</span>
                </div>
                <div className="border-b border-surface-container pb-3">
                  <span className="text-on-surface-variant block mb-1 font-medium">Current Crop growth Stage</span>
                  <span className="font-semibold text-primary">{selectedFarmer.stage}</span>
                </div>
              </div>
            </div>

            {/* Income & Yield Performance Calculator */}
            <div className="bg-surface-container p-6 rounded-lg font-sans">
              <h4 className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-4">Yield &amp; Income Performance Calculator</h4>
              <div className="space-y-4 text-sm text-on-surface">
                <div className="flex justify-between py-2 border-b border-surface-container-high">
                  <span>Hectares Cultivated</span>
                  <span className="font-semibold">{selectedFarmer.parcel} Hectares</span>
                </div>
                <div className="flex justify-between py-2 border-b border-surface-container-high">
                  <span>Benchmark Yield Ratio</span>
                  <span className="font-semibold">45 Tons / Hectare</span>
                </div>
                <div className="flex justify-between py-2 border-b border-surface-container-high">
                  <span>Estimated Total Yield</span>
                  <span className="font-bold text-primary">{selectedFarmer.estYield.toFixed(1)} Tons</span>
                </div>
                <div className="flex justify-between py-2 border-b border-surface-container-high">
                  <span>Sugarcane Standard Market Rate</span>
                  <span className="font-semibold">₹3,120 / Ton</span>
                </div>
                <div className="flex justify-between py-2 mt-4 pt-2">
                  <span className="font-bold">Projected Net Income</span>
                  <span className="font-headline text-xl font-black text-primary">₹{selectedFarmer.estIncome.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Enrolments Table */}
        <div className="md:col-span-12 bg-surface-container-lowest rounded-lg impact-glow overflow-hidden">
          <div className="p-6 pb-4 pt-8 pl-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-surface-container-lowest border-b border-surface-container-highest">
            <div>
              <h3 className="text-lg font-semibold text-on-surface">Recent Farmer Enrolments</h3>
              <p className="text-sm text-on-surface-variant mt-1">
                Latest registered beneficiaries and parcel data. Click on any row to view full file and calculator.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search farmers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-1.5 rounded-full border border-outline-variant text-xs focus:outline-none focus:border-primary w-full md:w-48 font-sans bg-transparent text-on-surface"
              />
              
              {/* Location Filter */}
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full sm:w-auto pl-3 pr-8 py-1.5 bg-surface-container text-on-surface rounded-full border-none focus:ring-1 focus:ring-primary text-xs cursor-pointer appearance-none font-sans font-medium"
                >
                  <option value="All" className="bg-surface-container text-on-surface">All Villages</option>
                  {locations.filter(loc => loc !== "All").map((loc) => (
                    <option key={loc} value={loc} className="bg-surface-container text-on-surface">
                      {loc}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[16px]">
                  expand_more
                </span>
              </div>

              {/* Stage Filter */}
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full sm:w-auto pl-3 pr-8 py-1.5 bg-surface-container text-on-surface rounded-full border-none focus:ring-1 focus:ring-primary text-xs cursor-pointer appearance-none font-sans font-medium"
                >
                  <option value="All" className="bg-surface-container text-on-surface">All Stages</option>
                  {stages.filter(st => st !== "All").map((st) => (
                    <option key={st} value={st} className="bg-surface-container text-on-surface">
                      {st}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[16px]">
                  expand_more
                </span>
              </div>
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-surface-container-highest">
                  <th className="px-8 py-3 text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant font-sans">
                    Farmer Name
                  </th>
                  <th className="px-6 py-3 text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant font-sans">
                    Location
                  </th>
                  <th className="px-6 py-3 text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant font-sans">
                    Parcel Size
                  </th>
                  <th className="px-6 py-3 text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant font-sans">
                    Crop Stage
                  </th>
                  <th className="px-8 py-3 text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant font-sans text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFarmers.map((f, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelectedFarmer(f)}
                    className={`border-b border-surface-container-highest hover:bg-surface-container-low transition-colors cursor-pointer ${
                      selectedFarmer?.id === f.id ? "bg-surface-container-low" : ""
                    }`}
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${f.bgInitials}`}
                        >
                          {f.initials}
                        </div>
                        <span className="font-medium text-on-surface">{f.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{f.location}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{f.parcel} Hectares</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${f.stageClass}`}>
                        {f.stage}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <button className="text-primary hover:text-primary-container transition-colors cursor-pointer font-sans text-xs font-bold">
                        Select File
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredFarmers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-xs text-slate-400 font-sans">
                      No registered farmers match your search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Enrollment Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Enroll New Sugarcane Farmer</h3>
              <button
                onClick={() => setShowEnrollModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEnrollFarmer} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Farmer Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Mwangi"
                  value={newFarmerName}
                  onChange={(e) => setNewFarmerName(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Location / Region
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sawpur, Kalgachia"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Parcel Size (Hectares)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 3.5"
                  value={newParcel}
                  onChange={(e) => setNewParcel(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Soil Profile Type
                </label>
                <select
                  value={newSoil}
                  onChange={(e) => setNewSoil(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface"
                >
                  <option value="Clay Loam">Clay Loam</option>
                  <option value="Sandy Soil">Sandy Soil</option>
                  <option value="Alluvial Soil">Alluvial Soil</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Watering Resource Linkage
                </label>
                <select
                  value={newWater}
                  onChange={(e) => setNewWater(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface"
                >
                  <option value="Rainfed">Rainfed</option>
                  <option value="Drip Irrigation">Drip Irrigation</option>
                  <option value="Canal Linkage">Canal Linkage</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Crop Stage
                </label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface"
                >
                  <option value="Planting">Planting</option>
                  <option value="Growing">Growing</option>
                  <option value="Harvesting">Harvesting</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                >
                  Enroll Farmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
