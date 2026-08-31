"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import GoalSheetForm from "@/components/GoalSheetForm";
import { useToast } from "@/context/ToastContext";
import MonthlyPlanner from "@/components/MonthlyPlanner";
import EngagementSurveyForm from "@/components/EngagementSurveyForm";
import EngagementSurveyViewer from "@/components/EngagementSurveyViewer";
import LookBeyondSurveyForm from "@/components/LookBeyondSurveyForm";
import LookBeyondSurveyViewer from "@/components/LookBeyondSurveyViewer";
import dynamic from "next/dynamic";

const PDFViewerModal = dynamic(() => import("@/components/PDFViewerModal"), { ssr: false });

export default function ProfilePage() {
  const { token, isInitializing } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

  // Fellow specific dashboard states
  const [goalSheets, setGoalSheets] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [coachingRecords, setCoachingRecords] = useState([]);
  const [engagementSurveys, setEngagementSurveys] = useState([]);
  const [lookBeyondSurveys, setLookBeyondSurveys] = useState([]);
  const [activeTab, setActiveTab] = useState("Goals");
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
          
          // Populate edit form states
          setEditName(userProfile.name || "");
          setEditEmail(userProfile.email || "");
          setEditMobile(userProfile.mobile || "");
          
          if (userProfile.fellow) {
            setEditAddress(userProfile.fellow.address || "");
            setEditGender(userProfile.fellow.gender || "");
            setEditDob(userProfile.fellow.dob ? userProfile.fellow.dob.split("T")[0] : "");
            setEditAvatar(userProfile.fellow.avatar || "");

            const fellowId = userProfile.fellow.id;
            const detailRes = await fetch(`/api/fellows/${fellowId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const detailJson = await detailRes.json();
            if (detailJson.success) {
              setGoalSheets(detailJson.data.goalSheets || []);
              setReviews(detailJson.data.reviews || []);
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
    if (activeTab === "Coaching & Training") {
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          mobile: editMobile,
          address: profile.fellow ? editAddress : undefined,
          gender: profile.fellow ? editGender : undefined,
          dob: profile.fellow ? editDob : undefined,
          avatar: profile.fellow ? editAvatar : undefined
        })
      });
      const json = await res.json();
      if (json.success) {
        setProfile(json.data);
        setIsEditing(false);
        // Sync local storage user cache
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const cached = JSON.parse(decodeURIComponent(atob(storedUser)));
            cached.name = json.data.name;
            cached.email = json.data.email;
            if (json.data.fellow) {
              cached.fellowName = json.data.fellow.name;
            }
            localStorage.setItem("user", btoa(encodeURIComponent(JSON.stringify(cached))));
          } catch (e) {
            console.error("Failed to sync cache", e);
          }
        }
        toast.success("Profile updated successfully!");
      } else {
        toast.error(json.error || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating profile");
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

  const isFellow = !!profile.fellow;
  const avatarUrl = isFellow ? profile.fellow.avatar : "";
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const assignedSchool = isFellow && profile.fellow.schools && profile.fellow.schools.length > 0 ? profile.fellow.schools[0].school : null;

  return (
    <div className="p-6 md:p-10 pb-24 overflow-x-hidden max-w-7xl mx-auto w-full">
      {/* Profile Title */}
      <div className="mb-6">
        <h2 className="text-[2.75rem] font-headline font-black text-on-surface tracking-[-0.02em] leading-none mb-3">
          My Profile settings
        </h2>
        <p className="text-sm font-medium text-on-surface-variant max-w-2xl leading-relaxed">
          Manage your account profile, personal placement settings, and track classroom indicators.
        </p>
      </div>

      {/* Hero Card & Edit Profile Form */}
      <div className="bg-surface-container-lowest rounded-xl p-8 shadow-ambient border border-surface-container-low mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-bl-full blur-3xl -mr-10 -mt-10 duration-700"></div>
        
        {!isEditing ? (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shrink-0 border-4 border-surface shadow-md bg-surface-container-high flex items-center justify-center">
                {avatarUrl ? (
                  <img alt="avatar" className="w-full h-full object-cover" src={avatarUrl} />
                ) : (
                  <span className="text-3xl font-bold font-headline text-on-surface-variant">{initials}</span>
                )}
              </div>
              <div className="text-center md:text-left pt-2">
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-2">
                  <h2 className="text-3xl font-headline font-black text-on-surface capitalize">
                    {profile.name}
                  </h2>
                  <span className="bg-primary-fixed text-on-primary-fixed text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    {profile.role?.name || "User"}
                  </span>
                </div>
                <p className="text-on-surface-variant font-medium mb-3 flex justify-center md:justify-start items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">mail</span>
                  {profile.email}
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
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-primary hover:bg-primary-container text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20 shrink-0 self-center md:self-start mt-4 md:mt-0"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit Profile
            </button>
            {profile.role?.name === "FELLOW" && (
              <button
                onClick={() => setShowPDFModal(true)}
                className="bg-surface-container text-on-surface px-6 py-2.5 rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer border border-outline-variant/20 shrink-0 self-center md:self-start mt-4 md:mt-0"
              >
                <span className="material-symbols-outlined text-[18px]">book</span>
                Learning Framework
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile} className="relative z-10 space-y-6 font-sans text-sm">
            <h3 className="text-lg font-bold text-on-surface mb-4">Edit Profile details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mobile / Phone</label>
                <input
                  type="text"
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              {isFellow && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">District / Address</label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Gender</label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent dark:bg-slate-900 text-on-surface"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date of Birth</label>
                    <input
                      type="date"
                      value={editDob}
                      onChange={(e) => setEditDob(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                    />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Avatar URL</label>
                    <input
                      type="text"
                      value={editAvatar}
                      placeholder="https://example.com/avatar.png"
                      onChange={(e) => setEditAvatar(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
              )}

              {activeTab === "Coaching & Training" && (
                <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-headline font-bold text-xl text-on-surface">Coaching & Training Records</h3>
                  </div>
                  <div className="space-y-6">
                    {coachingRecords.length === 0 ? (
                      <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-outline-variant/10 text-on-surface-variant">
                        No coaching or training records available yet.
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

            </div>

      {/* Render tab views for fellow role only */}
      {isFellow && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-surface-container-highest mb-8 overflow-x-auto no-scrollbar font-sans">
            {["Monthly Planner", "Goals", "Performance Dashboard", "6-Month Progress Reviews", "Coaching & Training", "Engagement Survey", "Look Beyond Survey"].map((tab) => {
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {activeTab === "Monthly Planner" && (
                <MonthlyPlanner fellowId={profile.fellow.id} />
              )}
              {activeTab === "Goals" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
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
                        <div className="flex justify-between items-start gap-4">
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
                            <button
                              onClick={() => handleDeleteGoalSheet(sheet.id)}
                              className="text-on-surface-variant hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
                        <span className="text-primary">+{profile.fellow.progress || 34}% Progress</span>
                      </div>
                      <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden relative">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${profile.fellow.progress || 34}%` }}></div>
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

              {activeTab === "6-Month Progress Reviews" && (
                <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 space-y-6">
                  <h3 className="font-headline font-bold text-xl text-on-surface">6-Month Comprehensive Evaluations</h3>
                  <div className="space-y-6">
                    {(reviews.length > 0 ? reviews : [
                      {
                        id: "default-1",
                        period: "Mid-Cohort Review (Period: Jan - Jun)",
                        evaluation: profile.name + " has demonstrated exceptional lesson planning capabilities. Her implementation of the interactive phonics cards resulted in standard 3 reading scores increasing by 34% in 4 months. She maintains robust communications logs with the school headmasters and has successfully normalized PTA assemblies.",
                        rating: 4.8,
                        reviewerName: "Sarah Jenkins (Operations Lead)",
                        date: "2026-06-22",
                        status: "Completed"
                      }
                    ]).map((rev) => (
                      <div key={rev.id} className="p-5 border border-surface-container rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-on-surface">{rev.period}</h4>
                          <span className="text-xs font-bold text-primary bg-primary-container/10 px-2 py-1 rounded">{rev.status}</span>
                        </div>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                          "{rev.evaluation}"
                        </p>
                        <div className="mt-4 flex gap-4 text-xs text-slate-400 font-sans">
                          <div>Reviewed by: <span className="font-bold text-on-surface">{rev.reviewerName}</span></div>
                          <div>Date: {new Date(rev.date).toLocaleDateString()}</div>
                          {rev.rating && <div>Rating: <span className="font-bold text-primary">{rev.rating} / 5.0</span></div>}
                        </div>
                      </div>
                    ))}
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
                      <div className="flex justify-between items-center">
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
                      <div className="flex justify-between items-center">
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
                    </>
                  )}
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
                    <span className="font-semibold text-on-surface">{assignedSchool ? assignedSchool.name : "Unassigned"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-surface-container">
                    <span className="text-on-surface-variant">Class Grades</span>
                    <span className="font-semibold text-on-surface">Grade 3, Grade 4</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-surface-container">
                    <span className="text-on-surface-variant">Assigned Students</span>
                    <span className="font-semibold text-on-surface">{profile.fellow.students ? profile.fellow.students.length : 0} Students</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-surface-container">
                    <span className="text-on-surface-variant">Evaluation Rating</span>
                    <span className="font-semibold text-primary">{profile.fellow.evaluationRating || "4.8"} / 5.0</span>
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
    </div>
  );
}
