"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import GoalSheetForm from "@/components/GoalSheetForm";
import { useToast } from "@/context/ToastContext";
import MonthlyPlanner from "@/components/MonthlyPlanner";
import EngagementSurveyViewer from "@/components/EngagementSurveyViewer";
import LookBeyondSurveyViewer from "@/components/LookBeyondSurveyViewer";
import StudentDataView from "@/components/StudentDataView";
import IndividualFeedbackView from "@/components/IndividualFeedbackView";
import dynamic from "next/dynamic";

const PDFViewerModal = dynamic(() => import("@/components/PDFViewerModal"), { ssr: false });

export default function FellowProfileDetail() {
  const { id } = useParams();
  const { token, user, isInitializing } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [fellow, setFellow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [goalSheets, setGoalSheets] = useState([]);
  const [coachingRecords, setCoachingRecords] = useState([]);
  const [engagementSurveys, setEngagementSurveys] = useState([]);
  const [lookBeyondSurveys, setLookBeyondSurveys] = useState([]);
  const [viewingSurvey, setViewingSurvey] = useState(null);
  const [viewingLookBeyond, setViewingLookBeyond] = useState(null);
  const [activeTab, setActiveTab] = useState("Goals");
  const [showPDFModal, setShowPDFModal] = useState(false);

  // Goal Sheet states
  const [showGoalSheetForm, setShowGoalSheetForm] = useState(false);
  const [editingGoalSheet, setEditingGoalSheet] = useState(null);
  const [reviewingGoalSheet, setReviewingGoalSheet] = useState(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [deleteItemType, setDeleteItemType] = useState(""); // "goalSheet" | "pmReflection"

  // Coaching & Classroom Observation modal states
  const [showAddCoachingModal, setShowAddCoachingModal] = useState(false);
  const [newCoachingHeading, setNewCoachingHeading] = useState("");
  const [newCoachingDate, setNewCoachingDate] = useState("");
  const [newCoachingFeedback, setNewCoachingFeedback] = useState("");
  const [newCoachingObservation, setNewCoachingObservation] = useState("");
  const [newCoachingFile, setNewCoachingFile] = useState(null);

  // Redirection check: Fellows can only view their profile under /profile, not here
  useEffect(() => {
    if (user?.roleName === "FELLOW") {
      router.replace("/profile");
    }
  }, [user, router]);

  useEffect(() => {
    async function loadFellowDetail() {
      try {
        const res = await fetch(`/api/fellows/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (json.success) {
          setFellow(json.data);
          setGoalSheets(json.data.goalSheets || []);
        }
      } catch (err) {
        console.error("Failed to load fellow detail:", err);
      } finally {
        setLoading(false);
      }
    }
    if (!isInitializing) {
      loadFellowDetail();
    }
  }, [id, token, isInitializing]);

  useEffect(() => {
    async function loadCoachingRecords() {
      try {
        const res = await fetch(`/api/fellows/${id}/coaching`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (json.success) {
          setCoachingRecords(json.data || []);
        }
      } catch (err) {
        console.error("Failed to load coaching records:", err);
      }
    }
    if (activeTab === "Coaching & Classroom Observation" && token && id) {
      loadCoachingRecords();
    }
  }, [activeTab, token, id]);

  useEffect(() => {
    async function loadEngagementSurveys() {
      try {
        const res = await fetch(`/api/fellows/${id}/engagement-surveys`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (json.success) {
          setEngagementSurveys(json.data || []);
        }
      } catch (err) {
        console.error("Failed to load engagement surveys:", err);
      }
    }
    if (activeTab === "Engagement Survey" && token && id) {
      loadEngagementSurveys();
    }
  }, [activeTab, token, id]);

  useEffect(() => {
    async function loadLookBeyondSurveys() {
      try {
        const res = await fetch(`/api/fellows/${id}/look-beyond`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (json.success) {
          setLookBeyondSurveys(json.data || []);
        }
      } catch (err) {
        console.error("Failed to load look beyond surveys:", err);
      }
    }
    if (activeTab === "Look Beyond Survey" && token && id) {
      loadLookBeyondSurveys();
    }
  }, [activeTab, token, id]);

  const handleAddCoachingRecord = async (e) => {
    e.preventDefault();
    if (!newCoachingHeading || !newCoachingDate) return;

    try {
      const formData = new FormData();
      formData.append("heading", newCoachingHeading);
      formData.append("date", newCoachingDate);
      formData.append("feedback", newCoachingFeedback);
      formData.append("observationNotes", newCoachingObservation);
      if (newCoachingFile) {
        formData.append("file", newCoachingFile);
      }

      const res = await fetch(`/api/fellows/${id}/coaching`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        setCoachingRecords(prev => [json.data, ...prev]);
        setNewCoachingHeading("");
        setNewCoachingDate("");
        setNewCoachingFeedback("");
        setNewCoachingObservation("");
        setNewCoachingFile(null);
        setShowAddCoachingModal(false);
        toast.success("Coaching record added!");
      } else {
        toast.error(json.error || "Failed to add record");
      }
    } catch (err) {
      console.error("Failed to add coaching record:", err);
      toast.error("An error occurred");
    }
  };

  const handleDeleteCoachingRecord = async (recordId) => {
    try {
      const res = await fetch(`/api/fellows/${id}/coaching?recordId=${recordId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setCoachingRecords(prev => prev.filter(r => r.id !== recordId));
        toast.success("Record deleted");
      } else {
        toast.error(json.error || "Failed to delete record");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

  const handleGoalSheetSaved = (updatedSheet) => {
    setGoalSheets((prev) => {
      const idx = prev.findIndex((s) => s.id === updatedSheet.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedSheet;
        return copy;
      }
      return [updatedSheet, ...prev];
    });
  };

  const handleDeleteGoalSheet = (sheetId) => {
    setDeleteItemId(sheetId);
    setDeleteItemType("goalSheet");
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItemId) return;

    if (deleteItemType === "goalSheet") {
      try {
        const res = await fetch(`/api/fellows/${id}/goal-sheets/${deleteItemId}`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (json.success) {
          setGoalSheets((prev) => prev.filter((s) => s.id !== deleteItemId));
          toast.success("Goal sheet deleted successfully!");
        } else {
          toast.error(json.error || "Failed to delete goal sheet");
        }
      } catch (err) {
        console.error("Failed to delete goal sheet:", err);
        toast.error("An error occurred");
      }
    }
    setDeleteModalOpen(false);
    setDeleteItemId(null);
    setDeleteItemType("");
  };

  if (isInitializing || loading) {
    return (
      <div className="p-8 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!fellow) {
    return <div className="p-8 text-center text-on-surface-variant font-medium">Fellow not found</div>;
  }

  const assignedSchool = fellow.schools && fellow.schools.length > 0 ? fellow.schools[0].school : null;
  const fellowLocation = fellow.address || (assignedSchool ? assignedSchool.location : "Kalgachia");

  return (
    <div className="p-6 md:p-10 pb-24 overflow-x-hidden max-w-7xl mx-auto w-full">
      {/* Back Link */}
      {user?.roleName !== "FELLOW" ? (
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
      ) : (
        <Link
          href="/education"
          className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
        >
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">
            arrow_back
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
            Back to Education Hub
          </span>
        </Link>
      )}

      {/* Hero Section */}
      <header className="bg-surface-container-lowest rounded-xl p-8 shadow-ambient flex flex-col lg:flex-row gap-8 items-start justify-between relative overflow-hidden group mb-8 border border-surface-container-low">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-bl-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700"></div>
        <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shrink-0 border-4 border-surface shadow-md">
            {fellow.avatar ? (
              <img
                alt="Fellow avatar"
                className="w-full h-full object-cover"
                src={fellow.avatar}
              />
            ) : (
              <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant text-3xl font-bold font-headline">
                {fellow.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
              </div>
            )}
          </div>
          <div className="pt-2">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-3xl font-headline font-black text-on-surface capitalize">
                {fellow.name}
              </h2>
              <span className="bg-primary-fixed text-on-primary-fixed text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                {fellow.cohort}
              </span>
            </div>
            <p className="text-on-surface-variant font-medium mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">location_on</span>
              {fellowLocation} • {fellow.students ? fellow.students.length : 0} Assigned Students
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500 font-sans">
              <div>
                <span className="font-bold text-on-surface">Email:</span> {fellow.email || "fellow@aman.org"}
              </div>
              <span className="w-1 h-1 bg-surface-container-highest rounded-full self-center"></span>
              <div>
                <span className="font-bold text-on-surface">Assigned School:</span> {assignedSchool ? assignedSchool.name : "Unassigned"}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 relative z-10 shrink-0 self-end lg:self-start">
          <button className="bg-surface-container text-on-surface px-5 py-2.5 rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20">
            <span className="material-symbols-outlined text-[18px]">mail</span>
            Contact Fellow
          </button>
          <button
            onClick={() => setShowPDFModal(true)}
            className="bg-surface-container text-on-surface px-5 py-2.5 rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px]">book</span>
            Learning Framework
          </button>
        </div>
      </header>

      {/* Placement Summary */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient border border-outline-variant/10 mb-8">
        <h3 className="font-headline font-bold text-base text-on-surface mb-4">Placement Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-on-surface-variant uppercase tracking-wide">Active Placement</span>
            <span className="font-semibold text-on-surface">{assignedSchool ? assignedSchool.name : "Unassigned"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-on-surface-variant uppercase tracking-wide">Class Grades</span>
            <span className="font-semibold text-on-surface">Grade 3, Grade 4</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-on-surface-variant uppercase tracking-wide">Assigned Students</span>
            <span className="font-semibold text-on-surface">{fellow.students ? fellow.students.length : 0} Students</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-on-surface-variant uppercase tracking-wide">Evaluation Rating</span>
            <span className="font-semibold text-primary">{fellow.evaluationRating || "4.8"} / 5.0</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-container-highest mb-8 overflow-x-auto no-scrollbar font-sans">
        {["Monthly Planner", "Goals", "Performance Dashboard", "Student Data", "After School Student Data", "Coaching & Classroom Observation", "Engagement Survey", "Look Beyond Survey", "Individual Feedback Tracking"].map((tab) => {
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
      <div>
          {activeTab === "Monthly Planner" && (
            <MonthlyPlanner fellowId={fellow.id} />
          )}
          {activeTab === "Goals" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline font-bold text-xl text-on-surface">Goal Sheets</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingGoalSheet(null);
                      setReviewingGoalSheet(null);
                      setShowGoalSheetForm(true);
                    }}
                    className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors shadow-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Create New Goal Sheet
                  </button>
                </div>
              </div>

              {goalSheets.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-outline-variant/10 text-on-surface-variant">
                  No goal sheets have been created yet. Click &quot;Create New Goal Sheet&quot; to start.
                </div>
              ) : (
                goalSheets.map((sheet) => (
                  <div key={sheet.id} className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 relative group hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <button
                        onClick={() => {
                          setEditingGoalSheet(sheet);
                          setReviewingGoalSheet(sheet);
                          setShowGoalSheetForm(true);
                        }}
                        className="text-left flex-1 cursor-pointer"
                      >
                        <h3 className="font-headline font-bold text-lg text-on-surface flex items-center gap-2">
                          Goal Sheet
                          <span className="text-xs font-normal text-on-surface-variant">
                            {new Date(sheet.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </h3>
                        {sheet.portfolioLink && (
                          <p className="text-sm text-primary mt-1 truncate max-w-md">
                            Portfolio linked
                          </p>
                        )}
                      </button>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            sheet.status === "SUBMITTED"
                              ? "bg-secondary-container text-on-secondary-container"
                              : "bg-primary-fixed text-on-primary-fixed"
                          }`}
                        >
                          {sheet.status}
                        </span>
                        {(user?.roleName === "ADMIN" || user?.roleName === "PROGRAM_MANAGER") && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReviewingGoalSheet(sheet);
                              setEditingGoalSheet(sheet);
                              setShowGoalSheetForm(true);
                            }}
                            className="text-xs text-primary font-semibold hover:underline cursor-pointer whitespace-nowrap"
                          >
                            Write Review
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteGoalSheet(sheet.id)}
                          className="text-on-surface-variant hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete goal sheet"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
                    <span className="text-primary">+{fellow.progress || 34}% Progress</span>
                  </div>
                  <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden relative">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${fellow.progress || 34}%` }}></div>
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
                      <div className="absolute bottom-full mb-2 bg-on-surface text-surface text-[10px] px-2.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
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

          {activeTab === "Student Data" && (
            <StudentDataView
              fellowId={fellow.id}
              token={token}
              source="school"
              canEditNotes={user?.roleName === "ADMIN" || user?.roleName === "PROGRAM_MANAGER" || user?.roleName === "FELLOW"}
            />
          )}

          {activeTab === "After School Student Data" && (
            <StudentDataView
              fellowId={fellow.id}
              token={token}
              source="afterSchool"
              canEditNotes={user?.roleName === "ADMIN" || user?.roleName === "PROGRAM_MANAGER" || user?.roleName === "FELLOW"}
            />
          )}

          {activeTab === "Coaching & Classroom Observation" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline font-bold text-xl text-on-surface">Coaching & Classroom Observation Records</h3>
                {(user?.roleName === "ADMIN" || user?.roleName === "PROGRAM_MANAGER") && (
                  <button
                    onClick={() => setShowAddCoachingModal(true)}
                    className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors shadow-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Add Record
                  </button>
                )}
              </div>
              <div className="space-y-6">
                {coachingRecords.length === 0 ? (
                  <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-outline-variant/10 text-on-surface-variant">
                    No coaching or classroom observation records available yet.
                  </div>
                ) : (
                  coachingRecords.map((record) => (
                    <div key={record.id} className="p-5 border border-surface-container rounded-lg relative group font-sans">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-on-surface text-lg">{record.heading}</h4>
                          <p className="text-xs text-on-surface-variant mt-1">
                            {new Date(record.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                        {(user?.roleName === "ADMIN" || user?.roleName === "PROGRAM_MANAGER") && (
                          <button
                            onClick={() => handleDeleteCoachingRecord(record.id)}
                            className="text-on-surface-variant hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete record"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>

                      {record.feedback && (
                        <div className="mb-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                          <p className="text-xs uppercase tracking-widest text-blue-700 font-bold mb-2">Feedback</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{record.feedback}</p>
                        </div>
                      )}

                      {record.observationNotes && (
                        <div className="mb-4 p-4 bg-amber-50/50 rounded-lg border border-amber-100">
                          <p className="text-xs uppercase tracking-widest text-amber-700 font-bold mb-2">Observation Notes</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{record.observationNotes}</p>
                        </div>
                      )}

                      {record.fileUrl && (
                        <div className="mb-4">
                          {/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(record.fileUrl) ? (
                            <img
                              src={record.fileUrl}
                              alt={record.heading}
                              className="max-w-full max-h-64 rounded-lg border border-gray-200 object-contain cursor-pointer"
                              onClick={() => window.open(record.fileUrl, '_blank')}
                            />
                          ) : (
                            <a
                              href={record.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-blue-600 font-semibold transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">attach_file</span>
                              {record.fileUrl.split("/").pop()}
                            </a>
                          )}
                        </div>
                      )}

                      <div className="text-xs text-slate-400 mt-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                        Added by: <span className="font-semibold text-on-surface">{record.author?.name || "Unknown"}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "Engagement Survey" && (
            <div className="space-y-6">
              <h3 className="font-headline font-bold text-xl text-on-surface">Engagement Survey</h3>

              {engagementSurveys.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-outline-variant/10 text-on-surface-variant">
                  No engagement surveys submitted yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {engagementSurveys.map((survey) => (
                    <div key={survey.id} className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient border border-outline-variant/10 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-on-surface text-sm">Engagement Survey</p>
                        <p className="text-xs text-on-surface-variant mt-1">
                          {new Date(survey.surveyDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>
                      <button
                        onClick={() => setViewingSurvey(survey)}
                        className="p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer text-on-surface-variant hover:text-primary"
                        title="View Responses"
                      >
                        <span className="material-symbols-outlined text-[22px]">visibility</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "Look Beyond Survey" && (
            <div className="space-y-6">
              <h3 className="font-headline font-bold text-xl text-on-surface">Look Beyond Survey</h3>

              {lookBeyondSurveys.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-outline-variant/10 text-on-surface-variant">
                  No Look Beyond surveys submitted yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {lookBeyondSurveys.map((survey) => (
                    <div key={survey.id} className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient border border-outline-variant/10 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-on-surface text-sm">Look Beyond Survey</p>
                        <p className="text-xs text-on-surface-variant mt-1">
                          {new Date(survey.surveyDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>
                      <button
                        onClick={() => setViewingLookBeyond(survey)}
                        className="p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer text-on-surface-variant hover:text-primary"
                        title="View Responses"
                      >
                        <span className="material-symbols-outlined text-[22px]">visibility</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "Individual Feedback Tracking" && (
            <IndividualFeedbackView
              fellowId={fellow.id}
              token={token}
              canManage={user?.roleName === "ADMIN" || user?.roleName === "PROGRAM_MANAGER"}
            />
          )}

      </div>

      {/* Goal Sheet Form Modal */}
      {showGoalSheetForm && (
        <GoalSheetForm
          fellowId={fellow.id}
          sheetData={editingGoalSheet}
          isManager={
            reviewingGoalSheet
              ? true
              : false
          }
          token={token}
          onClose={() => {
            setShowGoalSheetForm(false);
            setEditingGoalSheet(null);
            setReviewingGoalSheet(null);
          }}
          onSave={(updatedSheet) => {
            handleGoalSheetSaved(updatedSheet);
            setShowGoalSheetForm(false);
            setEditingGoalSheet(null);
            setReviewingGoalSheet(null);
          }}
        />
      )}

      {/* Add Coaching & Classroom Observation Record Modal */}
      {showAddCoachingModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Add Coaching & Classroom Observation Record</h3>
              <button
                onClick={() => setShowAddCoachingModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleAddCoachingRecord} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Heading / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Classroom Observation Q2"
                  value={newCoachingHeading}
                  onChange={(e) => setNewCoachingHeading(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</label>
                <input
                  type="date"
                  required
                  value={newCoachingDate}
                  onChange={(e) => setNewCoachingDate(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Feedback</label>
                <textarea
                  rows={3}
                  placeholder="Provide feedback about the training..."
                  value={newCoachingFeedback}
                  onChange={(e) => setNewCoachingFeedback(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Observation Notes</label>
                <textarea
                  rows={3}
                  placeholder="Record your observations..."
                  value={newCoachingObservation}
                  onChange={(e) => setNewCoachingObservation(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Upload Document (optional)</label>
                <input
                  type="file"
                  onChange={(e) => setNewCoachingFile(e.target.files?.[0] || null)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-xs"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCoachingModal(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteItemId(null);
          setDeleteItemType("");
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Goal Sheet"
        message="Are you sure you want to delete this goal sheet? This action is permanent and cannot be undone."
      />

      <PDFViewerModal isOpen={showPDFModal} onClose={() => setShowPDFModal(false)} />

      {viewingSurvey && (
        <EngagementSurveyViewer
          survey={viewingSurvey}
          onClose={() => setViewingSurvey(null)}
        />
      )}

      {viewingLookBeyond && (
        <LookBeyondSurveyViewer
          survey={viewingLookBeyond}
          onClose={() => setViewingLookBeyond(null)}
        />
      )}
    </div>
  );
}
