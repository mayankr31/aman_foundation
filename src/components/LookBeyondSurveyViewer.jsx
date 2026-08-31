"use client";

import { useEffect } from "react";

const Q1_LABELS = {
  a: "I would like to study",
  b: "I will be preparing for competitive exams",
  c: "I would like to work",
  d: "I will be starting my own organization",
  e: "I am on sabbatical and will return to my employer",
  f: "I have decided to take a break",
  g: "I am unsure",
};

const Q8_LABELS = {
  pathway_exposure: "Pathway Exposure Series",
  theory_of_change: "Personal Theory of Change workshop",
  org_immersions: "Org Immersions",
  one_on_one: "1-on-1 Conversations with City Staff",
  microsite: "Post-Fellowship Support Microsite",
  depth_tracks: "Depth Tracks",
  internship: "Internship/ Apprenticeship",
};

const PATHWAY_GROUP_LABELS = {
  ts_teaching: "Transformational Schools - a. Teaching",
  ts_school_leadership: "Transformational Schools - b. School Leadership",
  ts_school_entrepreneurship: "Transformational Schools - c. School Entrepreneurship",
  ts_after_school: "Transformational Schools - d. After School Programs and Community Centers",
  en_service_people: "Enablers - a. Service Provider (People)",
  en_service_product: "Enablers - b. Service Provider (Product)",
  en_intermediary: "Enablers - c. Intermediary",
  en_funding: "Enablers - d. Funding",
  pg_consulting: "Policy and governance - a. Governance Consulting",
  pg_fellowships: "Policy and governance - b. Government Fellowships",
  pg_bureaucracy: "Policy and governance - c. Bureaucracy",
  pg_politics: "Policy and governance - d. Politics",
  op_edu_sector: "Other Pathways - a. Working in the education sector, but not specifically focused on children from low-income communities",
  op_dev_ecosystem: "Other Pathways - b. Working in the larger development ecosystem, but not focused on the education system",
  op_not_impacting: "Other Pathways - c. Working in roles not impacting educational outcomes or children from low-income backgrounds directly/ indirectly",
  op_other: "Other Pathways - d. Other",
  u_unsure: "Unsure",
};

function Q7Section({ responses }) {
  const ranked = responses.q7_ranked || [];
  if (ranked.length === 0) return null;

  const isAfter = responses.q1 === "c" || responses.q1 === "d" || responses.q1 === "e";
  const questionText = isAfter
    ? "What are the top 3 pathways you envision yourself working in right after the Fellowship?"
    : "What are the top 3 pathways you envision yourself working in when you seek a work opportunity in the future?";

  return (
    <div className="pl-3 border-l-2 border-surface-container">
      <p className="text-sm font-semibold text-on-surface mb-2">7. {questionText}</p>
      <div className="space-y-1">
        {ranked.map((item, idx) => {
          const label = PATHWAY_GROUP_LABELS[item.key] || item.key;
          return (
            <div key={idx} className="flex gap-2 text-sm">
              <span className="font-bold text-primary shrink-0">Rank {idx + 1}:</span>
              <span className="text-on-surface">{label}</span>
            </div>
          );
        })}
        {ranked.some((r) => r.key === "op_other") && responses.q7_other_text && (
          <p className="text-sm text-on-surface-variant mt-1">Other: {responses.q7_other_text}</p>
        )}
      </div>
    </div>
  );
}

export default function LookBeyondSurveyViewer({ survey, onClose }) {
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

  const hasValue = (v) => {
    if (v === undefined || v === null) return false;
    if (typeof v === "string" && v.trim() === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  };

  const renderQ8 = () => {
    const selected = responses.q8_selected || [];
    if (selected.length === 0) return null;

    return (
      <div className="pl-3 border-l-2 border-surface-container">
        <p className="text-sm font-semibold text-on-surface mb-2">
          8. Which opportunities created by Teach For India have you accessed?
        </p>
        <div className="space-y-3">
          {selected.map((key) => {
            const rating = responses[`q8_${key}`] || "";
            return (
              <div key={key} className="pl-3 border-l-2 border-surface-container py-1">
                <p className="text-sm text-on-surface font-medium">{Q8_LABELS[key] || key}</p>
                {rating && <p className="text-sm text-on-surface-variant">Rating: {rating}</p>}
                {key === "depth_tracks" && responses.q8_depth_track_choice && (
                  <div className="mt-1">
                    <p className="text-sm text-on-surface-variant">
                      Track: {responses.q8_depth_track_choice}
                      {responses.q8_depth_track_choice === "Others" && responses.q8_depth_track_other
                        ? ` - ${responses.q8_depth_track_other}`
                        : ""}
                    </p>
                  </div>
                )}
                {key === "internship" && responses.q8_internship_org && (
                  <p className="text-sm text-on-surface-variant mt-1">
                    Organisation: {responses.q8_internship_org}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSimple = (label, value) => (
    <div className="pl-3 border-l-2 border-surface-container">
      <p className="text-sm font-semibold text-on-surface mb-1">{label}</p>
      <p className="text-sm text-on-surface">{value}</p>
    </div>
  );

  const renderSection = (title, children) => (
    <div>
      <h4 className="text-sm font-headline font-bold text-primary uppercase tracking-wider mb-3 border-b border-outline-variant/10 pb-2">
        {title}
      </h4>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const sections = [];

  // Section 1
  const section1Children = [];
  if (hasValue(responses.q1)) {
    const q1Label = `1. Which statement best describes your current thinking around your plans right after the Fellowship?`;
    const q1Value = Q1_LABELS[responses.q1] || responses.q1;
    section1Children.push(renderSimple(q1Label, q1Value));

    if (responses.q1 === "a") {
      if (hasValue(responses.q1_study_course)) {
        section1Children.push(renderSimple("What course(s) are you aspiring to get into?", responses.q1_study_course));
      }
      if (hasValue(responses.q1_study_other)) {
        section1Children.push(renderSimple("Other (specified)", responses.q1_study_other));
      }
    }
    if (responses.q1 === "b") {
      if (hasValue(responses.q1_exam_course)) {
        section1Children.push(renderSimple("What course(s) are you aspiring to get into?", responses.q1_exam_course));
      }
      if (hasValue(responses.q1_exam_other)) {
        section1Children.push(renderSimple("Others (specified)", responses.q1_exam_other));
      }
    }
    if (responses.q1 === "f") {
      if (hasValue(responses.q1_break_plan)) {
        section1Children.push(renderSimple("What do you plan on doing during your break?", responses.q1_break_plan));
      }
      if (hasValue(responses.q1_break_other)) {
        section1Children.push(renderSimple("Other (specified)", responses.q1_break_other));
      }
    }
    if (responses.q1 === "g") {
      if (hasValue(responses.q1_unsure_reason)) {
        section1Children.push(renderSimple("What is making you unsure?", responses.q1_unsure_reason));
      }
    }
  }
  if (section1Children.length > 0) {
    sections.push({ title: "Section 1: Post-Fellowship Plans", children: section1Children });
  }

  // Section 2
  const section2Children = [];
  if (hasValue(responses.q2)) {
    section2Children.push(
      renderSimple("2. Evolving idea of role as Alum towards educational equity", responses.q2)
    );
  }
  if (hasValue(responses.q3)) {
    section2Children.push(
      renderSimple("3. Fellowship experience is helping grow capabilities for personal and professional development", responses.q3)
    );
  }
  if (hasValue(responses.q4)) {
    section2Children.push(
      renderSimple("4. Familiar with TFI's 3 prioritized puzzle pieces", responses.q4)
    );
  }
  if (hasValue(responses.q5)) {
    section2Children.push(
      renderSimple("5. Aware of types of roles and organizations within 3 puzzle pieces", responses.q5)
    );
  }
  if (hasValue(responses.q6)) {
    section2Children.push(
      renderSimple("6. Aware of how strengths align with opportunities within 3 puzzle pieces", responses.q6)
    );
  }
  section2Children.push(<Q7Section key="q7" responses={responses} />);
  if (section2Children.length > 0) {
    sections.push({ title: "Section 2: Puzzle Piece Alignment", children: section2Children });
  }

  // Section 3
  const section3Children = [];
  const q8Rendered = renderQ8();
  if (q8Rendered) section3Children.push(q8Rendered);

  if (hasValue(responses.q9_btcp)) {
    const btcpLabel = "9. Have you done a Be The Change Project (BTCP)?";
    section3Children.push(renderSimple(btcpLabel, responses.q9_btcp === "yes" ? "Yes" : "No"));
    if (responses.q9_btcp === "yes" && hasValue(responses.q9_btcp_stage)) {
      section3Children.push(renderSimple("BTCP Stage", responses.q9_btcp_stage));
    }
    if (responses.q9_btcp === "yes" && hasValue(responses.q9_btcp_rating)) {
      section3Children.push(renderSimple("BTCP Experience", responses.q9_btcp_rating));
    }
    if (responses.q9_btcp === "no" && hasValue(responses.q9_btcp_reason)) {
      section3Children.push(renderSimple("Reason for not doing BTCP", responses.q9_btcp_reason));
    }
  }

  if (hasValue(responses.q10)) {
    section3Children.push(renderSimple("10. Other opportunities accessed", responses.q10));
  }
  if (hasValue(responses.q11)) {
    section3Children.push(renderSimple("11. Post-Fellowship support is high quality and suited to my needs", responses.q11));
  }
  if (hasValue(responses.q12)) {
    section3Children.push(renderSimple("12. Recommendations to strengthen support", responses.q12));
  }

  if (section3Children.length > 0) {
    sections.push({ title: "Section 3: Support and Opportunities", children: section3Children });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center p-4 pt-12 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-6 font-sans max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 pb-4 border-b border-outline-variant/20 z-10">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Look Beyond Survey Responses</h3>
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
          {sections.map((section, i) => (
            <div key={i}>
              {renderSection(section.title, section.children)}
            </div>
          ))}
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
