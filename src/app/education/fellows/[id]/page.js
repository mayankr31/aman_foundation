"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { FELLOW_TABS, labelFromSlug } from "@/lib/fellowTabs";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import GoalSheetForm from "@/components/GoalSheetForm";
import Pagination from "@/components/ui/Pagination";
import DateInput from "@/components/ui/DateInput";
import usePagination from "@/lib/usePagination";
import { formatDate } from "@/lib/date";
import { useToast } from "@/context/ToastContext";
import MonthlyPlanner from "@/components/MonthlyPlanner";
import EngagementSurveyViewer from "@/components/EngagementSurveyViewer";
import LookBeyondSurveyViewer from "@/components/LookBeyondSurveyViewer";
import IndividualFeedbackView from "@/components/IndividualFeedbackView";
import PhotoLightbox from "@/components/PhotoLightbox";
import FilePreviewLink from "@/components/files/FilePreviewLink";
import FilePreviewImage from "@/components/files/FilePreviewImage";
import Avatar from "@/components/ui/Avatar";
import BasicDetailsView from "@/components/BasicDetailsView";
import PersonalDetailsForm from "@/components/PersonalDetailsForm";
import AssignmentsSection from "@/components/AssignmentsSection";
import useAutoScrollActiveTab from "@/lib/useAutoScrollActiveTab";
import { exportEngagementSurveyPdf, exportLookBeyondSurveyPdf } from "@/lib/surveyExport";
import { getManagerCandidates } from "@/lib/roleHierarchy";
import dynamic from "next/dynamic";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

const PDFViewerModal = dynamic(() => import("@/components/PDFViewerModal"), { ssr: false });

export default function FellowProfileDetail() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <FellowProfileDetailContent />
    </Suspense>
  );
}

function FellowProfileDetailContent() {
  const { id } = useParams();
  const { token, user, isInitializing, can, canDeleteRecords } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [fellow, setFellow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPersonalDetailsForm, setShowPersonalDetailsForm] = useState(false);
  const [managers, setManagers] = useState([]);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [goalSheets, setGoalSheets] = useState([]);
  const [coachingRecords, setCoachingRecords] = useState([]);
  const { pageItems: pagedGoalSheets, currentPage: goalSheetsPage, setCurrentPage: setGoalSheetsPage } = usePagination(goalSheets, 10);
  const { pageItems: pagedCoaching, currentPage: coachingPage, setCurrentPage: setCoachingPage } = usePagination(coachingRecords, 10);
  const [engagementSurveys, setEngagementSurveys] = useState([]);
  const [lookBeyondSurveys, setLookBeyondSurveys] = useState([]);
  const [viewingSurvey, setViewingSurvey] = useState(null);
  const [viewingLookBeyond, setViewingLookBeyond] = useState(null);
  const activeTab = labelFromSlug(searchParams.get("tab")) || "Personal Details";
  const { containerRef: tabsContainerRef, setActiveRef: setActiveTabRef } = useAutoScrollActiveTab(
    activeTab,
    !isInitializing && !loading && Boolean(fellow)
  );
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
    if (!token) return;
    if (user?.roleName !== "ADMIN" && user?.roleName !== "HR" && !can("employees", "READ")) {
      return;
    }
    fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success) setManagers(json.data || []);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

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

  const handleDeleteSurvey = async (surveyType, surveyId) => {
    if (!window.confirm(`Delete this ${surveyType === "engagement" ? "engagement" : "look beyond"} survey?`)) return;
    const endpoint =
      surveyType === "engagement"
        ? `/api/fellows/${id}/engagement-surveys/${surveyId}`
        : `/api/fellows/${id}/look-beyond/${surveyId}`;
    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete survey");
      }
      if (surveyType === "engagement") {
        setEngagementSurveys((prev) => prev.filter((survey) => survey.id !== surveyId));
      } else {
        setLookBeyondSurveys((prev) => prev.filter((survey) => survey.id !== surveyId));
      }
      toast.success("Survey deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete survey");
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

  const handlePersonalDetailsSaved = async (payload) => {
    try {
      const res = await fetch(`/api/fellows/${fellow.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Failed to update personal details");
        throw new Error(json.error || "Failed to update personal details");
      }
      setFellow(json.data);
      setShowPersonalDetailsForm(false);
      toast.success("Personal details updated successfully");
    } catch (err) {
      console.error("Update personal details error:", err);
      throw err;
    }
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
  const fellowUser = fellow.user || {};
  const personDetails = {
    ...fellowUser,
    name: fellow.name || fellowUser.name,
    email: fellowUser.email || fellow.email,
    mobile: fellowUser.mobile || fellow.phone,
    phone: fellowUser.mobile || fellow.phone,
    dob: fellowUser.dob || fellow.dob,
    gender: fellowUser.gender || fellow.gender,
    address: fellowUser.address || fellow.address,
    avatar: fellowUser.avatar || fellow.avatar,
    dateOfJoining: fellowUser.dateOfJoining,
  };
  const managerOptions = getManagerCandidates(managers, fellowUser.role?.name, {
    excludeUserId: fellowUser.id,
  });
  const canEditPersonalDetails =
    user?.roleName === "ADMIN" ||
    user?.roleName === "HR" ||
    (PROGRAM_ROLES.includes(user?.roleName) && can("education", "WRITE")) ||
    (can("education", "WRITE") && fellowUser.managerId === user?.id);
  const canEditAssignments =
    user?.roleName === "ADMIN" ||
    (PROGRAM_ROLES.includes(user?.roleName) && can("education", "WRITE"));

  return (
    <div className="p-4 sm:p-6 md:p-10 pb-24 overflow-x-hidden max-w-7xl mx-auto w-full">
      {/* Back Link */}
      {user?.roleName !== "FELLOW" ? (
        <Link
          href="/education/fellows"
          className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-4 group w-fit"
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
          className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-4 group w-fit"
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
      <header className="bg-surface-container-lowest rounded-xl p-5 sm:p-8 shadow-ambient flex flex-col lg:flex-row gap-8 items-start justify-between relative overflow-hidden group mb-8 border border-surface-container-low">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-bl-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700"></div>
        <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shrink-0 border-4 border-surface shadow-md bg-surface-container-high flex items-center justify-center">
            <Avatar
              src={fellow.avatar}
              name={fellow.name}
              alt="Fellow avatar"
              className="w-full h-full object-cover cursor-pointer"
              fallbackClassName="text-3xl font-bold font-headline text-on-surface-variant"
              onClick={() => setLightboxPhoto(fellow.avatar)}
            />
          </div>
          <div className="pt-2 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="page-title text-on-surface capitalize break-words">
                {fellow.name}
              </h2>
            </div>
            <p className="text-on-surface-variant font-medium mb-4 flex items-center gap-2 break-words">
              <span className="material-symbols-outlined text-sm text-primary shrink-0">location_on</span>
              {fellowLocation} • {fellow.students ? fellow.students.length : 0} Assigned Students
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500 font-sans">
              <div className="min-w-0 break-all">
                <span className="font-bold text-on-surface">Email:</span> {fellow.email || "fellow@aman.org"}
              </div>
              <span className="w-1 h-1 bg-surface-container-highest rounded-full self-center"></span>
              <div>
                <span className="font-bold text-on-surface">Assigned School:</span> {assignedSchool ? assignedSchool.name : "Unassigned"}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 relative z-10 shrink-0 self-end lg:self-start">
          <button className="bg-surface-container text-on-surface px-4 py-2 rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20">
            <span className="material-symbols-outlined text-[18px]">mail</span>
            Contact Fellow
          </button>
          <button
            onClick={() => setShowPDFModal(true)}
            className="bg-surface-container text-on-surface px-4 py-2 rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px]">book</span>
            Learning Framework
          </button>
        </div>
      </header>

      {/* Placement Summary */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient border border-outline-variant/10 mb-8">
        <h3 className="section-title text-on-surface mb-4">Placement Summary</h3>
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

      {/* Mobile tab selector */}
      <div className="md:hidden mb-6 font-sans">
        <label htmlFor="fellow-tab" className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
          Profile section
        </label>
        <select
          id="fellow-tab"
          value={activeTab}
          onChange={(e) => router.replace(`/education/fellows/${id}?tab=${FELLOW_TABS.find((t) => t.label === e.target.value)?.slug || ""}`, { scroll: false })}
          className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm font-semibold text-on-surface outline-none focus:border-primary"
        >
          {FELLOW_TABS.map((tab) => (
            <option key={tab.slug} value={tab.label}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div ref={tabsContainerRef} className="hidden md:flex border-b border-surface-container-highest mb-8 overflow-x-auto no-scrollbar font-sans">
        {FELLOW_TABS.map((tab) => {
          const isActive = activeTab === tab.label;
          return (
            <button
              key={tab.slug}
              ref={isActive ? setActiveTabRef : null}
              onClick={() =>
                router.replace(`/education/fellows/${id}?tab=${tab.slug}`, { scroll: false })
              }
              className={`px-3 sm:px-6 py-2.5 sm:py-3 text-sm whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? "font-semibold text-primary border-b-2 border-primary"
                  : "font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 border-b-2 border-transparent"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div>
          {activeTab === "Personal Details" && (
            <div className="space-y-4">
              {canEditPersonalDetails && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowPersonalDetailsForm(true)}
                    className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors shadow-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Edit Personal Details
                  </button>
                </div>
              )}
              <BasicDetailsView person={personDetails} />
            </div>
          )}
          {activeTab === "Assignments" && (
            <AssignmentsSection
              title="Assignments"
              isFellow
              fellowId={fellow.id}
              userId={fellow.userId}
              schools={(fellow.schools || []).map((item) => item.school)}
              centres={(fellow.afterSchoolCentres || []).map((item) => item.centre)}
              programs={(fellow.livelihoodPrograms || []).map((item) => item.program)}
              canEdit={canEditAssignments}
              canEditLivelihoodPrograms={user?.roleName === "ADMIN"}
            />
          )}
          {activeTab === "Monthly Planner" && (
            <MonthlyPlanner fellowId={fellow.id} />
          )}
          {activeTab === "Goals" && (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                <h3 className="section-title text-on-surface">Goal Sheets</h3>
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
                pagedGoalSheets.map((sheet) => (
                  <div key={sheet.id} className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 relative group hover:border-primary/30 transition-colors">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <button
                        onClick={() => {
                          setEditingGoalSheet(sheet);
                          setReviewingGoalSheet(sheet);
                          setShowGoalSheetForm(true);
                        }}
                        className="text-left flex-1 cursor-pointer"
                      >
                        <h3 className="section-title text-on-surface flex items-center gap-2">
                          Goal Sheet
                          <span className="text-xs font-normal text-on-surface-variant">
                            {formatDate(sheet.date)}
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
                        {(user?.roleName === "ADMIN" || PROGRAM_ROLES.includes(user?.roleName)) && (
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
                        {canDeleteRecords && (
                          <button
                            onClick={() => handleDeleteGoalSheet(sheet.id)}
                            className="text-on-surface-variant hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete goal sheet"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <Pagination currentPage={goalSheetsPage} totalItems={goalSheets.length} itemsPerPage={10} onPageChange={setGoalSheetsPage} />
            </div>
          )}

          {activeTab === "Coaching & Classroom Observation" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                <h3 className="section-title text-on-surface">Coaching & Classroom Observation Records</h3>
                {(user?.roleName === "ADMIN" || PROGRAM_ROLES.includes(user?.roleName)) && (
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
                  pagedCoaching.map((record) => (
                    <div key={record.id} className="p-5 border border-surface-container rounded-lg relative group font-sans">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-on-surface text-lg">{record.heading}</h4>
                          <p className="text-xs text-on-surface-variant mt-1">
                            {formatDate(record.date)}
                          </p>
                        </div>
                        {canDeleteRecords && (
                          <button
                            onClick={() => handleDeleteCoachingRecord(record.id)}
                            className="text-on-surface-variant hover:text-red-600 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
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
                            <FilePreviewImage
                              src={record.fileUrl}
                              alt={record.heading}
                              name={record.heading}
                              className="max-w-full max-h-64 rounded-lg border border-gray-200 object-contain cursor-pointer"
                            />
                          ) : (
                            <FilePreviewLink
                              href={record.fileUrl}
                              name={record.fileUrl.split("/").pop()}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-blue-600 font-semibold transition-colors max-w-full"
                            >
                              <span className="material-symbols-outlined text-[16px] shrink-0">attach_file</span>
                              <span className="truncate">{record.fileUrl.split("/").pop()}</span>
                            </FilePreviewLink>
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
                <Pagination currentPage={coachingPage} totalItems={coachingRecords.length} itemsPerPage={10} onPageChange={setCoachingPage} />
              </div>
            </div>
          )}

          {activeTab === "Engagement Survey" && (
            <div className="space-y-6">
              <h3 className="section-title text-on-surface">Engagement Survey</h3>

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
                          {formatDate(survey.surveyDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => exportEngagementSurveyPdf(survey, fellow.name)}
                          className="p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer text-on-surface-variant hover:text-primary"
                          title="Export as PDF"
                        >
                          <span className="material-symbols-outlined text-[22px]">download</span>
                        </button>
                        <button
                          onClick={() => setViewingSurvey(survey)}
                          className="p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer text-on-surface-variant hover:text-primary"
                          title="View Responses"
                        >
                          <span className="material-symbols-outlined text-[22px]">visibility</span>
                        </button>
                        {canDeleteRecords && (
                          <button
                            onClick={() => handleDeleteSurvey("engagement", survey.id)}
                            className="inline-flex items-center justify-center min-w-9 min-h-9 p-2 hover:bg-error-container rounded-full transition-colors cursor-pointer text-on-surface-variant hover:text-error"
                            title="Delete survey"
                          >
                            <span className="material-symbols-outlined text-[22px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "Look Beyond Survey" && (
            <div className="space-y-6">
              <h3 className="section-title text-on-surface">Look Beyond Survey</h3>

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
                          {formatDate(survey.surveyDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => exportLookBeyondSurveyPdf(survey, fellow.name)}
                          className="p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer text-on-surface-variant hover:text-primary"
                          title="Export as PDF"
                        >
                          <span className="material-symbols-outlined text-[22px]">download</span>
                        </button>
                        <button
                          onClick={() => setViewingLookBeyond(survey)}
                          className="p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer text-on-surface-variant hover:text-primary"
                          title="View Responses"
                        >
                          <span className="material-symbols-outlined text-[22px]">visibility</span>
                        </button>
                        {canDeleteRecords && (
                          <button
                            onClick={() => handleDeleteSurvey("look-beyond", survey.id)}
                            className="inline-flex items-center justify-center min-w-9 min-h-9 p-2 hover:bg-error-container rounded-full transition-colors cursor-pointer text-on-surface-variant hover:text-error"
                            title="Delete survey"
                          >
                            <span className="material-symbols-outlined text-[22px]">delete</span>
                          </button>
                        )}
                      </div>
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
              canManage={user?.roleName === "ADMIN" || PROGRAM_ROLES.includes(user?.roleName)}
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
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-6 font-sans max-h-[90vh] overflow-y-auto">
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
                <DateInput
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
                  className="px-4 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPersonalDetailsForm && canEditPersonalDetails && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-surface-container-lowest rounded-t-2xl sm:rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-surface-container-lowest flex items-start justify-between gap-4 p-4 sm:p-6 border-b border-surface-container">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-on-surface">Edit Personal Details</h3>
                <p className="text-xs text-on-surface-variant mt-1 truncate">
                  {fellow.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPersonalDetailsForm(false)}
                className="p-2 rounded-full hover:bg-surface-container transition-colors cursor-pointer shrink-0"
                aria-label="Close personal details editor"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <PersonalDetailsForm
                person={personDetails}
                avatarUploadUrl={fellow.userId ? `/api/users/${fellow.userId}/avatar` : null}
                onSubmit={handlePersonalDetailsSaved}
                onCancel={() => setShowPersonalDetailsForm(false)}
                showEmployment
                canEditDepartment
                canEditReporting
                canEditExit
                managerOptions={managerOptions}
                onAvatarUpdated={(url) => {
                  setFellow((prev) => (prev ? { ...prev, avatar: url } : prev));
                }}
              />
            </div>
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

      {showPDFModal && (
        <PDFViewerModal
          isOpen
          onClose={() => setShowPDFModal(false)}
          file="/docs/Learning-Leadership-Progression-Framework.pdf"
          title="Learning & Leadership Progression Framework"
        />
      )}

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

      <PhotoLightbox src={lightboxPhoto} alt="Fellow photo" onClose={() => setLightboxPhoto(null)} />
    </div>
  );
}
