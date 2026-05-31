"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function SchoolProfileDetail() {
  const { id } = useParams();
  const name = decodeURIComponent(id || "Oakridge Academy").replace(/-/g, " ");

  const [programs] = useState([
    { name: "Standard 3 Literacy Drive", status: "Active", lead: "Aisha Rahman", reach: "120 Students" },
    { name: "Parent Teacher Assembly", status: "Active", lead: "Parent Committee", reach: "85 Families" },
    { name: "Primary Math Block Kit", status: "Active", lead: "Aisha Rahman", reach: "140 Students" },
    { name: "After School Sports Linkage", status: "Completed", lead: "External Coach", reach: "45 Students" },
  ]);

  const [studentDirectory] = useState([
    { name: "Aarav Kumar", id: "STU-2023-089", grade: "Grade 8", status: "On Track" },
    { name: "Meera Patel", id: "STU-2024-012", grade: "Grade 6", status: "Satisfactory" },
    { name: "Devendra Joshi", id: "STU-2024-114", grade: "Grade 8", status: "On Track" },
  ]);

  return (
    <div className="p-6 md:p-10 pb-24 overflow-x-hidden max-w-7xl mx-auto w-full">
      {/* Back Link */}
      <Link
        href="/education/schools"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
          Back to Schools Directory
        </span>
      </Link>

      {/* Hero Header */}
      <header className="bg-surface-container-lowest rounded-xl p-8 shadow-ambient flex flex-col lg:flex-row gap-8 items-start justify-between relative overflow-hidden group mb-8 border border-surface-container-low">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-bl-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700"></div>
        <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-surface-container overflow-hidden shrink-0 border-4 border-surface shadow-md">
            <img
              alt="School avatar"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAd0x1ztc9iuj8nay2xC1_MH-xTSmAKr8IhFrASNZRkSKkt-Y4BunC5I9iqvTLQ0_8lmU0zaYnPjqddtwFcC75fjZRBUU-N_7DG60EY9HluYt_nZMGUi1MCuGMs9ZtR2iM2AGFyw2MvZhg-RlW1as3xPOOXef7qU9OwfisCQeoCv_6chJeBZbBMdmknEG_LLtMl_EWluwSEWTOAEkWm2p31lCjaolK7bQHfqtZzT6CLsbLoare9Nu918oPHFj07H0LgIShvW4giB6YL"
            />
          </div>
          <div className="pt-2">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-3xl font-headline font-black text-on-surface capitalize leading-tight">
                {name}
              </h2>
              <span className="bg-primary-fixed text-on-primary-fixed text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <p className="text-on-surface-variant font-medium mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">location_on</span>
              North District • Regional Impact Rank #4
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500 font-sans">
              <div>
                <span className="font-bold text-on-surface">Contact Person:</span> Principal Margaret (admin@oakridge.edu)
              </div>
              <span className="w-1 h-1 bg-surface-container-highest rounded-full self-center"></span>
              <div>
                <span className="font-bold text-on-surface">Phone:</span> +91 99887 76655
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 relative z-10 shrink-0 self-end lg:self-start">
          <button className="bg-surface-container text-on-surface px-5 py-2.5 rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20">
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Profile
          </button>
          <button className="bg-gradient-to-br from-primary to-primary-container text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Impact Report
          </button>
        </div>
      </header>

      {/* Bento Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Geographic Map & Programs */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Geographic coordinates */}
          <div className="bg-surface-container-lowest rounded-xl p-2 shadow-ambient border border-outline-variant/10">
            <div className="relative w-full h-[320px] rounded-lg overflow-hidden bg-surface-container-low">
              <img
                alt="Map coordinate crop"
                className="w-full h-full object-cover opacity-70"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhgWm2vbsWbyDUbD4mgsvy1AZrwUyaiSKySgBqDHHlYkuLQwP-vjNxO27FlcDq4xFb_i7bwUmlloXU3F1Ap--g8q8PUL4Mj9e9hiR3WG80ydnAUMQsc_qxkQfGSO972p9-bEXnAjs_4VE08f6AZ3NY1XyUJ4GBG1GjcSfHzAS6ZOyR4MlYzQAnkAEPLdjNmFGDt2uKxIyztLZVPJepz6xt_K_oPjuInIri-dGYQB8FF-GH1KrrO_74MMPX4I5S8WHSniXDxxpbP2ZO"
              />
              <div className="absolute top-4 left-4 glass-panel px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-white/20 shadow-sm font-sans">
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">GIS Impact Coordinates</p>
                <p className="font-semibold text-sm text-on-surface mt-0.5">Latitude: 28.61° N • Longitude: 77.20° E</p>
              </div>
            </div>
          </div>

          {/* Program Participation */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-xl text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">campaign</span>
              Active Program Participation
            </h3>
            <div className="space-y-4">
              {programs.map((prog, idx) => (
                <div key={idx} className="p-4 bg-surface-container-low rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h4 className="font-bold text-on-surface text-base">{prog.name}</h4>
                    <p className="text-xs text-on-surface-variant mt-1">Lead Fellow: {prog.lead}</p>
                  </div>
                  <div className="flex items-center gap-6 self-end md:self-auto shrink-0 font-sans">
                    <div className="text-right">
                      <p className="text-xs text-on-surface-variant font-medium">Reaches</p>
                      <p className="font-bold text-on-surface">{prog.reach}</p>
                    </div>
                    <span className="bg-primary-fixed text-on-primary-fixed text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded">
                      {prog.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Statistics & Student Link */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Institutional Metrics */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-base text-on-surface mb-6">School Metrics</h3>
            <div className="space-y-4 font-sans text-sm">
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant font-medium">Total Enrolled Students</span>
                <span className="font-bold text-on-surface">1,240 Students</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant font-medium">Class Grade Range</span>
                <span className="font-bold text-on-surface">Grade 1 to Grade 10</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant font-medium">Student-to-Teacher Ratio</span>
                <span className="font-bold text-on-surface">28 : 1</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant font-medium">Active Programs</span>
                <span className="font-bold text-primary">4 Programs</span>
              </div>
            </div>
          </div>

          {/* Assigned Students */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-base text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">groups</span>
              Enrolled Beneficiaries
            </h3>
            <div className="space-y-4">
              {studentDirectory.map((stud, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-surface-container last:border-none font-sans text-sm">
                  <div>
                    <Link href={`/education/students/${encodeURIComponent(stud.name.replace(/\s+/g, '-'))}`} className="font-semibold text-primary hover:underline">
                      {stud.name}
                    </Link>
                    <p className="text-xs text-on-surface-variant mt-0.5">ID: {stud.id} • {stud.grade}</p>
                  </div>
                  <span className="bg-primary-fixed text-on-primary-fixed text-[9px] font-bold tracking-wider px-2 py-0.5 rounded uppercase">
                    {stud.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
