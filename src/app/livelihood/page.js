"use client";

import Link from "next/link";

export default function LivelihoodHub() {
  return (
    <main className="flex-1 p-12 bg-surface">
      <Link
        href="/"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Back to Dashboard
        </span>
      </Link>

      <div className="mb-16 max-w-4xl">
        <h2 className="text-display-md font-headline text-on-surface mb-6">
          Livelihood Management
        </h2>
        <p className="text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
          Oversee and optimize community economic development programs across Farm (cultivation-based) and Non-Farm (livestock &amp; allied) categories. Track enrollments, yields, events, and revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">
        {/* Farm Programs */}
        <Link
          className="block group bg-surface-container-lowest rounded-lg p-8 ambient-shadow hover:-translate-y-1 transition-transform duration-300 h-full flex flex-col justify-between"
          href="/livelihood/farm"
        >
          <div>
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-6 text-emerald-700">
              <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
                agriculture
              </span>
            </div>
            <h3 className="text-xl font-headline font-semibold text-on-surface mb-3 group-hover:text-emerald-600 transition-colors">
              Farm Programs
            </h3>
            <p className="text-body-md text-on-surface-variant">
              Cultivation-based initiatives: sugarcane, maize, rice, and other crops. Track land allocation, crop stages, yields, and revenue per beneficiary.
            </p>
          </div>
          <div className="mt-8 flex items-center justify-between">
            <span className="text-label-md text-emerald-600 font-medium tracking-widest">
              Manage Farm Programs
            </span>
            <span className="material-symbols-outlined text-emerald-600 group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </Link>

        {/* Non-Farm Programs */}
        <Link
          className="block group bg-surface-container-lowest rounded-lg p-8 ambient-shadow hover:-translate-y-1 transition-transform duration-300 h-full flex flex-col justify-between"
          href="/livelihood/non-farm"
        >
          <div>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-6 text-amber-700">
              <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
                pets
              </span>
            </div>
            <h3 className="text-xl font-headline font-semibold text-on-surface mb-3 group-hover:text-amber-600 transition-colors">
              Non-Farm Programs
            </h3>
            <p className="text-body-md text-on-surface-variant">
              Livestock &amp; allied activities: goat rearing, fish farming, poultry, and more. Track asset distribution, ROI, health events, and growth metrics.
            </p>
          </div>
          <div className="mt-8 flex items-center justify-between">
            <span className="text-label-md text-amber-600 font-medium tracking-widest">
              Manage Non-Farm Programs
            </span>
            <span className="material-symbols-outlined text-amber-600 group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </Link>
      </div>

      {/* Beneficiaries Master */}
      <div className="mt-8 max-w-3xl">
        <Link
          className="block group bg-primary rounded-lg p-8 ambient-shadow hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden"
          href="/beneficiaries"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-container rounded-full opacity-50 blur-2xl"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary">
                  <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
                    group
                  </span>
                </div>
                <h3 className="text-xl font-headline font-semibold text-on-primary">
                  Beneficiaries Master
                </h3>
              </div>
              <p className="text-body-md text-on-primary/80 max-w-xl">
                Central database for all program participants. View complete profiles, program history, resilience scoring, and cross-module engagement data.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-label-md text-primary-fixed font-medium tracking-widest">
                Access Database
              </span>
              <span className="material-symbols-outlined text-primary-fixed group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
}
