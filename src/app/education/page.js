"use client";

import Link from "next/link";
import { useAuth } from "@/lib/useAuth";

export default function EducationHub() {
  const { user } = useAuth();

  return (
    <div className="flex-1 p-8 lg:p-12">
      {/* Back link */}
      <Link
        href="/"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
          Back to Dashboard
        </span>
      </Link>

      {/* Hero Header */}
      <div className="mb-12 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-fixed/20 text-on-primary-fixed rounded-full text-xs font-semibold uppercase tracking-wider mb-4 font-sans">
          <span className="material-symbols-outlined text-[16px]">hub</span>
          Central Hub
        </div>
        <h1 className="text-[2.75rem] leading-tight font-bold text-on-surface mb-4 tracking-[-0.02em] font-headline">
          Education Management
        </h1>
        <p className="text-lg text-on-surface-variant leading-relaxed max-w-2xl">
          Oversee, evaluate, and scale our educational initiatives. This central module provides a unified view of our impact across fellows, students, institutional partnerships, and community programs.
        </p>
      </div>

      {/* Bento Grid Layout for Sub-modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl">
        {/* Fellows Module / My Profile Card */}
        {user?.roleName === "FELLOW" ? (
          <Link
            className="group relative bg-surface-container-lowest rounded-xl p-8 shadow-glow hover:shadow-lg transition-all duration-300 border border-outline-variant/15 flex flex-col h-full overflow-hidden"
            href="/profile"
          >
            <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-6 z-10 group-hover:bg-primary/10 transition-colors">
              <span className="material-symbols-outlined text-3xl text-primary">account_circle</span>
            </div>
            <h3 className="text-xl font-semibold text-on-surface mb-3 z-10 group-hover:text-primary transition-colors">
              My Profile
            </h3>
            <p className="text-on-surface-variant body-md leading-relaxed mb-6 flex-1 z-10">
              View your school assignment, cohort metrics, classroom performance evaluations, and manage your teaching goals.
            </p>
            <div className="flex items-center gap-2 text-primary font-medium text-sm mt-auto z-10 font-sans">
              <span>View Profile</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
          </Link>
        ) : (
          <Link
            className="group relative bg-surface-container-lowest rounded-xl p-8 shadow-glow hover:shadow-lg transition-all duration-300 border border-outline-variant/15 flex flex-col h-full overflow-hidden"
            href="/education/fellows"
          >
            <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-6 z-10 group-hover:bg-primary/10 transition-colors">
              <span className="material-symbols-outlined text-3xl text-primary">groups</span>
            </div>
            <h3 className="text-xl font-semibold text-on-surface mb-3 z-10 group-hover:text-primary transition-colors">
              Fellows Module
            </h3>
            <p className="text-on-surface-variant body-md leading-relaxed mb-6 flex-1 z-10">
              Manage cohort data, track professional development, and monitor the placement and performance of our educational fellows across all operating regions.
            </p>
            <div className="flex items-center gap-2 text-primary font-medium text-sm mt-auto z-10 font-sans">
              <span>Access Module</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
          </Link>
        )}

        {/* Students Module Card */}
        <Link
          className="group relative bg-surface-container-lowest rounded-xl p-8 shadow-glow hover:shadow-lg transition-all duration-300 border border-outline-variant/15 flex flex-col h-full overflow-hidden"
          href="/education/students"
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-secondary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-6 z-10 group-hover:bg-secondary/10 transition-colors">
            <span className="material-symbols-outlined text-3xl text-secondary">face_3</span>
          </div>
          <h3 className="text-xl font-semibold text-on-surface mb-3 z-10 group-hover:text-secondary transition-colors">
            Students Module
          </h3>
          <p className="text-on-surface-variant body-md leading-relaxed mb-6 flex-1 z-10">
            Analyze student learning outcomes, track attendance metrics, and evaluate the long-term impact of our interventions on individual student trajectories.
          </p>
          <div className="flex items-center gap-2 text-secondary font-medium text-sm mt-auto z-10 font-sans">
            <span>Access Module</span>
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </Link>

        {/* Schools Module Card */}
        <Link
          className="group relative bg-surface-container-lowest rounded-xl p-8 shadow-glow hover:shadow-lg transition-all duration-300 border border-outline-variant/15 flex flex-col h-full overflow-hidden"
          href="/education/schools"
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-6 z-10 group-hover:bg-primary/10 transition-colors">
            <span className="material-symbols-outlined text-3xl text-primary">domain</span>
          </div>
          <h3 className="text-xl font-semibold text-on-surface mb-3 z-10 group-hover:text-primary transition-colors">
            Schools Module
          </h3>
          <p className="text-on-surface-variant body-md leading-relaxed mb-6 flex-1 z-10">
            Maintain institutional profiles, assess infrastructure improvements, and manage relationships with partner schools and local educational authorities.
          </p>
          <div className="flex items-center gap-2 text-primary font-medium text-sm mt-auto z-10 font-sans">
            <span>Access Module</span>
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </Link>

        {/* PTA & Programs Card */}
        <Link
          className="group relative bg-surface-container-lowest rounded-xl p-8 shadow-glow hover:shadow-lg transition-all duration-300 border border-outline-variant/15 flex flex-col h-full overflow-hidden"
          href="/education/pta"
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-tertiary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-6 z-10 group-hover:bg-tertiary/10 transition-colors">
            <span className="material-symbols-outlined text-3xl text-tertiary">diversity_3</span>
          </div>
          <h3 className="text-xl font-semibold text-on-surface mb-3 z-10 group-hover:text-tertiary transition-colors">
            PTA &amp; Programs
          </h3>
          <p className="text-on-surface-variant body-md leading-relaxed mb-6 flex-1 z-10">
            Coordinate parent-teacher association initiatives, track community engagement metrics, and oversee extracurricular educational programs.
          </p>
          <div className="flex items-center gap-2 text-tertiary font-medium text-sm mt-auto z-10 font-sans">
            <span>Access Module</span>
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
