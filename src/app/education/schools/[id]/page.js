"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { DEFAULT_SCHOOLS } from "@/lib/schoolsData";

export default function SchoolProfileDetail() {
  const { id } = useParams();
  const name = decodeURIComponent(id || "Oakridge Academy").replace(/-/g, " ");

  const school = DEFAULT_SCHOOLS.find(s => s.name.toLowerCase() === name.toLowerCase()) || {
    name: name,
    location: "Kalgachia, Barpeta",
    address: "Kalgachia, Barpeta-781319, Assam",
    enrolled: "980",
    programs: 4,
    goal: 85,
    status: "Active",
    latitude: "26.3575° N",
    longitude: "90.8708° E",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3575.0416084059693!2d90.87077687542042!3d26.35751617698246!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3759a1653dc76b4b%3A0x63c8798832bf4693!2sAman%20Foundation!5e0!3m2!1sen!2sin!4v1780501000127!5m2!1sen!2sin",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAd0x1ztc9iuj8nay2xC1_MH-xTSmAKr8IhFrASNZRkSKkt-Y4BunC5I9iqvTLQ0_8lmU0zaYnPjqddtwFcC75fjZRBUU-N_7DG60EY9HluYt_nZMGUi1MCuGMs9ZtR2iM2AGFyw2MvZhg-RlW1as3xPOOXef7qU9OwfisCQeoCv_6chJeBZbBMdmknEG_LLtMl_EWluwSEWTOAEkWm2p31lCjaolK7bQHfqtZzT6CLsbLoare9Nu918oPHFj07H0LgIShvW4giB6YL"
  };

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
              src={school.img}
            />
          </div>
          <div className="pt-2">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-3xl font-headline font-black text-on-surface capitalize leading-tight">
                {school.name}
              </h2>
              <span className="bg-primary-fixed text-on-primary-fixed text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                {school.status}
              </span>
            </div>
            <p className="text-on-surface-variant font-medium mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">location_on</span>
              {school.location} • Regional Impact Partner
            </p>
            <div className="flex flex-col gap-2 mt-2 text-xs font-medium text-slate-500 font-sans">
              <div>
                <span className="font-bold text-on-surface">Address:</span> {school.address}
              </div>
              <div className="flex flex-wrap gap-4">
                <div>
                  <span className="font-bold text-on-surface">Contact Person:</span> Principal Margaret (admin@school.edu)
                </div>
                <span className="w-1 h-1 bg-surface-container-highest rounded-full self-center"></span>
                <div>
                  <span className="font-bold text-on-surface">Phone:</span> +91 99887 76655
                </div>
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
          
          {/* Geographic coordinates & Interactive Map */}
          <div className="bg-surface-container-lowest rounded-xl p-2 shadow-ambient border border-outline-variant/10">
            <div className="relative w-full h-[320px] rounded-lg overflow-hidden bg-surface-container-low">
              <iframe
                src={school.mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              ></iframe>
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
                <span className="font-bold text-on-surface">{school.enrolled} Students</span>
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
                <span className="font-bold text-primary">{school.programs} Programs</span>
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
