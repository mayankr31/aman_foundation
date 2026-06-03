"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function BeneficiaryProfileDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Program History");
  const [beneficiary, setBeneficiary] = useState(null);
  
  const slug = decodeURIComponent(id || "").toLowerCase();

  useEffect(() => {
    let list = [];
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("aman_beneficiaries");
      if (stored) {
        try {
          list = JSON.parse(stored);
        } catch (e) {}
      }
    }
    
    // Default fallback if localStorage is empty or not initialized
    if (!list || list.length === 0) {
      list = [
        {
          id: "BEN-482-A",
          name: "Amina Patel",
          location: "Bartari, Kalgachia, Assam",
          householdSize: 5,
          income: "Agriculture",
          tier: "Tier 2",
          tierPercent: 65,
          programs: ["Goat Rearing", "Sugarcane"],
          resilienceScore: 82,
        },
        {
          id: "BEN-104-B",
          name: "Rajesh Gond",
          location: "Digjani, Kalgachia, Assam",
          householdSize: 4,
          income: "Livestock",
          tier: "Tier 1",
          tierPercent: 40,
          programs: ["Goat Rearing"],
          resilienceScore: 58,
        },
        {
          id: "BEN-902-C",
          name: "Savitri Bai",
          location: "Sawpur, Kalgachia, Assam",
          householdSize: 6,
          income: "Agriculture",
          tier: "Tier 3",
          tierPercent: 90,
          programs: ["Sugarcane"],
          resilienceScore: 92,
        },
        {
          id: "BEN-304-D",
          name: "Rahim Ali",
          location: "Balikuri, Kalgachia, Assam",
          householdSize: 5,
          income: "Agriculture",
          tier: "Tier 2",
          tierPercent: 70,
          programs: ["Sugarcane", "Goat Rearing"],
          resilienceScore: 78,
        },
        {
          id: "BEN-705-E",
          name: "Jahanara Begum",
          location: "Moinbari, Kalgachia, Assam",
          householdSize: 7,
          income: "Livestock",
          tier: "Tier 1",
          tierPercent: 35,
          programs: ["Goat Rearing"],
          resilienceScore: 52,
        }
      ];
    }
    
    // Find matching beneficiary
    const found = list.find(b => {
      const bSlug = b.name.replace(/\s+/g, '-').toLowerCase();
      return bSlug === slug || b.id.toLowerCase() === slug;
    }) || list.find(b => b.name.toLowerCase().includes(slug)) || list[0];
    
    setBeneficiary(found);
  }, [id, slug]);

  if (!beneficiary) {
    return (
      <div className="p-8 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Circle SVG Dash Offset
  const score = beneficiary.resilienceScore || 50;
  const strokeDashoffset = 251.2 - (score / 100) * 251.2;

  // Custom stats based on data
  const incomeIncrease = `+ ${Math.round(score * 0.4 + 10)}%`;
  const waterSaved = beneficiary.programs.includes("Sugarcane") 
    ? `${Math.round(score * 120 + 2000)} Liters` 
    : "N/A (Goat Rearing Only)";

  return (
    <div className="p-4 md:p-8 lg:p-12 pb-24 md:pb-12 max-w-7xl mx-auto w-full">
      {/* Back link */}
      <Link
        href="/beneficiaries"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
          Back to Beneficiaries Directory
        </span>
      </Link>

      {/* Header */}
      <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-label-md text-on-surface-variant mb-2 font-sans font-bold uppercase tracking-widest text-[10px]">
            Livelihood Management
          </p>
          <h1 className="text-3xl md:text-[2.75rem] font-bold text-on-surface tracking-tight leading-tight font-headline">
            Beneficiary Profile File
          </h1>
        </div>
        <div className="flex gap-3 font-sans">
          <button className="bg-surface-container text-on-surface px-4 py-2 rounded-full text-body-md font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20">
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Profile
          </button>
          <button className="gradient-primary bg-primary text-on-primary px-5 py-2 rounded-full text-body-md font-medium shadow-glow hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Data
          </button>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Profile Section */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient flex flex-col md:flex-row gap-8 items-start relative overflow-hidden group border border-outline-variant/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/5 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-110 duration-700"></div>
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shrink-0 border-4 border-surface shadow-md relative z-10">
            <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center font-bold text-4xl">
              {beneficiary.name.split(" ").map((n) => n[0]).join("")}
            </div>
          </div>
          <div className="flex-1 relative z-10 pt-2">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1">
              <h2 className="text-3xl font-bold text-on-surface tracking-tight capitalize font-headline">{beneficiary.name}</h2>
              <span className="bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full whitespace-nowrap w-fit">
                Active Participant
              </span>
            </div>
            <p className="text-on-surface-variant text-sm mb-6 max-w-md font-sans">
              Participating in advanced agricultural and livestock management programs near Kalgachia, Assam since 2022.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4 font-sans text-sm">
              <div>
                <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Location</p>
                <p className="text-on-surface font-bold">{beneficiary.location}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Household Size</p>
                <p className="text-on-surface font-bold">{beneficiary.householdSize} Members</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Primary Income</p>
                <p className="text-on-surface font-bold">{beneficiary.income}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Enrollment ID</p>
                <p className="text-on-surface font-mono font-bold text-xs">{beneficiary.id}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Socio-Economic Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden max-w-[150px]">
                    <div className="bg-primary h-full rounded-full relative" style={{ width: `${beneficiary.tierPercent}%` }}>
                      <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 blur-[2px] rounded-full"></div>
                    </div>
                  </div>
                  <span className="font-bold text-on-surface text-xs">{beneficiary.tier}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resilience Score Dial */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-6 shadow-ambient flex flex-col items-center justify-center relative overflow-hidden border border-outline-variant/10">
          <div className="absolute inset-0 bg-gradient-to-br from-surface-container-lowest to-surface-container-low opacity-50"></div>
          <h3 className="text-xs uppercase tracking-widest text-on-surface-variant text-center w-full relative z-10 mb-6 font-sans font-bold">
            Resilience Score
          </h3>
          <div className="relative w-48 h-48 flex items-center justify-center z-10">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="var(--color-surface-container-highest)"
                strokeDasharray="251.2"
                strokeDashoffset="0"
                strokeWidth="8"
              ></circle>
              <circle
                className="drop-shadow-[0_2px_4px_rgba(0,104,87,0.3)]"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="var(--color-primary)"
                strokeDasharray="251.2"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                strokeWidth="8"
              ></circle>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-on-surface tracking-tighter">{score}</span>
              <span className="text-xs text-on-surface-variant font-medium uppercase tracking-widest mt-1">
                / 100
              </span>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-primary bg-primary-container/10 px-3 py-1.5 rounded-full relative z-10 font-sans">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="text-xs font-bold uppercase tracking-wider">+14pts this year</span>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="lg:col-span-12 mt-4 mb-2 border-b border-surface-container-highest flex overflow-x-auto no-scrollbar font-sans">
          {["Program History", "ID Proofs & Docs", "Impact Summary"].map((tab) => {
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

        {/* Dynamic Tab Contents */}
        <div className="lg:col-span-7">
          {activeTab === "Program History" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 font-sans">
              <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                Participation Timeline
              </h3>
              <div className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-highest">
                
                {beneficiary.programs.includes("Goat Rearing") && (
                  <div className="relative">
                    <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-surface-container-lowest z-10 shadow-glow"></div>
                    <div className="bg-surface p-5 rounded-lg border border-surface-container-high">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-on-surface">Goat Rearing Expansion</h4>
                        <span className="text-xs font-bold text-primary bg-primary-container/10 px-2 py-1 rounded">
                          2023 - Present
                        </span>
                      </div>
                      <p className="text-body-md text-on-surface-variant mb-4">
                        Received high-yield breed goats and completed advanced veterinary care and vaccination training in Kalgachia circle.
                      </p>
                      <div className="flex gap-2">
                        <span className="text-[10px] uppercase tracking-widest bg-surface-container px-2 py-1 rounded-full text-on-surface-variant font-bold">
                          Livestock
                        </span>
                        <span className="text-[10px] uppercase tracking-widest bg-surface-container px-2 py-1 rounded-full text-on-surface-variant font-bold">
                          Training Completed
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {beneficiary.programs.includes("Sugarcane") && (
                  <div className="relative">
                    <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-surface-container-high border-2 border-primary ring-4 ring-surface-container-lowest z-10"></div>
                    <div className="bg-surface p-5 rounded-lg border border-surface-container-high">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-on-surface">Sugarcane Yield Optimization</h4>
                        <span className="text-xs font-bold text-on-surface-variant px-2 py-1">
                          2022 - 2023
                        </span>
                      </div>
                      <p className="text-body-md text-on-surface-variant">
                        Implemented mini-sprinklers and modern organic soil nourishment systems for a sugarcane plot near Kalgachia circle, yielding +30% water efficiency.
                      </p>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          )}

          {activeTab === "ID Proofs & Docs" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 space-y-6">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">description</span>
                Verified Identity Proofs &amp; Documents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-surface-container-highest rounded-lg flex items-center justify-between font-sans">
                  <div>
                    <p className="font-bold text-sm text-on-surface">Aadhar National Identity</p>
                    <p className="text-xs text-slate-400 font-mono">**** **** {beneficiary.id.slice(-4) || "5928"}</p>
                  </div>
                  <span className="bg-primary-fixed text-on-primary-fixed text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase">
                    Verified
                  </span>
                </div>
                <div className="p-4 border border-surface-container-highest rounded-lg flex items-center justify-between font-sans">
                  <div>
                    <p className="font-bold text-sm text-on-surface">Ration Card (SFY)</p>
                    <p className="text-xs text-slate-400 font-mono">RC-AS-{beneficiary.id.split("-")[1] || "4029"}</p>
                  </div>
                  <span className="bg-primary-fixed text-on-primary-fixed text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Impact Summary" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 space-y-6">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-headline">
                <span className="material-symbols-outlined text-primary font-bold">insights</span>
                Household Socio-Economic Impact Summary
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed font-sans">
                Aggregated impact parameters representing baseline improvements across healthcare, schooling, and
                financial reserve parameters since enrolling in the portal.
              </p>
              <div className="space-y-4 font-sans text-xs">
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>Financial Reserves &amp; Savings Growth</span>
                    <span className="text-primary">{score}% Increase</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${score}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>Agricultural Efficiency &amp; Crop Yield</span>
                    <span className="text-primary">{Math.min(95, score - 15)}% Optimal</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(95, score - 15)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Secondary Info */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Stats Card */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="text-xs uppercase tracking-widest text-on-surface-variant mb-4 font-sans font-bold">
              Cumulative Impact
            </h3>
            <div className="space-y-4 text-sm font-sans">
              <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px] font-bold">payments</span>
                  </div>
                  <span className="font-semibold text-on-surface">Income Increase</span>
                </div>
                <span className="font-bold text-on-surface text-base">{incomeIncrease}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px] font-bold">water_drop</span>
                  </div>
                  <span className="font-semibold text-on-surface">Water Saved</span>
                </div>
                <span className="font-bold text-on-surface text-base">{waterSaved}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
