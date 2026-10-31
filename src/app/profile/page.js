"use client";

import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { FELLOW_TABS, labelFromSlug } from "@/lib/fellowTabs";
import { getStaffProfileTabs, DEFAULT_STAFF_PROFILE_TAB } from "@/lib/profileTabs";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import GoalSheetForm from "@/components/GoalSheetForm";
import { useToast } from "@/context/ToastContext";
import MonthlyPlanner from "@/components/MonthlyPlanner";
import AssignmentsSection from "@/components/AssignmentsSection";
import TeamCheckInSection from "@/components/TeamCheckInSection";
import PersonalDetailsForm from "@/components/PersonalDetailsForm";
import useAutoScrollActiveTab from "@/lib/useAutoScrollActiveTab";
import EngagementSurveyForm from "@/components/EngagementSurveyForm";
import EngagementSurveyViewer from "@/components/EngagementSurveyViewer";
import LookBeyondSurveyForm from "@/components/LookBeyondSurveyForm";
import LookBeyondSurveyViewer from "@/components/LookBeyondSurveyViewer";
import { formatDate } from "@/lib/date";
import IndividualFeedbackView from "@/components/IndividualFeedbackView";
import BasicDetailsView from "@/components/BasicDetailsView";
import PhotoLightbox from "@/components/PhotoLightbox";
import Avatar from "@/components/ui/Avatar";
import { exportEngagementSurveyPdf, exportLookBeyondSurveyPdf } from "@/lib/surveyExport";
import { formatRoleLabel } from "@/lib/roles";
import dynamic from "next/dynamic";

const PROGRAM_ROLES = ["PROGRAM_MANAGER", "ACCOUNTANT", "PROGRAM_COORDINATOR", "FIELD_EXECUTIVE", "PROGRAM_DIRECTOR", "PROGRAM_LEAD", "CLASS_ASSISTANT"];

const PDFViewerModal = dynamic(() => import("@/components/PDFViewerModal"), { ssr: false });

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const { token, isInitializing, user: currentUser, can, canDeleteRecords } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPersonalDetailsForm, setShowPersonalDetailsForm] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // Fellow specific dashboard states
  const [goalSheets, setGoalSheets] = useState([]);
  const [coachingRecords, setCoachingRecords] = useState([]);
  const [engagementSurveys, setEngagementSurveys] = useState([]);
  const [lookBeyondSurveys, setLookBeyondSurveys] = useState([]);
  const isFellow = Boolean(profile?.fellow);
  const requestedTabSlug = searchParams.get("tab");
  const staffTabs = getStaffProfileTabs(profile?.role?.name);
  const staffActiveTab =
    staffTabs.find((tab) => tab.slug === requestedTabSlug)?.label ||
    DEFAULT_STAFF_PROFILE_TAB;
  const activeTab = isFellow
    ? labelFromSlug(requestedTabSlug) || "Personal Details"
    : staffActiveTab;
  const { containerRef: tabsContainerRef, setActiveRef: setActiveTabRef } = useAutoScrollActiveTab(
    activeTab,
    !isInitializing && !loading && Boolean(profile)
  );
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [showEngagementForm, setShowEngagementForm] = useState(false);
  const [showLookBeyondForm, setShowLookBeyondForm] = useState(false);
  const [viewingSurvey, setViewingSurvey] = useState(null);
  const [viewingLookBeyond, setViewingLookBeyond] = useState(null);

  // Goal Sheet states
  const [showGoalSheetForm, setShowGoalSheetForm] = useState(false);
  const [editingGoalSheet, setEditingGoalSheet] = useState(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          const userProfile = json.data;
          setProfile(userProfile);

          if (userProfile.fellow) {
            const fellowId = userProfile.fellow.id;
            const detailRes = await fetch(`/api/fellows/${fellowId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const detailJson = await detailRes.json();
            if (detailJson.success) {
              setGoalSheets(detailJson.data.goalSheets || []);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load profile details:", err);
      } finally {
        setLoading(false);
      }
    }
    if (!isInitializing) {
      if (token) {
        loadProfile();
      } else {
        setLoading(false);
      }
    }
  }, [token, isInitializing]);

  useEffect(() => {
    async function loadCoachingRecords() {
      if (!profile?.fellow?.id || !token) return;
      try {
        const res = await fetch(`/api/fellows/${profile.fellow.id}/coaching`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setCoachingRecords(json.data || []);
        }
      } catch (err) {
        console.error("Failed to load coaching records:", err);
      }
    }
    if (activeTab === "Coaching & Classroom Observation") {
      loadCoachingRecords();
    }
  }, [activeTab, token, profile]);

  useEffect(() => {
    async function loadEngagementSurveys() {
      if (!profile?.fellow?.id || !token) return;
      try {
        const res = await fetch(`/api/fellows/${profile.fellow.id}/engagement-surveys`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setEngagementSurveys(json.data || []);
        }
      } catch (err) {
        console.error("Failed to load engagement surveys:", err);
      }
    }
    if (activeTab === "Engagement Survey") {
      loadEngagementSurveys();
    }
  }, [activeTab, token, profile]);

  useEffect(() => {
    async function loadLookBeyondSurveys() {
      if (!profile?.fellow?.id || !token) return;
      try {
        const res = await fetch(`/api/fellows/${profile.fellow.id}/look-beyond`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setLookBeyondSurveys(json.data || []);
        }
      } catch (err) {
        console.error("Failed to load look beyond surveys:", err);
      }
    }
    if (activeTab === "Look Beyond Survey") {
      loadLookBeyondSurveys();
    }
  }, [activeTab, token, profile]);

  const handleSubmitEngagementSurvey = async (surveyDate, responses) => {
    try {
      const res = await fetch(`/api/fellows/${profile.fellow.id}/engagement-surveys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ surveyDate, responses })
      });
      const json = await res.json();
      if (json.success) {
        setEngagementSurveys((prev) => [json.data, ...prev]);
        setShowEngagementForm(false);
        toast.success("Engagement survey submitted successfully!");
      } else {
        toast.error(json.error || "Failed to submit survey");
      }
    } catch (err) {
      console.error("Failed to submit engagement survey:", err);
      toast.error("An error occurred while submitting the survey.");
    }
  };

  const handleSubmitLookBeyond = async (surveyDate, responses) => {
    try {
      const res = await fetch(`/api/fellows/${profile.fellow.id}/look-beyond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ surveyDate, responses })
      });
      const json = await res.json();
      if (json.success) {
        setLookBeyondSurveys((prev) => [json.data, ...prev]);
        setShowLookBeyondForm(false);
        toast.success("Look Beyond survey submitted successfully!");
      } else {
        toast.error(json.error || "Failed to submit survey");
      }
    } catch (err) {
      console.error("Failed to submit look beyond survey:", err);
      toast.error("An error occurred while submitting the survey.");
    }
  };

  const handleSavePersonalDetails = async (payload) => {
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Failed to update profile");
        throw new Error(json.error || "Failed to update profile");
      }

      setProfile(json.data);
      setShowPersonalDetailsForm(false);

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const cached = JSON.parse(decodeURIComponent(atob(storedUser)));
          cached.name = json.data.name;
          cached.email = json.data.email;
          if (json.data.fellow) {
            cached.fellowName = json.data.fellow.name;
            cached.avatar = json.data.fellow.avatar || json.data.avatar || cached.avatar;
          } else {
            cached.avatar = json.data.avatar || cached.avatar;
          }
          localStorage.setItem("user", btoa(encodeURIComponent(JSON.stringify(cached))));
        } catch (e) {
          console.error("Failed to sync cache", e);
        }
      }

      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Update personal details error:", err);
      throw err;
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
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItemId) return;
    try {
      const fellowId = profile.fellow.id;
      const res = await fetch(`/api/fellows/${fellowId}/goal-sheets/${deleteItemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setGoalSheets((prev) => prev.filter((s) => s.id !== deleteItemId));
        toast.success("Goal sheet deleted successfully!");
      } else {
        toast.error(json.error || "Failed to delete goal sheet");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting the goal sheet.");
    }
    setDeleteModalOpen(false);
    setDeleteItemId(null);
  };

  if (isInitializing || loading) {
    return (
      <div className="p-8 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-on-surface-variant font-medium">
        Please log in to view your profile settings.
      </div>
    );
  }

  const avatarUrl = profile.fellow?.avatar || profile.avatar || "";
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const assignedSchool = isFellow && profile.fellow.schools && profile.fellow.schools.length > 0 ? profile.fellow.schools[0].school : null;
  const afterSchoolCentres = isFellow && profile.fellow.afterSchoolCentres ? profile.fellow.afterSchoolCentres.map(fc => fc.centre) : [];
  const fellowSchools = isFellow && profile.fellow.schools ? profile.fellow.schools.map((item) => item.school) : [];
  const fellowPrograms = isFellow && profile.fellow.livelihoodPrograms
    ? profile.fellow.livelihoodPrograms.map((item) => item.program)
    : [];

  const managedSchools = (profile.managedSchools || []).map((m) => m.school);
  const managedCentres = (profile.managedCentres || []).map((m) => m.centre);
  const managedPrograms = (profile.managedLivelihoodPrograms || []).map((m) => m.program);
  const canEditAssignments = isFellow
    ? currentUser?.roleName === "ADMIN" ||
      (PROGRAM_ROLES.includes(currentUser?.roleName) && can("education", "WRITE"))
    : currentUser?.roleName === "ADMIN" && PROGRAM_ROLES.includes(profile.role?.name);
  const personalDob = profile.fellow?.dob || profile.dob;
  const personalGender = profile.fellow?.gender || profile.gender;
  const personalAddress = profile.fellow?.address || profile.address;
  const memberSince = formatDate(profile.createdAt);
  const personalProfile = {
    ...profile,
    mobile: profile.mobile || profile.fellow?.phone,
    dob: personalDob,
    gender: personalGender,
    address: personalAddress,
    avatar: avatarUrl,
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 pb-24 overflow-x-hidden max-w-7xl mx-auto w-full">
      {/* Profile Title */}
      <div className="mb-6">
        <h2 className="page-title text-on-surface mb-3">
          My Profile settings
        </h2>
        <p className="text-sm font-medium text-on-surface-variant max-w-2xl leading-relaxed">
          Manage your account profile, personal placement settings, and track classroom indicators.
        </p>
      </div>

      {/* Hero Card */}
      <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-8 shadow-ambient border border-surface-container-low mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-bl-full blur-3xl -mr-10 -mt-10 duration-700"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shrink-0 border-4 border-surface shadow-md bg-surface-container-high flex items-center justify-center">
                <Avatar
                  src={avatarUrl}
                  name={profile.name}
                  fallback={initials}
                  className="w-full h-full object-cover cursor-pointer"
                  fallbackClassName="text-3xl font-bold font-headline text-on-surface-variant"
                  onClick={() => setLightboxPhoto(avatarUrl)}
                />
              </div>
              <div className="text-center md:text-left pt-2 min-w-0">
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-2">
                  <h2 className="page-title text-on-surface capitalize break-words">
                    {profile.name}
                  </h2>
                  <span className="bg-primary-fixed text-on-primary-fixed text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    {formatRoleLabel(profile.role?.name)}
                  </span>
                </div>
                <p className="text-on-surface-variant font-medium mb-3 flex flex-wrap justify-center md:justify-start items-center gap-2 break-words">
                  <span className="material-symbols-outlined text-sm text-primary">mail</span>
                  <span className="break-all">{profile.email}</span>
                  {profile.mobile && (
                    <>
                      <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                      <span className="material-symbols-outlined text-sm text-primary">phone</span>
                      {profile.mobile}
                    </>
                  )}
                </p>
                {isFellow && (
                  <div className="text-xs font-medium text-slate-500 font-sans flex flex-wrap justify-center md:justify-start gap-4">
                    <div>
                      <span className="font-bold text-on-surface">District:</span> {profile.fellow.address || "Kalgachia, Assam"}
                    </div>
                    <span className="w-1 h-1 bg-surface-container-highest rounded-full self-center"></span>
                    <div>
                      <span className="font-bold text-on-surface">School Placement:</span> {assignedSchool ? assignedSchool.name : "Unassigned"}
                    </div>
                    <span className="w-1 h-1 bg-surface-container-highest rounded-full self-center"></span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-on-surface">After School Centres:</span>
                      {afterSchoolCentres.length > 0 ? (
                        afterSchoolCentres.map((c, i) => (
                          <span key={c.id}>
                            {i > 0 && <span className="mr-1">,</span>}
                            <Link href={`/education/after-school-centres/${c.id}`} className="text-primary hover:underline">
                              {c.name}
                            </Link>
                          </span>
                        ))
                      ) : (
                        <span>None</span>
                      )}
                    </div>
                  </div>
                )}
                {!isFellow && (
                  <div className="text-xs font-medium text-slate-500 font-sans flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2">
                    {profile.department && (
                      <>
                        <div>
                          <span className="font-bold text-on-surface">Department:</span> {profile.department}
                        </div>
                        <span className="w-1 h-1 bg-surface-container-highest rounded-full self-center"></span>
                      </>
                    )}
                    <div>
                      <span className="font-bold text-on-surface">Date of Birth:</span>{" "}
                      {formatDate(personalDob)}
                    </div>
                    <span className="w-1 h-1 bg-surface-container-highest rounded-full self-center"></span>
                    <div>
                      <span className="font-bold text-on-surface">Gender:</span> {personalGender || "—"}
                    </div>
                    <span className="w-1 h-1 bg-surface-container-highest rounded-full self-center"></span>
                    <div>
                      <span className="font-bold text-on-surface">Address:</span> {personalAddress || "—"}
                    </div>
                    <span className="w-1 h-1 bg-surface-container-highest rounded-full self-center"></span>
                    <div>
                      <span className="font-bold text-on-surface">Member Since:</span> {memberSince}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowPersonalDetailsForm(true)}
              className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20 shrink-0 self-center md:self-start mt-4 md:mt-0"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit Profile
            </button>
            {profile.role?.name === "FELLOW" && (
              <button
                onClick={() => setShowPDFModal(true)}
                className="bg-surface-container text-on-surface px-4 py-2 rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20 shrink-0 self-center md:self-start mt-4 md:mt-0"
              >
                <span className="material-symbols-outlined text-[18px]">book</span>
                Learning Framework
              </button>
            )}
          </div>


            </div>

      {/* Tabbed profile for non-fellow roles */}
      {!isFellow && (
        <>
          <div className="md:hidden mb-6 font-sans">
            <label htmlFor="staff-profile-tab" className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              Profile section
            </label>
            <select
              id="staff-profile-tab"
              value={activeTab}
              onChange={(e) => {
                const nextTab = staffTabs.find((tab) => tab.label === e.target.value);
                router.replace(`/profile?tab=${nextTab?.slug || "personal-details"}`, { scroll: false });
              }}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm font-semibold text-on-surface outline-none focus:border-primary"
            >
              {staffTabs.map((tab) => (
                <option key={tab.slug} value={tab.label}>{tab.label}</option>
              ))}
            </select>
          </div>

          <div ref={tabsContainerRef} className="hidden md:flex border-b border-surface-container-highest mb-8 overflow-x-auto no-scrollbar font-sans">
            {staffTabs.map((tab) => {
              const isActive = activeTab === tab.label;
              return (
                <button
                  key={tab.slug}
                  ref={isActive ? setActiveTabRef : null}
                  onClick={() => router.replace(`/profile?tab=${tab.slug}`, { scroll: false })}
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

          <div className="min-w-0">
            {activeTab === "Personal Details" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowPersonalDetailsForm(true)}
                    className="w-full sm:w-auto justify-center bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors shadow-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Edit Personal Details
                  </button>
                </div>
                <BasicDetailsView person={profile} />
              </div>
            )}
            {activeTab === "Monthly Planner" && (
              <MonthlyPlanner userId={profile.id} />
            )}
            {activeTab === "Assignments" && profile.role?.name !== "ADMIN" && (
              <AssignmentsSection
                title="Assignments"
                userId={profile.id}
                schools={managedSchools}
                centres={managedCentres}
                programs={managedPrograms}
                canEdit={canEditAssignments}
              />
            )}
            {activeTab === "Team CheckIn" && (
              <TeamCheckInSection
                userId={profile.id}
                memberName={profile.name}
                memberRole={profile.role?.name}
                memberManagerId={profile.managerId}
              />
            )}
          </div>
        </>
      )}

      {/* Render tab views for fellow role only */}
      {isFellow && (
        <>
          {/* Placement Summary */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient border border-outline-variant/10 mb-8">
            <h3 className="font-headline font-bold text-base text-on-surface mb-4">Placement Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 font-sans text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-on-surface-variant uppercase tracking-wide">Active Placement</span>
                <span className="font-semibold text-on-surface">{assignedSchool ? assignedSchool.name : "Unassigned"}</span>
              </div>
              {afterSchoolCentres.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-on-surface-variant uppercase tracking-wide">After School Centres</span>
                  <span className="font-semibold text-on-surface">{afterSchoolCentres.length}</span>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-on-surface-variant uppercase tracking-wide">Class Grades</span>
                <span className="font-semibold text-on-surface">Grade 3, Grade 4</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-on-surface-variant uppercase tracking-wide">Assigned Students</span>
                <span className="font-semibold text-on-surface">{profile.fellow.students ? profile.fellow.students.length : 0} Students</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-on-surface-variant uppercase tracking-wide">Evaluation Rating</span>
                <span className="font-semibold text-primary">{profile.fellow.evaluationRating || "4.8"} / 5.0</span>
              </div>
            </div>
          </div>

          {/* Mobile tab selector */}
          <div className="md:hidden mb-6 font-sans">
            <label htmlFor="profile-tab" className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              Profile section
            </label>
            <select
              id="profile-tab"
              value={activeTab}
              onChange={(e) => router.replace(`/profile?tab=${FELLOW_TABS.find((t) => t.label === e.target.value)?.slug || ""}`, { scroll: false })}
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
                  onClick={() => router.replace(`/profile?tab=${tab.slug}`, { scroll: false })}
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

          <div className="min-w-0">
              {activeTab === "Personal Details" && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowPersonalDetailsForm(true)}
                      className="w-full sm:w-auto justify-center bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors shadow-md cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Edit Personal Details
                    </button>
                  </div>
                  <BasicDetailsView
                    person={{
                      ...profile,
                      mobile: profile.mobile || profile.fellow?.phone,
                      dob: personalDob,
                      gender: personalGender,
                      address: personalAddress,
                    }}
                  />
                </div>
              )}
              {activeTab === "Monthly Planner" && (
                <MonthlyPlanner fellowId={profile.fellow.id} />
              )}
              {activeTab === "Assignments" && (
                <AssignmentsSection
                  title="Assignments"
                  isFellow
                  fellowId={profile.fellow.id}
                  userId={profile.id}
                  schools={fellowSchools}
                  centres={afterSchoolCentres}
                  programs={fellowPrograms}
                  canEdit={canEditAssignments}
                  canEditLivelihoodPrograms={currentUser?.roleName === "ADMIN"}
                />
              )}
              {activeTab === "Goals" && (
                <div className="space-y-6">
                  <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                    <h3 className="font-headline font-bold text-xl text-on-surface">Goal Sheets</h3>
                    <button
                      onClick={() => {
                        setEditingGoalSheet(null);
                        setShowGoalSheetForm(true);
                      }}
                      className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors shadow-md cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Create New Goal Sheet
                    </button>
                  </div>

                  {goalSheets.length === 0 ? (
                    <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-outline-variant/10 text-on-surface-variant">
                      No goal sheets yet. Click "Create New Goal Sheet" to start.
                    </div>
                  ) : (
                    goalSheets.map((sheet) => (
                      <div key={sheet.id} className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 relative group hover:border-primary/30 transition-colors">
                        <div className="flex flex-wrap justify-between items-start gap-3">
                          <button
                            onClick={() => {
                              setEditingGoalSheet(sheet);
                              setShowGoalSheetForm(true);
                            }}
                            className="text-left flex-1 cursor-pointer"
                          >
                            <h3 className="font-headline font-bold text-lg text-on-surface flex items-center gap-2">
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
                            {canDeleteRecords && (
                              <button
                                onClick={() => handleDeleteGoalSheet(sheet.id)}
                                className="text-on-surface-variant hover:text-red-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
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
                </div>
              )}

              {activeTab === "Coaching & Classroom Observation" && (
                <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-headline font-bold text-xl text-on-surface">Coaching & Classroom Observation Records</h3>
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
                                {formatDate(record.date)}
                              </p>
                            </div>
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
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-blue-600 font-semibold transition-colors max-w-full"
                                >
                                  <span className="material-symbols-outlined text-[16px] shrink-0">attach_file</span>
                                  <span className="truncate">{record.fileUrl.split("/").pop()}</span>
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
                  {showEngagementForm ? (
                    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
                      <EngagementSurveyForm
                        onSubmit={handleSubmitEngagementSurvey}
                        onCancel={() => setShowEngagementForm(false)}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap justify-between items-center gap-3">
                        <h3 className="font-headline font-bold text-xl text-on-surface">Engagement Survey</h3>
                        <button
                          onClick={() => setShowEngagementForm(true)}
                          className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors shadow-md cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          Fill Engagement Survey
                        </button>
                      </div>

                      {engagementSurveys.length === 0 ? (
                        <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-outline-variant/10 text-on-surface-variant">
                          No engagement surveys submitted yet. Click &ldquo;Fill Engagement Survey&rdquo; to complete your first survey.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {engagementSurveys.map((survey) => (
                            <div key={survey.id} className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient border border-outline-variant/10 flex justify-between items-center gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-on-surface text-sm">Engagement Survey</p>
                                <p className="text-xs text-on-surface-variant mt-1">
                                  {formatDate(survey.surveyDate)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => exportEngagementSurveyPdf(survey, profile.fellow?.name)}
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
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === "Look Beyond Survey" && (
                <div className="space-y-6">
                  {showLookBeyondForm ? (
                    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10">
                      <LookBeyondSurveyForm
                        onSubmit={handleSubmitLookBeyond}
                        onCancel={() => setShowLookBeyondForm(false)}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap justify-between items-center gap-3">
                        <h3 className="font-headline font-bold text-xl text-on-surface">Look Beyond Survey</h3>
                        <button
                          onClick={() => setShowLookBeyondForm(true)}
                          className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors shadow-md cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          Fill Look Beyond Survey
                        </button>
                      </div>

                      {lookBeyondSurveys.length === 0 ? (
                        <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-outline-variant/10 text-on-surface-variant">
                          No Look Beyond surveys submitted yet. Click &ldquo;Fill Look Beyond Survey&rdquo; to complete your first survey.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {lookBeyondSurveys.map((survey) => (
                            <div key={survey.id} className="bg-surface-container-lowest rounded-xl p-5 shadow-ambient border border-outline-variant/10 flex justify-between items-center gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-on-surface text-sm">Look Beyond Survey</p>
                                <p className="text-xs text-on-surface-variant mt-1">
                                  {formatDate(survey.surveyDate)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => exportLookBeyondSurveyPdf(survey, profile.fellow?.name)}
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
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === "Individual Feedback Tracking" && (
                <IndividualFeedbackView
                  fellowId={profile.fellow.id}
                  token={token}
                  canManage={false}
                />
              )}

          </div>

          {/* Goal Sheet Form Modal */}
          {showGoalSheetForm && (
            <GoalSheetForm
              fellowId={profile.fellow.id}
              sheetData={editingGoalSheet}
              isManager={false}
              token={token}
              onClose={() => {
                setShowGoalSheetForm(false);
                setEditingGoalSheet(null);
              }}
              onSave={(updatedSheet) => {
                handleGoalSheetSaved(updatedSheet);
                setShowGoalSheetForm(false);
                setEditingGoalSheet(null);
              }}
            />
          )}
        </>
      )}

      {showPersonalDetailsForm && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-surface-container-lowest rounded-t-2xl sm:rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-surface-container-lowest flex items-start justify-between gap-4 p-4 sm:p-6 border-b border-surface-container">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-on-surface">Edit Personal Details</h3>
                <p className="text-xs text-on-surface-variant mt-1 truncate">{profile.name}</p>
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
                person={personalProfile}
                avatarUploadUrl={`/api/users/${profile.id}/avatar`}
                onSubmit={handleSavePersonalDetails}
                onCancel={() => setShowPersonalDetailsForm(false)}
                onAvatarUpdated={(url) => {
                  setProfile((prev) => (prev ? {
                    ...prev,
                    avatar: url,
                    fellow: prev.fellow ? { ...prev.fellow, avatar: url } : prev.fellow,
                  } : prev));
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

      <PhotoLightbox src={lightboxPhoto} alt="Profile photo" onClose={() => setLightboxPhoto(null)} />
    </div>
  );
}
