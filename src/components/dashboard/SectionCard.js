"use client";

import Link from "next/link";

const TONES = {
  emerald: {
    icon: "bg-emerald-100 text-emerald-700",
    hover: "hover:border-emerald-300 hover:bg-emerald-50/60",
    arrow: "text-emerald-600",
  },
  amber: {
    icon: "bg-amber-100 text-amber-700",
    hover: "hover:border-amber-300 hover:bg-amber-50/60",
    arrow: "text-amber-600",
  },
  sky: {
    icon: "bg-sky-100 text-sky-700",
    hover: "hover:border-sky-300 hover:bg-sky-50/60",
    arrow: "text-sky-600",
  },
  violet: {
    icon: "bg-violet-100 text-violet-700",
    hover: "hover:border-violet-300 hover:bg-violet-50/60",
    arrow: "text-violet-600",
  },
};

export default function SectionCard({ section, kpis }) {
  const tone = TONES[section.tone] || TONES.emerald;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_8px_24px_rgba(25,28,29,0.04)] border border-outline-variant/10 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${tone.icon}`}>
          <span className="material-symbols-outlined text-[18px]">{section.icon}</span>
        </span>
        <h3 className="text-lg font-bold text-on-surface">{section.title}</h3>
      </div>

      <div className="flex flex-col gap-2">
        {section.links.map((link) => (
          <Link
            key={`${link.href}-${link.label}`}
            href={link.href}
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-outline-variant/20 transition-all group ${tone.hover}`}
          >
            <span className="flex items-center gap-3 text-sm font-medium text-on-surface">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                {link.icon}
              </span>
              {link.label}
            </span>
            <span className="flex items-center gap-2">
              {link.kpiKey && kpis && kpis[link.kpiKey] != null && (
                <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                  {Number(kpis[link.kpiKey]).toLocaleString("en-IN")}
                </span>
              )}
              <span
                className={`material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 transition-opacity ${tone.arrow}`}
              >
                arrow_forward
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
