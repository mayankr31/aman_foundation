"use client";
 
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { extractMapEmbedUrl } from "@/lib/mapUrl";
function InputField({ label, name, value, onChange, type = "text", required = false, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{label}</label>
      {options ? (
        <select name={name} value={value} onChange={onChange}
          className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} required={required}
          className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary" />
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 sticky top-0 bg-surface-container-lowest z-10">
          <h3 className="text-lg font-bold font-headline text-on-surface">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-container rounded-full transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AfterSchoolCentresModule() {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [centres, setCentres] = useState([]);
 
  // Form states
  const [currentPage, setCurrentPage] = useState(1);
  const initialAddForm = {
    name: "",
    coordinatorName: "",
    email: "",
    phone: "",
    address: "",
    location: "",
    status: "Active",
    mapUrl: "",
    goal: 80,
  };
  const [addForm, setAddForm] = useState(initialAddForm);

  useEffect(() => {
    async function loadCentres() {
      try {
        const res = await fetch("/api/after-school-centres", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (json.success) {
          setCentres(json.data);
        }
      } catch (err) {
        console.error("Failed to load after school centres:", err);
      }
    }
    loadCentres();
  }, [token]);
 
  const handleAddCentre = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.location) return;

    try {
      const res = await fetch("/api/after-school-centres", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...addForm,
          goal: parseInt(addForm.goal)
        })
      });
      const json = await res.json();
      if (json.success) {
        setCentres([json.data, ...centres]);
        setAddForm(initialAddForm);
        setShowAddModal(false);
      }
    } catch (err) {
      console.error("Failed to add centre:", err);
    }
  };

  const handleExport = async () => {
    if (centres.length === 0) {
      alert("No centre records to export.");
      return;
    }

    const rows = centres.map((c) => ({
      "Centre Name": c.name,
      "Coordinator Name": c.coordinatorName || "",
      "Email": c.email || "",
      "Phone": c.phone || "",
      "Location": c.location || "",
      "Address": c.address || "",
      "Status": c.status || "",
      "Enrollment Goal": c.goal ?? "",
      "Enrolled": c.enrolled ?? 0,
      "Programs": c.programs ?? 0,
      "Map URL": c.mapUrl || "",
    }));

    try {
      const imported = await import("xlsx");
      const XLSX = imported.default || imported;
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Centres");
      const date = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `after_school_centres_export_${date}.xlsx`);
    } catch (err) {
      console.error("Failed to export centres:", err);
      alert("Failed to export centres. Please try again.");
    }
  };

  const [selectedLocation, setSelectedLocation] = useState("All");

  const filteredCentres = centres.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation =
      selectedLocation === "All" ||
      c.location.toLowerCase().startsWith(selectedLocation.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(filteredCentres.length / ITEMS_PER_PAGE);
  const paginatedCentres = filteredCentres.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLocation]);

  return (
    <div className="p-6 lg:p-10 flex flex-col gap-10 max-w-[1600px] mx-auto w-full">
      {/* Editorial Header */}
      <Link
        href="/education"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Back to Education Hub
        </span>
      </Link>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-headline text-[2.75rem] leading-none tracking-[-0.02em] text-on-surface mb-3">
            After School Centres Directory
          </h2>
          <p className="font-body text-lg text-on-surface-variant max-w-2xl">
            Monitoring after school centre profiles, program participation, and geographic impact across targeted regions.
          </p>
        </div>
      </div>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low rounded-[1rem] p-6 border border-outline-variant/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-[20px]">school</span>
            <p className="font-label text-[0.65rem] uppercase tracking-[0.05em] text-on-surface-variant">Total Centres</p>
          </div>
          <p className="font-headline text-3xl text-on-surface">{centres.length}</p>
        </div>
        <div className="bg-surface-container-low rounded-[1rem] p-6 border border-outline-variant/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-[20px]">groups</span>
            <p className="font-label text-[0.65rem] uppercase tracking-[0.05em] text-on-surface-variant">Active Students</p>
          </div>
          <p className="font-headline text-3xl text-primary">
            {centres.reduce((acc, c) => acc + (c.enrolled ?? 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-surface-container-low rounded-[1rem] p-6 border border-outline-variant/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-[20px]">campaign</span>
            <p className="font-label text-[0.65rem] uppercase tracking-[0.05em] text-on-surface-variant">Total Programs</p>
          </div>
          <p className="font-headline text-3xl text-on-surface">
            {centres.reduce((acc, c) => acc + (c.programs ?? 0), 0)}
          </p>
        </div>
        <div className="bg-surface-container-low rounded-[1rem] p-6 border border-outline-variant/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
            <p className="font-label text-[0.65rem] uppercase tracking-[0.05em] text-on-surface-variant">Active Centres</p>
          </div>
          <p className="font-headline text-3xl text-on-surface">
            {centres.filter((c) => c.status === "Active").length}
          </p>
        </div>
      </div>

      {/* Toolbar: Search & Action Buttons */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10">
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
            search
          </span>
          <input
            className="w-full pl-11 pr-4 py-2.5 bg-surface-container rounded-full border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary text-sm placeholder-on-surface-variant/70 transition-shadow"
            placeholder="Search centres..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleExport}
            className="flex-1 md:flex-none px-5 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface font-label text-sm uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer border border-outline-variant/10"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span className="whitespace-nowrap">Export Data</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-none px-5 py-2.5 rounded-full bg-primary text-on-primary hover:opacity-90 transition-opacity font-label text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_8px_24px_-10px_rgba(0,104,87,0.4)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="whitespace-nowrap">Add Centre</span>
          </button>
        </div>
      </div>

      {/* Centre Profile Cards Section */}
      <div className="mt-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-surface-variant/20 pb-4">
          <div>
            <h3 className="font-headline text-2xl tracking-tight text-on-surface">Featured Profiles</h3>
            <p className="text-xs text-on-surface-variant mt-1 font-body">Showing {filteredCentres.length} partner centres</p>
          </div>
          
          {/* Premium Location Dropdown */}
          <div className="relative min-w-[220px] w-full sm:w-auto">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
              location_on
            </span>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 bg-surface-container rounded-full border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary text-xs font-label uppercase tracking-widest text-on-surface appearance-none cursor-pointer transition-shadow"
            >
              {["All Locations", ...Array.from(new Set(centres.map(c => c.location ? c.location.split(",")[0].trim() : "Unknown Location")))].map((loc) => (
                <option key={loc} value={loc === "All Locations" ? "All" : loc}>
                  {loc}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
              keyboard_arrow_down
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedCentres.map((c, index) => (
            <Link
              key={index}
              href={`/education/after-school-centres/${c.id}`}
              className="bg-surface-container-lowest p-6 rounded-[1rem] hover:shadow-[0_8px_24px_-10px_rgba(0,104,87,0.08)] transition-all duration-300 flex flex-col group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-container overflow-hidden shrink-0">
                    <img alt={c.name} className="w-full h-full object-cover" src={c.img} />
                  </div>
                  <div>
                    <h4 className="font-headline text-lg text-on-surface leading-tight group-hover:text-primary transition-colors">
                      {c.name}
                    </h4>
                    <p className="font-body text-sm text-on-surface-variant flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>{" "}
                      {c.location}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full font-label text-[0.65rem] uppercase tracking-widest ${
                    c.status === "Active"
                      ? "bg-primary-fixed text-on-primary-fixed"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {c.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-surface-variant">
                <div>
                  <p className="font-label text-[0.65rem] uppercase tracking-[0.05em] text-on-surface-variant mb-1">
                    Enrolled
                  </p>
                  <p className="font-headline text-xl text-on-surface">{c.enrolled ?? 0}</p>
                </div>
                <div>
                  <p className="font-label text-[0.65rem] uppercase tracking-[0.05em] text-on-surface-variant mb-1">
                    Programs
                  </p>
                  <p className="font-headline text-xl text-on-surface">{c.programs}</p>
                </div>
              </div>
              <div className="mt-auto">
                {(() => {
                  const enrolled = c.enrolled ?? 0;
                  const goal = c.goal || 0;
                  const progress = goal > 0 ? Math.min(100, Math.round((enrolled / goal) * 100)) : 0;
                  const color = progress >= 80 ? "bg-primary shadow-[0_0_4px_rgba(0,104,87,0.4)]" : progress >= 40 ? "bg-secondary" : "bg-error";
                  return (
                    <>
                      <div className="flex justify-between font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                        <span>Enrollment Goal</span>
                        <span className={progress >= 80 ? "text-primary" : progress >= 40 ? "text-secondary" : "text-error"}>
                          {enrolled} / {goal}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${progress}%` }}></div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </Link>
          ))}
          {filteredCentres.length === 0 && (
            <p className="text-center col-span-full py-12 text-sm text-on-surface-variant">
              No partner centres match your search query.
            </p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2 font-sans">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Prev
            </button>
            <div className="flex items-center gap-1 mx-2">
              {(() => {
                const pages = [];
                if (totalPages <= 5) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  if (currentPage <= 3) {
                    pages.push(1, 2, 3, '...', totalPages);
                  } else if (currentPage >= totalPages - 2) {
                    pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
                  } else {
                    pages.push(1, '...', currentPage, '...', totalPages);
                  }
                }
                return pages.map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    disabled={page === '...'}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                      page === currentPage
                        ? 'bg-primary text-white shadow-sm'
                        : page === '...'
                        ? 'text-on-surface-variant cursor-default'
                        : 'text-on-surface hover:bg-surface-container-high cursor-pointer'
                    }`}
                  >
                    {page}
                  </button>
                ));
              })()}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add Centre Modal */}
      {showAddModal && (
        <Modal title="Add New Partner Centre" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddCentre} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Centre Name" name="name" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} required />
              <InputField label="Coordinator Name" name="coordinatorName" value={addForm.coordinatorName} onChange={e => setAddForm(f => ({ ...f, coordinatorName: e.target.value }))} />
              <InputField label="Email" name="email" type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
              <InputField label="Phone" name="phone" value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} />
              <InputField label="Location/City" name="location" value={addForm.location} onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))} required />
              <InputField label="Status" name="status" value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))} options={["Active", "Inactive", "Under Review"]} />
              <InputField label="Enrolment Goal" name="goal" type="number" value={addForm.goal} onChange={e => setAddForm(f => ({ ...f, goal: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Address</label>
              <textarea value={addForm.address} onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))} rows="2"
                className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary resize-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Google Maps Embed URL or iframe code</label>
              <input value={addForm.mapUrl} onChange={e => setAddForm(f => ({ ...f, mapUrl: extractMapEmbedUrl(e.target.value) }))}
                placeholder='Paste the embed URL, or the full <iframe src="..."> code'
                className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface text-sm focus:outline-none focus:border-primary" />
              <p className="text-[11px] text-on-surface-variant">In Google Maps, click Share &rarr; Embed a map, copy the iframe, and paste it here. The URL is extracted automatically.</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors cursor-pointer text-sm">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer text-sm">
                Add Centre
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
