"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function FellowProfileDetail() {
  const { id } = useParams();
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: "Improve Standard 3 Reading Proficiency",
      targetDate: "Nov 30, 2026",
      status: "In Progress",
      statusColor: "bg-secondary-container text-on-secondary-container",
      review: "Progressing well. 75% of kids now recognize standard phonics syllables.",
      milestones: [
        { id: 101, text: "Administer Baseline Phonics Assessment", done: true },
        { id: 102, text: "Weekly Group Phonics Drills", done: true },
        { id: 103, text: "Conduct Mid-Term Reading Evaluation", done: false },
      ],
    },
    {
      id: 2,
      title: "Establish PTA Attendance Benchmark at 80%",
      targetDate: "Dec 15, 2026",
      status: "Completed",
      statusColor: "bg-primary-fixed text-on-primary-fixed",
      review: "PTA attendance reached 84% in the last meeting. Excellent parent engagement.",
      milestones: [
        { id: 201, text: "Send SMS notifications 3 days in advance", done: true },
        { id: 202, text: "Design parent feedback registry sheets", done: true },
      ],
    },
    {
      id: 3,
      title: "Integrate Interactive Math Activities",
      targetDate: "Jan 10, 2027",
      status: "Not Started",
      statusColor: "bg-surface-variant text-on-surface-variant",
      review: "Scheduled for next month. Teaching kits and blocks ordered.",
      milestones: [
        { id: 301, text: "Develop Lesson Plan for Hands-on Algebra", done: false },
        { id: 302, text: "Acquire Math Kits", done: false },
      ],
    },
  ]);

  const [activeTab, setActiveTab] = useState("Goals");

  const toggleMilestone = (goalId, milestoneId) => {
    const updated = goals.map((goal) => {
      if (goal.id === goalId) {
        const updatedMilestones = goal.milestones.map((m) => {
          if (m.id === milestoneId) return { ...m, done: !m.done };
          return m;
        });
        return { ...goal, milestones: updatedMilestones };
      }
      return goal;
    });
    setGoals(updated);
  };

  const name = decodeURIComponent(id || "Aisha Rahman").replace(/-/g, " ");

  const fellowsDb = {
    "Aisha Rahman": { location: "Bartari, Kalgachia", cohort: "Cohort '23" },
    "Fatima Tariq": { location: "Digjani, Kalgachia", cohort: "Cohort '24" },
    "Bilal Khan": { location: "Sawpur, Kalgachia", cohort: "Cohort '23" },
  };

  const fellowInfo = fellowsDb[name] || { location: "Bartari, Kalgachia", cohort: "Cohort '24" };

  return (
    <div className="p-6 md:p-10 pb-24 overflow-x-hidden max-w-7xl mx-auto w-full">
      {/* Back Link */}
      <Link
        href="/education/fellows"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
          Back to Fellows Tracker
        </span>
      </Link>

      {/* Hero Section */}
      <header className="bg-surface-container-lowest rounded-xl p-8 shadow-ambient flex flex-col lg:flex-row gap-8 items-start justify-between relative overflow-hidden group mb-8 border border-surface-container-low">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-bl-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700"></div>
        <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shrink-0 border-4 border-surface shadow-md">
            <img
              alt="Fellow avatar"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7gMo5puf1sV4uTm3qk1tT-zVJzNDhR17iH7pqq5iCccFjIOCE8W3EHYIp9rK3D066Q9ZkVjeLVtNwSBF9m1-hvbOUGfnjJRGIchuJ3Eh6rp7nQKBpqZJzMPBwV1Qz0kmOpVSOMreor-iUVKwSv67qJNrwuROO0mgJdvBeUHMDI7zmdq1qTUV0QVFCkkSQdtuaqu2lruZIChfw5S3KIqkr12xKbUERZvogsBdHSPGMGD5RG1KZ_J33Im7k3p4NaNTFC6WFYrzLKONE"
            />
          </div>
          <div className="pt-2">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-3xl font-headline font-black text-on-surface capitalize">
                {name}
              </h2>
              <span className="bg-primary-fixed text-on-primary-fixed text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                {fellowInfo.cohort}
              </span>
            </div>
            <p className="text-on-surface-variant font-medium mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">location_on</span>
              {fellowInfo.location} • 3 Active Placements
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500 font-sans">
              <div>
                <span className="font-bold text-on-surface">Email:</span> aisha.r@aman.org
              </div>
              <span className="w-1 h-1 bg-surface-container-highest rounded-full self-center"></span>
              <div>
                <span className="font-bold text-on-surface">Assigned School:</span> Oakridge Academy
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 relative z-10 shrink-0 self-end lg:self-start">
          <button className="bg-surface-container text-on-surface px-5 py-2.5 rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20">
            <span className="material-symbols-outlined text-[18px]">mail</span>
            Contact Fellow
          </button>
          <button className="bg-gradient-to-br from-primary to-primary-container text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Presentation Report
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-surface-container-highest mb-8 overflow-x-auto no-scrollbar font-sans">
        {["Goals", "Performance Dashboard", "6-Month Progress Reviews"].map((tab) => {
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

      {/* Tab Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {activeTab === "Goals" && (
            <div className="space-y-6">
              {goals.map((g) => (
                <div key={g.id} className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div>
                      <h3 className="font-headline font-bold text-lg text-on-surface">{g.title}</h3>
                      <p className="text-xs text-on-surface-variant mt-1">Target Date: {g.targetDate}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${g.statusColor}`}>
                      {g.status}
                    </span>
                  </div>
                  
                  {/* Milestones Checklist */}
                  <div className="space-y-3 pl-2 mt-4 border-l-2 border-surface-container">
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-2">Goal Milestones</p>
                    {g.milestones.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => toggleMilestone(g.id, m.id)}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          m.done ? "bg-primary border-primary text-white" : "border-outline-variant group-hover:border-primary"
                        }`}>
                          {m.done && <span className="material-symbols-outlined text-[14px]">check</span>}
                        </div>
                        <span className={`text-sm ${m.done ? "line-through text-on-surface-variant" : "text-on-surface"}`}>
                          {m.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Review Outcome */}
                  <div className="mt-6 p-4 bg-surface-container-low rounded-lg">
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-1">Progress Review</p>
                    <p className="text-sm text-on-surface leading-relaxed">{g.review}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Performance Dashboard" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 space-y-8">
              <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Classroom Performance Analytics</h3>
              
              {/* Math & English Improvement Indexes */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span>Student Literacy Level Improvement</span>
                    <span className="text-primary">+34% Progress</span>
                  </div>
                  <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden relative">
                    <div className="bg-primary h-full rounded-full w-[84%]"></div>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-2">Target: +40% improvement in writing by Q4</p>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span>PTA Parent Engagement Rating</span>
                    <span className="text-primary">82% Positive</span>
                  </div>
                  <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden relative">
                    <div className="bg-primary h-full rounded-full w-[82%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span>Average Class Attendance Rate</span>
                    <span className="text-primary">91% Attendance</span>
                  </div>
                  <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden relative">
                    <div className="bg-primary h-full rounded-full w-[91%]"></div>
                  </div>
                </div>
              </div>

              {/* simulated performance dashboard bar graph */}
              <div className="mt-10 border-t border-surface-container pt-8">
                <h4 className="font-headline font-semibold text-base mb-6 text-on-surface">Monthly Assessment Benchmarks (Average Score %)</h4>
                <div className="h-64 flex items-end justify-between gap-4 border-b border-surface-container-highest pb-2 relative font-sans">
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-on-surface-variant pointer-events-none">
                    <span>100%</span>
                    <span>80%</span>
                    <span>60%</span>
                    <span>40%</span>
                    <span>20%</span>
                    <span>0%</span>
                  </div>
                  <div className="w-8"></div>
                  {[
                    { month: "Jan", val: 55 },
                    { month: "Feb", val: 62 },
                    { month: "Mar", val: 70 },
                    { month: "Apr", val: 76 },
                    { month: "May", val: 84 },
                  ].map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group max-w-[50px] relative">
                      <div className="absolute bottom-full mb-2 bg-on-surface text-surface text-[10px] px-2 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.val}%
                      </div>
                      <div
                        className="w-full bg-primary rounded-t-sm transition-all duration-500 shadow-sm"
                        style={{ height: `${d.val}%` }}
                      ></div>
                      <span className="text-[10px] text-on-surface-variant mt-2 font-medium">{d.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "6-Month Progress Reviews" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 space-y-6">
              <h3 className="font-headline font-bold text-xl text-on-surface">6-Month Comprehensive Evaluations</h3>
              <div className="space-y-6">
                <div className="p-5 border border-surface-container rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-on-surface">Mid-Cohort Review (Period: Jan - Jun)</h4>
                    <span className="text-xs font-bold text-primary bg-primary-container/10 px-2 py-1 rounded">Passed Evaluation</span>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    "Aisha has demonstrated exceptional lesson planning capabilities. Her implementation of the interactive phonics cards resulted in standard 3 reading scores increasing by 34% in 4 months. She maintains robust communications logs with the school headmasters and has successfully normalized PTA assemblies."
                  </p>
                  <div className="mt-4 flex gap-4 text-xs text-slate-400 font-sans">
                    <div>Reviewed by: <span className="font-bold text-on-surface">Sarah Jenkins (Operations Lead)</span></div>
                    <div>Date: Jun 22, 2026</div>
                  </div>
                </div>

                <div className="p-5 border border-surface-container rounded-lg opacity-60">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-on-surface">Baseline Onboarding Review</h4>
                    <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded">Completed</span>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    "Initial orientation and mapping evaluation finished. Placement set at Oakridge Academy. Baseline math proficiency logged at 45% for Standard 3."
                  </p>
                  <div className="mt-4 flex gap-4 text-xs text-slate-400 font-sans">
                    <div>Reviewed by: <span className="font-bold text-on-surface">David Chen (Coordinator)</span></div>
                    <div>Date: Jan 05, 2026</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Summary Card */}
        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
            <h3 className="font-headline font-bold text-base text-on-surface mb-4">Placement Summary</h3>
            <div className="space-y-4 font-sans text-sm">
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant">Active Placement</span>
                <span className="font-semibold text-on-surface">Oakridge Academy</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant">Class Grades</span>
                <span className="font-semibold text-on-surface">Grade 3, Grade 4</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant">Assigned Students</span>
                <span className="font-semibold text-on-surface">76 Students</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant">Evaluation Rating</span>
                <span className="font-semibold text-primary">4.8 / 5.0</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-secondary"></div>
            <h3 className="font-headline font-bold text-base text-on-surface mb-2">Donor Report Status</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
              A donor-ready document incorporating the 6-month objectives, performance scores, and assessment indexes is ready.
            </p>
            <button className="text-sm font-semibold text-secondary hover:text-on-secondary-fixed-variant flex items-center gap-1 transition-colors cursor-pointer">
              Download presentation package <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
