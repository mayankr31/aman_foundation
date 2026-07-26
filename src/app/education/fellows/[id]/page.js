"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import { useToast } from "@/context/ToastContext";
import MonthlyPlanner from "@/components/MonthlyPlanner";

export default function FellowProfileDetail() {
  const { id } = useParams();
  const { token, user, isInitializing } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [fellow, setFellow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [coachingRecords, setCoachingRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("Goals");

  // Form states for adding new goals
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTargetDate, setNewGoalTargetDate] = useState("");
  const [newGoalMilestones, setNewGoalMilestones] = useState([""]);

  // Form states for adding new reviews
  const [editingReviewGoalId, setEditingReviewGoalId] = useState(null);
  const [reviewText, setReviewText] = useState("");

  // Form states for 6-month evaluations reviews
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [newReviewPeriod, setNewReviewPeriod] = useState("");
  const [newReviewRating, setNewReviewRating] = useState("");
  const [newReviewerName, setNewReviewerName] = useState("");
  const [newReviewEvaluation, setNewReviewEvaluation] = useState("");

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [deleteItemType, setDeleteItemType] = useState(""); // "goal" | "review"

  // Coaching & Training modal states
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
          setGoals(json.data.goals || []);
          setReviews(json.data.reviews || []);
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
    if (activeTab === "Coaching & Training" && token && id) {
      loadCoachingRecords();
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

  const toggleMilestone = async (goalId, milestoneId, currentDone) => {
    const newDone = !currentDone;
    
    // Update local state first for instant responsiveness
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
      await fetch(`/api/fellows/${id}/goals`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          type: "TOGGLE_MILESTONE",
          milestoneId,
          done: newDone
        })
      });
    } catch (err) {
      console.error("Failed to persist milestone toggle:", err);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle) return;

    try {
      const filteredMilestones = newGoalMilestones.filter(m => m.trim() !== "");
      const res = await fetch(`/api/fellows/${id}/goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
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
      console.error("Failed to add goal:", err);
      toast.error("An error occurred while creating the goal.");
    }
  };

  const handleDeleteGoal = (goalId) => {
    setDeleteItemId(goalId);
    setDeleteItemType("goal");
    setDeleteModalOpen(true);
  };

  const handleSaveReview = async (goalId) => {
    try {
      const res = await fetch(`/api/fellows/${id}/goals`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: "UPDATE_REVIEW",
          goalId,
          review: reviewText
        })
      });
      const json = await res.json();
      if (json.success) {
        // Update local state
        const updated = goals.map((goal) => {
          if (goal.id === goalId) {
            return { ...goal, review: reviewText };
          }
          return goal;
        });
        setGoals(updated);
        setEditingReviewGoalId(null);
        setReviewText("");
        toast.success("Progress review updated successfully!");
      } else {
        toast.error(json.error || "Failed to save review");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving the review.");
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/fellows/${id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          period: newReviewPeriod,
          rating: newReviewRating ? parseFloat(newReviewRating) : null,
          reviewerName: newReviewerName,
          evaluation: newReviewEvaluation
        })
      });
      const json = await res.json();
      if (json.success) {
        setReviews(prev => [json.data, ...prev]);
        setNewReviewPeriod("");
        setNewReviewRating("");
        setNewReviewerName("");
        setNewReviewEvaluation("");
        setShowAddReviewModal(false);
        toast.success("Evaluation review saved successfully!");
      } else {
        toast.error(json.error || "Failed to save evaluation");
      }
    } catch (err) {
      toast.error("An error occurred while saving the evaluation.");
    }
  };

  const handleDeleteReview = (reviewId) => {
    setDeleteItemId(reviewId);
    setDeleteItemType("review");
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItemId) return;

    if (deleteItemType === "goal") {
      try {
        const res = await fetch(`/api/fellows/${id}/goals?goalId=${deleteItemId}`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (json.success) {
          setGoals(prev => prev.filter(g => g.id !== deleteItemId));
          toast.success("Goal deleted successfully!");
        } else {
          toast.error(json.error || "Failed to delete goal");
        }
      } catch (err) {
        console.error("Failed to delete goal:", err);
        toast.error("An error occurred while deleting the goal.");
      }
    } else if (deleteItemType === "review") {
      try {
        const res = await fetch(`/api/fellows/${id}/reviews?reviewId=${deleteItemId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setReviews(prev => prev.filter(r => r.id !== deleteItemId));
          toast.success("Evaluation review deleted successfully!");
        } else {
          toast.error(json.error || "Failed to delete review");
        }
      } catch (err) {
        console.error(err);
        toast.error("An error occurred while deleting the review.");
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
          <button className="bg-gradient-to-br from-primary to-primary-container text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Presentation Report
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-surface-container-highest mb-8 overflow-x-auto no-scrollbar font-sans">
        {["Monthly Planner", "Goals", "Performance Dashboard", "6-Month Progress Reviews", "Coaching & Training"].map((tab) => {
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
          {activeTab === "Monthly Planner" && (
            <MonthlyPlanner fellowId={fellow.id} />
          )}
          {activeTab === "Goals" && (
            <div className="space-y-6">
              {/* Goals Tab Header */}
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
                  No learning goals have been set yet. Click "Add New Goal" to start.
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
                            className="text-on-surface-variant hover:text-red-600 transition-colors ml-2"
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

                    {/* Review Outcome & Editor */}
                    <div className="mt-6 p-4 bg-surface-container-low rounded-lg relative group/review font-sans">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Progress Review</p>
                        {user?.roleName === "ADMIN" && (
                          <button
                            onClick={() => {
                              setEditingReviewGoalId(g.id);
                              setReviewText(g.review || "");
                            }}
                            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">edit</span>
                            {g.review ? "Edit Review" : "Write Review"}
                          </button>
                        )}
                      </div>
                      
                      {editingReviewGoalId === g.id ? (
                        <div className="space-y-3 mt-2">
                          <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="Write your progress review here..."
                            className="w-full p-3 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-sm text-on-surface"
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingReviewGoalId(null)}
                              className="px-3 py-1.5 rounded-full border border-outline-variant text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveReview(g.id)}
                              className="px-4 py-1.5 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                            >
                              Save Review
                            </button>
                          </div>
                        </div>
                      ) : (
                        g.review ? (
                          <p className="text-sm text-on-surface leading-relaxed">{g.review}</p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No review submitted yet.</p>
                        )
                      )}
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

          {activeTab === "6-Month Progress Reviews" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline font-bold text-xl text-on-surface">6-Month Comprehensive Evaluations</h3>
                {user?.roleName === "ADMIN" && (
                  <button
                    onClick={() => setShowAddReviewModal(true)}
                    className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors shadow-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Add Evaluation Review
                  </button>
                )}
              </div>
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-outline-variant/10 text-on-surface-variant">
                    No progress evaluations have been added yet. Click "Add Evaluation Review" to start.
                  </div>
                ) : (
                  reviews.map((rev) => (
                  <div key={rev.id} className="p-5 border border-surface-container rounded-lg relative group/review-card font-sans">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-on-surface flex items-center gap-2">
                        {rev.period}
                        {user?.roleName === "ADMIN" && rev.id !== "default-1" && (
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="text-on-surface-variant hover:text-red-600 transition-colors ml-2"
                            title="Delete evaluation review"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </h4>
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
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "Coaching & Training" && (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-outline-variant/10 space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline font-bold text-xl text-on-surface">Coaching & Training Records</h3>
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
                <span className="font-semibold text-on-surface">{fellow.students ? fellow.students.length : 0} Students</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-container">
                <span className="text-on-surface-variant">Evaluation Rating</span>
                <span className="font-semibold text-primary">{fellow.evaluationRating || "4.8"} / 5.0</span>
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
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
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
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
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
                        className="text-red-500 hover:text-red-700"
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
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 transition-colors cursor-pointer"
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
      {/* Add Evaluation Review Modal */}
      {showAddReviewModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Add 6-Month Progress Evaluation</h3>
              <button
                onClick={() => setShowAddReviewModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleAddReview} className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Evaluation Period
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Cohort Review (Period: Jan - Jun)"
                  value={newReviewPeriod}
                  onChange={(e) => setNewReviewPeriod(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Rating (optional, 1.0 to 5.0)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  placeholder="e.g. 4.8"
                  value={newReviewRating}
                  onChange={(e) => setNewReviewRating(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Reviewer Name & Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins (Operations Lead)"
                  value={newReviewerName}
                  onChange={(e) => setNewReviewerName(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Evaluation Comments
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide details about the fellow's performance..."
                  value={newReviewEvaluation}
                  onChange={(e) => setNewReviewEvaluation(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddReviewModal(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                >
                  Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddCoachingModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 font-sans">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Add Coaching & Training Record</h3>
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
        title={deleteItemType === "goal" ? "Delete Goal" : "Delete Evaluation Review"}
        message={
          deleteItemType === "goal"
            ? "Are you sure you want to delete this goal? This action is permanent and cannot be undone."
            : "Are you sure you want to delete this evaluation review? This action is permanent and cannot be undone."
        }
      />
    </div>
  );
}
