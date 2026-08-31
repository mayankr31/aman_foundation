"use client";

import { useEffect } from "react";

const QUESTION_LABELS = [
  { key: "q1", label: "1. I identify as" },
  { key: "q2", label: "2. I share the background (economic, racial, ethnic, religious, etc.) of the most disadvantaged groups in India" },
  { key: "q3", label: "3. I have a growing understanding of why all children in Assam today do not attain a quality education and livelihood opportunities" },
  { key: "q4", label: "4. I believe it is possible for all children in Assam to attain quality education" },
  { key: "q5", label: "5. My journey at Aman Foundation so far has been a good investment in my personal and professional development." },
  { key: "q6", label: "6. I feel supported by the Aman Foundation Staff" },
  { key: "q7", label: "7. I feel comfortable in approaching my Program Manager and Senior Leadership Team" },
  { key: "q8", label: "8. I feel part of a community, where peers help each other drive impact collectively" },
  { key: "q9", label: "9. I find purpose and meaning in the work I do" },
  { key: "q10", label: "10. I am proud to be a part of Aman Foundation" },
  { key: "q11", label: "11. I plan to stay in touch with the Aman Foundation Alumni community after my Fellowship" },
  { key: "q12", label: "12. There are repercussions when a Fellow/Staff performs poorly or acts against our core values" },
  { key: "q13", label: "13. I know what is expected of me in my role" },
  { key: "q14", label: "14. My day-to-day experiences match the expectations that were set when I went through the recruitment and selection process" },
  { key: "q14Reason", label: "14a. What would you have liked to know about the Fellowship experience before starting the Fellowship?" },
  { key: "q15", label: "15. My organization provides me with the resources and support I need to manage my well-being" },
  { key: "q16", label: "16. I feel equipped to build relationships with school & Community stakeholders and deal with challenges at school & Community level" },
  { key: "q17", label: "17. Aman Foundation creates an inclusive environment for me" },
  { key: "q18", label: "18. My feedback is welcomed and valued" },
  { key: "q19", label: "19. People who perform well are recognized for it" },
  { key: "q20", label: "20. My PM/Manager" },
  { key: "q21", label: "21. Since the beginning of the academic year, my PM/Manager has observed my class and shared feedback through technical notes/conversations at the following frequency" },
  { key: "q22_selected", label: "22. Since the start of the year, which of the following learning and development spaces have you accessed?" },
  { key: "q23", label: "23. Based on all the learning and development opportunities, what aspects have you found helpful or what could be strengthened?" },
  { key: "q24", label: "24. On a scale of 0-10, how likely is it that you would recommend the Fellowship to any qualified individual you know?" },
  { key: "q24Reason", label: "24a. Reason for rating" },
  { key: "q25", label: "25. Top two aspects of the Fellowship program that you like the most" },
  { key: "q26", label: "26. Top 2 areas that Aman Foundation can focus on to enhance your experience with the Fellowship program" },
];

const Q20_SUB_POINTS = [
  "a. facilitates conversations that provide useful and timely feedback on my performance",
  "b. helps me set ambitious goals and reflect on my growth as a teacher and leader.",
  "c. operates with empathy and holds space for me when I am going through challenges",
  "d. encourages me to solve challenges coming my way",
  "e. facilitates reflections for me to make connections between my growth as a teacher and leader",
];

const Q22_ITEMS = {
  a: { bold: "Institute", text: " prepared me with the adequate foundational skills to begin teaching" },
  b: { bold: "Technical trainings", text: " help me upskill and develop as a teacher" },
  c: { bold: "Learning Circle (or Community Circle for TTF)", text: " is a safe and effective space to connect and build relationships, problem solve, share best practices and reflect on progress" },
};

const SECTIONS = [
  { title: "Demographics", keys: ["q1", "q2"] },
  { title: "Section 1 - Belief Questions", keys: ["q3", "q4"] },
  { title: "Section 2 - Culture", keys: ["q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12"] },
  { title: "Section 2 - Expectations, Well-being and Progress", keys: ["q13", "q14", "q14Reason", "q15", "q16", "q17", "q18", "q19"] },
  { title: "Section 3 - Support", keys: ["q20", "q21"] },
  { title: "Section 4 - Quality of L&D Spaces", keys: ["q22_selected", "q23"] },
  { title: "Section 5 - Overall Feedback", keys: ["q24", "q24Reason", "q25", "q26"] },
];

const Q22_KEYS = ["q22a", "q22b", "q22c"];

export default function EngagementSurveyViewer({ survey, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const responses = survey?.responses || {};
  const labelMap = {};
  QUESTION_LABELS.forEach((q) => {
    labelMap[q.key] = q.label;
  });

  const renderValue = (key, value) => {
    if (key === "q20") {
      return (
        <div>
          <ul className="list-disc list-inside pl-2 space-y-0.5 text-sm text-on-surface-variant leading-relaxed mb-2">
            {Q20_SUB_POINTS.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
          <p className="text-sm text-on-surface font-semibold">{value}</p>
        </div>
      );
    }
    if (key === "q22_selected") {
      const answeredQ22 = Q22_KEYS.filter((k) => responses[k]);
      if (answeredQ22.length === 0) return null;
      return (
        <div className="space-y-2 mt-2">
          {answeredQ22.map((k) => {
            const item = Q22_ITEMS[k.slice(-1)];
            if (!item) return null;
            return (
              <div key={k} className="pl-3 border-l-2 border-surface-container py-1">
                <span className="text-sm text-on-surface-variant">
                  <strong>{item.bold}</strong>{item.text}
                </span>
                <span className="text-sm text-on-surface font-semibold ml-2">&mdash; {responses[k]}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return <p className="text-sm text-on-surface">{value}</p>;
  };

  const shouldShow = (key, value) => {
    if (!value && value !== 0) return false;
    if (key === "q22_selected" && Array.isArray(value) && value.length === 0) return false;
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center p-4 pt-12 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-6 font-sans max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 pb-4 border-b border-outline-variant/20 z-10">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Engagement Survey Responses</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Submitted on {new Date(survey.surveyDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-8">
          {SECTIONS.map((section) => {
            const sectionResponses = section.keys.filter((k) => shouldShow(k, responses[k]));
            if (sectionResponses.length === 0) return null;

            return (
              <div key={section.title}>
                <h4 className="text-sm font-headline font-bold text-primary uppercase tracking-wider mb-3 border-b border-outline-variant/10 pb-2">
                  {section.title}
                </h4>
                <div className="space-y-4">
                  {section.keys.map((key) => {
                    const value = responses[key];
                    if (!shouldShow(key, value)) return null;

                    return (
                      <div key={key} className="pl-3 border-l-2 border-surface-container">
                        <p className="text-sm font-semibold text-on-surface mb-1">{labelMap[key] || key}</p>
                        {renderValue(key, value)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
