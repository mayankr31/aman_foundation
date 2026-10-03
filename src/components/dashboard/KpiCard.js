"use client";

const TONES = {
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  sky: "bg-sky-100 text-sky-700",
  violet: "bg-violet-100 text-violet-700",
};

export default function KpiCard({ label, value, icon, tone = "emerald" }) {
  const iconClass = TONES[tone] || TONES.emerald;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_8px_24px_rgba(25,28,29,0.04)] border border-outline-variant/10 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[0.7rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant leading-tight">
          {label}
        </span>
        <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${iconClass}`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </span>
      </div>
      <span className="text-4xl font-bold text-on-surface tracking-tight">
        {value == null ? "—" : Number(value).toLocaleString("en-IN")}
      </span>
    </div>
  );
}
