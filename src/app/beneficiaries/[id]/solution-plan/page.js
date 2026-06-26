"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";

export default function SolutionPlanPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const { token } = useAuth();
  const toast = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [priorities, setPriorities] = useState([
    {
      id: Date.now().toString(),
      name: "",
      activities: [
        { id: Date.now().toString() + "-a", activity: "", timeline: "", supportNeeded: "No", byWhom: "" }
      ]
    }
  ]);

  const addPriorityArea = () => {
    setPriorities([
      ...priorities,
      {
        id: Date.now().toString(),
        name: "",
        activities: [
          { id: Date.now().toString() + "-a", activity: "", timeline: "", supportNeeded: "No", byWhom: "" }
        ]
      }
    ]);
  };

  const removePriorityArea = (priorityId) => {
    setPriorities(priorities.filter(p => p.id !== priorityId));
  };

  const updatePriorityName = (priorityId, name) => {
    setPriorities(priorities.map(p => p.id === priorityId ? { ...p, name } : p));
  };

  const addActivity = (priorityId) => {
    setPriorities(priorities.map(p => {
      if (p.id === priorityId) {
        return {
          ...p,
          activities: [...p.activities, { id: Date.now().toString(), activity: "", timeline: "", supportNeeded: "No", byWhom: "" }]
        };
      }
      return p;
    }));
  };

  const removeActivity = (priorityId, activityId) => {
    setPriorities(priorities.map(p => {
      if (p.id === priorityId) {
        return {
          ...p,
          activities: p.activities.filter(a => a.id !== activityId)
        };
      }
      return p;
    }));
  };

  const updateActivity = (priorityId, activityId, field, value) => {
    setPriorities(priorities.map(p => {
      if (p.id === priorityId) {
        return {
          ...p,
          activities: p.activities.map(a => {
            if (a.id === activityId) {
              return { ...a, [field]: value };
            }
            return a;
          })
        };
      }
      return p;
    }));
  };

  const handleSubmit = async () => {
    // Basic validation
    const isEmpty = priorities.length === 0 || priorities.some(p => !p.name.trim() || p.activities.length === 0 || p.activities.some(a => !a.activity.trim()));
    if (isEmpty) {
      toast.error("Please ensure all Priority Areas and Activities have text entered before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { 
        planData: {
          numAreasPrioritized: priorities.length,
          priorities: priorities
        }
      };
      
      const res = await fetch(`/api/beneficiaries/${id}/solution-plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Solution Plan saved successfully!");
        router.push(`/beneficiaries/${id}`);
      } else {
        toast.error("Error saving solution plan: " + data.error);
      }
    } catch (error) {
      console.error("Submission failed", error);
      toast.error("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full font-sans">
      <Link href={`/beneficiaries/${id}`} className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity mb-6 w-fit font-bold text-sm">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Beneficiary Profile
      </Link>

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/10 overflow-hidden mb-8">
        <div className="bg-surface-container-low p-6 border-b border-outline-variant/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-headline text-on-surface">Solution Planning Questions</h1>
            <p className="text-sm text-on-surface-variant mt-2">
              Number of areas Prioritized: <span className="font-bold text-primary">{priorities.length}</span>
            </p>
          </div>
          <button 
            onClick={addPriorityArea}
            className="flex items-center gap-2 bg-secondary text-on-secondary px-4 py-2 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity whitespace-nowrap w-fit"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Add Priority Area
          </button>
        </div>

        <div className="p-6 space-y-8">
          {priorities.length === 0 && (
            <p className="text-center text-on-surface-variant italic py-8">No priority areas added yet. Click "Add Priority Area" to begin.</p>
          )}

          {priorities.map((priority, pIndex) => (
            <div key={priority.id} className="border border-surface-container-highest rounded-xl overflow-hidden">
              {/* Priority Header */}
              <div className="bg-primary/10 p-4 border-b border-surface-container-highest flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div className="flex-grow flex flex-col md:flex-row md:items-center gap-4">
                  <span className="font-bold whitespace-nowrap min-w-[140px]">
                    Q{pIndex + 2} - Priority {pIndex + 1}:
                  </span>
                  <input 
                    type="text" 
                    placeholder="Enter Priority Area (e.g. Cash Savings, Health Status)" 
                    value={priority.name}
                    onChange={(e) => updatePriorityName(priority.id, e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                {priorities.length > 1 && (
                  <button 
                    onClick={() => removePriorityArea(priority.id)}
                    className="text-error hover:bg-error/10 p-2 rounded-full transition-colors flex-shrink-0 self-end md:self-auto"
                    title="Remove Priority Area"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                )}
              </div>

              {/* Activities Table */}
              <div className="p-4 bg-surface-container-lowest overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr>
                      <th className="bg-surface-container-low border border-surface-container-highest p-3 text-xs font-bold uppercase tracking-wider w-[40%]">Key Activities planned</th>
                      <th className="bg-surface-container-low border border-surface-container-highest p-3 text-xs font-bold uppercase tracking-wider w-[20%]">Timeline</th>
                      <th className="bg-surface-container-low border border-surface-container-highest p-3 text-xs font-bold uppercase tracking-wider w-[15%] text-center">Support needed?</th>
                      <th className="bg-surface-container-low border border-surface-container-highest p-3 text-xs font-bold uppercase tracking-wider w-[20%]">By Whom</th>
                      <th className="bg-surface-container-low border border-surface-container-highest p-3 text-xs font-bold uppercase tracking-wider w-[5%] text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {priority.activities.map((activity, aIndex) => (
                      <tr key={activity.id}>
                        <td className="border border-surface-container-highest p-2 align-top">
                          <textarea 
                            placeholder="Describe activity..."
                            value={activity.activity}
                            onChange={(e) => updateActivity(priority.id, activity.id, "activity", e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded resize-y min-h-[60px] text-sm p-2 outline-none"
                          />
                        </td>
                        <td className="border border-surface-container-highest p-2 align-top">
                          <input 
                            type="text" 
                            placeholder="e.g. 3 Months"
                            value={activity.timeline}
                            onChange={(e) => updateActivity(priority.id, activity.id, "timeline", e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded text-sm p-2 outline-none"
                          />
                        </td>
                        <td className="border border-surface-container-highest p-2 align-top text-center">
                          <select 
                            value={activity.supportNeeded}
                            onChange={(e) => updateActivity(priority.id, activity.id, "supportNeeded", e.target.value)}
                            className="bg-surface-container border border-outline-variant/30 rounded text-sm p-2 outline-none focus:ring-1 focus:ring-primary w-full max-w-[100px] mx-auto"
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </td>
                        <td className="border border-surface-container-highest p-2 align-top">
                          <input 
                            type="text" 
                            placeholder="e.g. NGO, Self"
                            value={activity.byWhom}
                            onChange={(e) => updateActivity(priority.id, activity.id, "byWhom", e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded text-sm p-2 outline-none"
                            disabled={activity.supportNeeded === "No"}
                          />
                        </td>
                        <td className="border border-surface-container-highest p-2 align-top text-center">
                          {priority.activities.length > 1 && (
                            <button 
                              onClick={() => removeActivity(priority.id, activity.id)}
                              className="text-on-surface-variant hover:text-error hover:bg-error/10 p-1.5 rounded transition-colors mt-2"
                              title="Remove Activity"
                            >
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <button 
                  onClick={() => addActivity(priority.id)}
                  className="mt-4 flex items-center gap-1 text-primary font-semibold text-sm hover:underline"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Another Activity
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-surface-container-low p-6 border-t border-outline-variant/10 flex items-center justify-end font-sans">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gradient-primary bg-primary text-on-primary px-8 py-3 rounded-full font-bold text-sm hover:opacity-90 transition-opacity shadow-glow disabled:opacity-50"
          >
            {isSubmitting ? "Saving Plan..." : "Save Solution Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
