"use client";

import Link from "next/link";
import { Fragment } from "react";
import usePagination from "@/lib/usePagination";
import Pagination from "@/components/ui/Pagination";
import { formatDate } from "@/lib/date";

const BADGE_COLORS = {
  Planting: "bg-blue-100 text-blue-700",
  Growing: "bg-green-100 text-green-700",
  Harvesting: "bg-amber-100 text-amber-700",
  Preparation: "bg-slate-100 text-slate-700",
  "Post-Harvest": "bg-purple-100 text-purple-700",
  Nursery: "bg-teal-100 text-teal-700",
  Transplanting: "bg-lime-100 text-lime-700",
  Tillering: "bg-cyan-100 text-cyan-700",
  Flowering: "bg-pink-100 text-pink-700",
};

function eventBadgeClass(eventType) {
  if (eventType === "Death" || eventType === "Mortality") return "bg-red-100 text-red-700";
  if (eventType === "Pregnancy") return "bg-purple-100 text-purple-700";
  if (eventType === "ChildBirth") return "bg-green-100 text-green-700";
  if (eventType === "Harvest" || eventType === "Final Harvest" || eventType === "Partial Harvest") {
    return "bg-amber-100 text-amber-700";
  }
  if (eventType === "Vaccination" || eventType === "Health Check") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-700";
}

export default function ProgramComponentPanel({
  component,
  config,
  assignments,
  expandedId,
  onToggleExpand,
  onLogEvent,
  onEdit,
  onRemove,
  onEditEvent,
  onDeleteEvent,
  onPhoto,
}) {
  const { pageItems, currentPage, setCurrentPage } = usePagination(
    assignments,
    10,
    { pageParam: `component-${component.typeKey}-page` }
  );

  const getSum = (key) =>
    assignments.reduce((sum, a) => sum + (Number(a.attributes?.[key]) || 0), 0);
  const getAvg = (key) => {
    const values = assignments
      .map((a) => Number(a.attributes?.[key]))
      .filter((v) => !Number.isNaN(v));
    return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
  };

  const columns = config?.tableColumns || [];
  const kpis = config?.kpiCards || [];
  const columnCount = 4 + columns.length;
  const kpiCols =
    kpis.length >= 4
      ? "lg:grid-cols-4"
      : kpis.length === 3
        ? "lg:grid-cols-3"
        : "lg:grid-cols-2";

  return (
    <div className="bg-surface-container-lowest rounded-lg shadow-ambient border border-outline-variant/10 overflow-hidden">
      <div className="p-6 border-b border-outline-variant/10 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">{config?.icon || "category"}</span>
            {config?.label || component.typeKey}
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            {assignments.length} enrolled
            {component.target ? ` · Target ${component.target} ${config?.programTargetUnit || "units"}` : ""}
          </p>
        </div>
        <span className="px-2.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-surface-container-high text-on-surface-variant">
          {config?.category === "FARM" ? "Farm" : "Non-Farm"}
        </span>
      </div>

      {kpis.length > 0 && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${kpiCols} gap-4 p-6 pb-0`}>
          {kpis.map((kpi) => {
            const value = kpi.aggregate === "avg" ? getAvg(kpi.key) : getSum(kpi.key);
            let display;
            if (kpi.format === "currency") display = `₹${Number(value).toLocaleString("en-IN")}`;
            else if (kpi.format === "percent") display = `${Math.round(value)}%`;
            else if (kpi.unit) display = `${Number(value).toLocaleString("en-IN")} ${kpi.unit}`;
            else display = Number(value).toLocaleString("en-IN");

            return (
              <div key={kpi.key} className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/10">
                <span className="font-label text-[10px] uppercase tracking-[0.05em] text-on-surface-variant mb-2 block font-bold">
                  {kpi.label}
                </span>
                <span className="text-xl font-bold text-on-surface">{display}</span>
              </div>
            );
          })}
        </div>
      )}

      <div
        className="max-h-[55vh] overflow-auto pr-1"
        data-list-page-param={`component-${component.typeKey}-page`}
        data-list-detail-prefix="/participants/"
      >
        <table className="mobile-card-table w-full min-w-[760px] table-fixed text-sm font-sans">
          <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant text-left font-bold">
            <tr>
              <th className="w-[5%] px-4 py-3">#</th>
              <th className="w-[22%] px-6 py-3">Participant</th>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3">{col.label}</th>
              ))}
              <th className="w-[12%] px-4 py-3">Enrolled</th>
              <th className="w-[16%] px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-6 py-12 text-center text-sm text-slate-400 italic">
                  No participants enrolled in this activity yet.
                </td>
              </tr>
            ) : (
              pageItems.map((assign, idx) => {
                const b = assign.beneficiary || {};
                const rowNumber = (currentPage - 1) * 10 + idx + 1;
                const isExpanded = expandedId === assign.id;
                return (
                  <Fragment key={assign.id}>
                    <tr
                      data-list-item-key={assign.id}
                      className={`hover:bg-surface-container-low transition-colors ${idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-surface-container-lowest"}`}
                    >
                      <td data-label="#" className="px-4 py-3 font-mono text-xs text-slate-400">{rowNumber}</td>
                      <td data-label="" className="px-6 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface shrink-0">
                            {b.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-on-surface text-sm break-words">{b.name || "—"}</p>
                            <p className="text-xs text-slate-400 break-words">
                              {b.enrolmentId || ""} {b.address ? `· ${b.address}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      {columns.map((col) => {
                        const val = assign.attributes?.[col.key];
                        let display = val ?? "—";
                        if (col.type === "currency" && val) {
                          display = `₹${Number(val).toLocaleString("en-IN")}`;
                        } else if (col.type === "number" && val != null) {
                          display = Number(val).toLocaleString("en-IN");
                          if (col.unit) display += ` ${col.unit}`;
                        } else if (col.type === "badge") {
                          return (
                            <td key={col.key} data-label={col.label} className="px-6 py-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${BADGE_COLORS[val] || "bg-slate-100 text-slate-700"}`}>
                                {val || "—"}
                              </span>
                            </td>
                          );
                        }
                        return (
                          <td key={col.key} data-label={col.label} className="px-4 py-3 text-sm break-words">
                            {display}
                          </td>
                        );
                      })}
                      <td data-label="Enrolled" className="px-4 py-3 text-xs text-slate-400">
                        {formatDate(assign.enrolledAt)}
                      </td>
                      <td data-label="Actions" className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {config?.eventTypes?.length > 0 && (
                            <button
                              onClick={() => onLogEvent(assign)}
                              className="p-1.5 rounded-full hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer border-none bg-transparent"
                              title="Log event"
                            >
                              <span className="material-symbols-outlined text-sm">add_circle</span>
                            </button>
                          )}
                          <button
                            onClick={() => onToggleExpand(assign.id)}
                            className={`p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent ${isExpanded ? "text-blue-600" : "text-slate-400"}`}
                            title="View events"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {isExpanded ? "expand_less" : "expand_more"}
                            </span>
                          </button>
                          <button
                            onClick={() => onEdit(assign)}
                            className="p-1.5 rounded-full hover:bg-amber-100 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer border-none bg-transparent"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => onRemove(assign)}
                            className="p-1.5 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer border-none bg-transparent"
                            title="Remove"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                          <Link
                            href={`/participants/${b.id}`}
                            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-on-surface transition-colors"
                            title="View profile"
                          >
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={columnCount} className="px-6 py-4 bg-surface-container-low border-b">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Events</p>
                            {(assign.events || []).length === 0 ? (
                              <p className="text-xs text-slate-400 italic">No events logged yet.</p>
                            ) : (
                              <div className="grid gap-2">
                                {(assign.events || []).map((ev) => (
                                  <div
                                    key={ev.id}
                                    className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-outline-variant/10 text-xs"
                                  >
                                    <span className={`px-2 py-0.5 rounded font-semibold ${eventBadgeClass(ev.eventType)}`}>
                                      {ev.eventType}
                                    </span>
                                    <span className="text-slate-400">{formatDate(ev.eventDate)}</span>
                                    {ev.quantity != null && <span className="font-semibold">x{ev.quantity}</span>}
                                    {ev.notes && <span className="text-slate-500 truncate max-w-xs">{ev.notes}</span>}
                                    {ev.photoUrl && (
                                      <img
                                        src={ev.photoUrl}
                                        alt="Event"
                                        className="w-8 h-8 rounded object-cover cursor-pointer"
                                        onClick={() => onPhoto(ev.photoUrl)}
                                      />
                                    )}
                                    <div className="ml-auto flex gap-1">
                                      <button
                                        onClick={() => onEditEvent(ev)}
                                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-amber-600 cursor-pointer border-none bg-transparent"
                                      >
                                        <span className="material-symbols-outlined text-xs">edit</span>
                                      </button>
                                      <button
                                        onClick={() => onDeleteEvent(ev.id)}
                                        className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 cursor-pointer border-none bg-transparent"
                                      >
                                        <span className="material-symbols-outlined text-xs">delete</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalItems={assignments.length}
        itemsPerPage={10}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
