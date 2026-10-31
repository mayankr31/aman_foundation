"use client";

import Link from "next/link";
import HubKpiStrip from "@/components/dashboard/HubKpiStrip";

const TONES = {
  emerald: {
    glow: "bg-emerald-500/5",
    icon: "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200/70",
    title: "group-hover:text-emerald-600",
    action: "text-emerald-600",
  },
  amber: {
    glow: "bg-amber-500/5",
    icon: "bg-amber-100 text-amber-700 group-hover:bg-amber-200/70",
    title: "group-hover:text-amber-600",
    action: "text-amber-600",
  },
  primary: {
    glow: "bg-primary/5",
    icon: "bg-primary/10 text-primary group-hover:bg-primary/20",
    title: "group-hover:text-primary",
    action: "text-primary",
  },
};

function HubCard({ href, icon, title, description, actionLabel, tone = "primary" }) {
  const colors = TONES[tone] || TONES.primary;

  return (
    <Link
      href={href}
      className="group relative bg-surface-container-lowest rounded-xl p-8 shadow-glow hover:shadow-lg transition-all duration-300 border border-outline-variant/15 flex flex-col h-full overflow-hidden"
    >
      <div className={`absolute right-0 top-0 w-32 h-32 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 ${colors.glow}`} />
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 z-10 transition-colors ${colors.icon}`}>
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <h3 className={`text-xl font-semibold text-on-surface mb-3 z-10 transition-colors ${colors.title}`}>
        {title}
      </h3>
      <p className="text-on-surface-variant body-md leading-relaxed mb-6 flex-1 z-10">
        {description}
      </p>
      <div className={`flex items-center gap-2 font-medium text-sm mt-auto z-10 font-sans ${colors.action}`}>
        <span>{actionLabel}</span>
        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
          arrow_forward
        </span>
      </div>
    </Link>
  );
}

export default function LivelihoodHub() {
  return (
    <div className="flex-1 p-4 sm:p-6 md:p-10 pb-24">
      <Link
        href="/"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-4 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
          Back to Dashboard
        </span>
      </Link>

      <div className="mb-12 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-fixed/20 text-on-primary-fixed rounded-full text-xs font-semibold uppercase tracking-wider mb-4 font-sans">
          <span className="material-symbols-outlined text-[16px]">agriculture</span>
          Livelihood Hub
        </div>
        <h1 className="page-title text-on-surface mb-4">
          Livelihood Management
        </h1>
        <p className="text-lg text-on-surface-variant leading-relaxed max-w-2xl">
          Oversee and optimize community economic development programs across Farm (cultivation-based)
          and Non-Farm (livestock &amp; allied) categories, with a central registry for all program
          participants.
        </p>
      </div>

      {/* Livelihood KPIs (configurable from Dashboard Config) */}
      <HubKpiStrip group="livelihood" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl">
        <HubCard
          href="/livelihood/farm"
          icon="agriculture"
          title="Farm Programs"
          description="Cultivation-based initiatives: sugarcane, maize, rice, and other crops. Track land allocation, crop stages, yields, and revenue per beneficiary."
          actionLabel="Manage Farm Programs"
          tone="emerald"
        />

        <HubCard
          href="/livelihood/non-farm"
          icon="pets"
          title="Non-Farm Programs"
          description="Livestock and allied activities: goat rearing, fish farming, poultry, and more. Track asset distribution, ROI, health events, and growth metrics."
          actionLabel="Manage Non-Farm Programs"
          tone="amber"
        />

        <HubCard
          href="/beneficiaries"
          icon="diversity_3"
          title="Beneficiary Master"
          description="Central database for all program participants. View complete profiles, program history, resilience scoring, and cross-module engagement data."
          actionLabel="Open Registry"
          tone="primary"
        />
      </div>
    </div>
  );
}
