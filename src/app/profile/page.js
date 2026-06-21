"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import { useToast } from "@/context/ToastContext";

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
  const [goals, setGoals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState("Goals");

  // Goals modal/form state
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTargetDate, setNewGoalTargetDate] = useState("");
  const [newGoalMilestones, setNewGoalMilestones] = useState([""]);

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

            // Fetch goals and reviews for fellow
            // We can resolve by userProfile.fellow.id
            const fellowId = userProfile.fellow.id;
            const detailRes = await fetch(`/api/fellows/${fellowId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const detailJson = await detailRes.json();
            if (detailJson.success) {
              setGoals(detailJson.data.goals || []);
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

  const toggleMilestone = async (goalId, milestoneId, currentDone) => {
    const newDone = !currentDone;
    const updated = goals.map((goal) => {
      if (goal.id === goalId) {
        const updatedMilestones = goal.milestones.map((m) => {
          if (m.id === milestoneId) return { ...m, done: newDone };
          return m;
        });
        return { ...goal, milestones: updatedMilestones };
      }
      return goal;
    });
    setGoals(updated);

    try {
      const fellowId = profile.fellow.id;
      await fetch(`/api/fellows/${fellowId}/goals`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: "TOGGLE_MILESTONE",
          milestoneId,
          done: newDone
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle) return;

    try {
      const fellowId = profile.fellow.id;
      const filteredMilestones = newGoalMilestones.filter(m => m.trim() !== "");
      const res = await fetch(`/api/fellows/${fellowId}/goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newGoalTitle,
          targetDate: newGoalTargetDate || null,
          milestones: filteredMilestones
        })
      });
      const json = await res.json();
      if (json.success) {
        setGoals(prev => [...prev, json.data]);
        setNewGoalTitle("");
        setNewGoalTargetDate("");
        setNewGoalMilestones([""]);
        setShowAddGoalModal(false);
        toast.success("Goal created successfully!");
      } else {
        toast.error(json.error || "Failed to create goal");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while creating the goal.");
    }
  };

  const handleDeleteGoal = (goalId) => {
    setDeleteItemId(goalId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItemId) return;
    try {
      const fellowId = profile.fellow.id;
      const res = await fetch(`/api/fellows/${fellowId}/goals?goalId=${deleteItemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setGoals(prev => prev.filter(g => g.id !== deleteItemId));
        toast.success("Goal deleted successfully!");
      } else {
        toast.error(json.error || "Failed to delete goal");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting the goal.");
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
      </div>

      {/* Render tab views for fellow role only */}
      {isFellow && (
        <>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {activeTab === "Goals" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-headline font-bold text-xl text-on-surface">Fellow Learning Goals</h3>
                    <button
                      onClick={() => setShowAddGoalModal(true)}
                      className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors shadow-md cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Add New Goal
                    </button>
                  </div>

                  {goals.length === 0 ? (
                    <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-outline-variant/10 text-on-surface-variant">
                      No learning goals set yet. Click "Add New Goal" to start.
                    </div>
                  ) : (
                    goals.map((g) => (
                      <div key={g.id} className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 relative group">
                        <div className="flex justify-between items-start mb-4 gap-4">
                          <div>
                            <h3 className="font-headline font-bold text-lg text-on-surface flex items-center gap-2">
                              {g.title}
                              <button
                                onClick={() => handleDeleteGoal(g.id)}
                                className="text-on-surface-variant hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2 animate-pulse"
                                title="Delete goal"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </h3>
                            <p className="text-xs text-on-surface-variant mt-1">
                              Target Date: {g.targetDate ? new Date(g.targetDate).toLocaleDateString() : "No date set"}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            g.status === "Completed" ? "bg-primary-fixed text-on-primary-fixed" :
                            g.status === "In Progress" ? "bg-secondary-container text-on-secondary-container" :
                            "bg-surface-variant text-on-surface-variant"
                          }`}>
                            {g.status}
                          </span>
                        </div>

                        {/* Milestones Checklist */}
                        <div className="space-y-3 pl-2 mt-4 border-l-2 border-surface-container">
                          <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-2">Goal Milestones</p>
                          {g.milestones && g.milestones.map((m) => (
                            <div
                              key={m.id}
                              onClick={() => toggleMilestone(g.id, m.id, m.done)}
                              className="flex items-center gap-3 cursor-pointer group/item"
                            >
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                m.done ? "bg-primary border-primary text-white" : "border-outline-variant group-hover/item:border-primary"
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
                        {g.review && (
                          <div className="mt-6 p-4 bg-surface-container-low rounded-lg">
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-1">Progress Review</p>
                            <p className="text-sm text-on-surface leading-relaxed">{g.review}</p>
                          </div>
                        )}
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

          {/* Add Goal Modal */}
          {showAddGoalModal && (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-on-surface">Add New Learning Goal</h3>
                  <button
                    onClick={() => setShowAddGoalModal(false)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <form onSubmit={handleAddGoal} className="space-y-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide font-headline">
                      Goal Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Conduct 5 remedial math sessions"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={newGoalTargetDate}
                      onChange={(e) => setNewGoalTargetDate(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Milestones
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewGoalMilestones([...newGoalMilestones, ""])}
                        className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        + Add Milestone
                      </button>
                    </div>
                    {newGoalMilestones.map((milestone, idx) => (
                      <div key={idx} className="flex gap-2 items-center mb-2">
                        <input
                          type="text"
                          required
                          placeholder={`Milestone #${idx + 1}`}
                          value={milestone}
                          onChange={(e) => {
                            const updated = [...newGoalMilestones];
                            updated[idx] = e.target.value;
                            setNewGoalMilestones(updated);
                          }}
                          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                        />
                        {newGoalMilestones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...newGoalMilestones];
                              updated.splice(idx, 1);
                              setNewGoalMilestones(updated);
                            }}
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddGoalModal(false)}
                      className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                    >
                      Create Goal
                    </button>
                  </div>
                </form>
              </div>
            </div>
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
        title="Delete Goal"
        message="Are you sure you want to delete this goal? This action is permanent and cannot be undone."
      />
    </div>
  );
}
