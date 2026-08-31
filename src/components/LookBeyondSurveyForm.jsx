"use client";

import { useState, useRef, useEffect } from "react";

const LIKERT_OPTIONS = ["Strongly disagree", "Disagree", "Agree", "Strongly agree"];
const EXTENT_OPTIONS = ["To a great extent", "Somewhat", "Little", "Not at all"];
const HELPFUL_OPTIONS = ["Extremely helpful", "Mostly helpful", "Somewhat helpful", "Not helpful"];

const STUDY_COURSES = [
  "Business-related degree (for ex. MBA, Law, etc)",
  "Education-related degree (for ex. Master or PHD in Ed, etc)",
  "Development-related degree (for ex. Master in Public Policy, International Relations, etc)",
  "Other",
  "I am unsure",
];

const EXAM_COURSES = [
  "Related to Business",
  "Related to Education",
  "Related to Development Sector",
  "Others (Please specify)",
];

const BREAK_PLANS = [
  "Family commitments",
  "Travel",
  "Other",
];

const BTCP_STAGES = [
  "Not yet started",
  "Ideation",
  "Planning",
  "Implementation",
  "Closing out",
];

const BTCP_RATINGS = [
  "I have access to helpful and timely support and resources towards my BTCP",
  "My BTCP is helping me increase my understanding of the education ecosystem",
  "My BTCP is helping me build or practice skills that I can transfer and apply to my post-Fellowship choices/careers",
];

const DEPTH_TRACKS = [
  "Aspiring School Leadership Track",
  "Public Sector Track",
  "iLab",
  "Fellow Advisory Track",
  "Others",
];

const Q8_OPPORTUNITIES = [
  { key: "pathway_exposure", label: "Pathway Exposure Series", hasFollowup: false },
  { key: "theory_of_change", label: "Personal Theory of Change workshop", hasFollowup: false },
  { key: "org_immersions", label: "Org Immersions", hasFollowup: false },
  { key: "one_on_one", label: "1-on-1 Conversations with City Staff", hasFollowup: false },
  { key: "microsite", label: "Post-Fellowship Support Microsite", hasFollowup: false },
  { key: "depth_tracks", label: "Depth Tracks", hasFollowup: true },
  { key: "internship", label: "Internship/ Apprenticeship", hasFollowup: true },
];

const PATHWAY_GROUPS = [
  {
    heading: "1. Transformational Schools (towards children from low-income communities)",
    options: [
      { key: "ts_teaching", label: "a. Teaching" },
      { key: "ts_school_leadership", label: "b. School Leadership" },
      { key: "ts_school_entrepreneurship", label: "c. School Entrepreneurship" },
      { key: "ts_after_school", label: "d. After School Programs and Community Centers" },
    ],
  },
  {
    heading: "2. Enablers of transformational schools (towards children from low-income communities)",
    options: [
      { key: "en_service_people", label: "a. Service Provider (People)" },
      { key: "en_service_product", label: "b. Service Provider (Product)" },
      { key: "en_intermediary", label: "c. Intermediary" },
      { key: "en_funding", label: "d. Funding" },
    ],
  },
  {
    heading: "3. Policy and governance",
    options: [
      { key: "pg_consulting", label: "a. Governance Consulting" },
      { key: "pg_fellowships", label: "b. Government Fellowships" },
      { key: "pg_bureaucracy", label: "c. Bureaucracy" },
      { key: "pg_politics", label: "d. Politics" },
    ],
  },
  {
    heading: "4. Other Pathways",
    options: [
      { key: "op_edu_sector", label: "a. Working in the education sector, but not specifically focused on children from low-income communities" },
      { key: "op_dev_ecosystem", label: "b. Working in the larger development ecosystem, but not focused on the education system" },
      { key: "op_not_impacting", label: "c. Working in roles not impacting educational outcomes or children from low-income backgrounds directly/ indirectly" },
      { key: "op_other", label: "d. Other (please specify)" },
    ],
  },
  {
    heading: "5. Unsure",
    options: [
      { key: "u_unsure", label: "Unsure" },
    ],
  },
];

function getISTDate() {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const y = ist.getFullYear();
  const m = String(ist.getMonth() + 1).padStart(2, "0");
  const d = String(ist.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const INITIAL_RESPONSES = {
  q1: "",
  q1_study_course: "",
  q1_study_other: "",
  q1_exam_course: "",
  q1_exam_other: "",
  q1_break_plan: "",
  q1_break_other: "",
  q1_unsure_reason: "",
  q2: "",
  q3: "",
  q4: "",
  q5: "",
  q6: "",
  q7_ranked: [],
  q7_other_text: "",
  q8_selected: [],
  q8_pathway_exposure: "",
  q8_theory_of_change: "",
  q8_org_immersions: "",
  q8_one_on_one: "",
  q8_microsite: "",
  q8_depth_tracks: "",
  q8_depth_track_choice: "",
  q8_depth_track_other: "",
  q8_internship: "",
  q8_internship_org: "",
  q9_btcp: "",
  q9_btcp_stage: "",
  q9_btcp_rating: "",
  q9_btcp_reason: "",
  q10: "",
  q11: "",
  q12: "",
};

function Dropdown({ label, value, onChange, options, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-on-surface">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="px-4 py-2.5 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm"
      >
        <option value="">Select an option</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-on-surface">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || ""}
        required={required}
        rows={3}
        className="px-4 py-2.5 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm resize-y"
      />
    </div>
  );
}

function SectionNote({ children }) {
  return (
    <div className="bg-primary-fixed/20 border-l-4 border-primary rounded-r-lg p-4 mb-6">
      <p className="text-sm text-on-surface-variant leading-relaxed">{children}</p>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <h4 className="text-base font-headline font-bold text-primary pb-1 mb-4">{children}</h4>
  );
}

function SectionLabel({ children }) {
  return (
    <h3 className="text-xl font-headline font-black text-on-surface border-b border-outline-variant/20 pb-2 mb-4 mt-8">{children}</h3>
  );
}

export default function LookBeyondSurveyForm({ onSubmit, onCancel }) {
  const [responses, setResponses] = useState(INITIAL_RESPONSES);
  const [surveyDate, setSurveyDate] = useState(getISTDate());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const update = (key, value) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleQ8Selection = (key) => {
    setResponses((prev) => {
      const selected = prev.q8_selected || [];
      if (selected.includes(key)) {
        const updated = selected.filter((k) => k !== key);
        const resetKey = `q8_${key}`;
        return {
          ...prev,
          q8_selected: updated,
          [resetKey]: "",
          ...(key === "depth_tracks" ? { q8_depth_track_choice: "", q8_depth_track_other: "" } : {}),
          ...(key === "internship" ? { q8_internship_org: "" } : {}),
        };
      }
      return { ...prev, q8_selected: [...selected, key] };
    });
  };

  const togglePathwaySelection = (groupIndex, optionIndex, optionKey) => {
    setResponses((prev) => {
      const ranked = [...(prev.q7_ranked || [])];
      const existingIndex = ranked.findIndex((r) => r.key === optionKey);

      if (existingIndex >= 0) {
        ranked.splice(existingIndex, 1);
      } else if (ranked.length < 3) {
        ranked.push({ key: optionKey, group: groupIndex, option: optionIndex });
      } else {
        return prev;
      }

      if (optionKey !== "op_other") {
        return { ...prev, q7_ranked: ranked };
      }

      const newOtherText = optionKey === "op_other" && existingIndex < 0 ? prev.q7_other_text : (existingIndex >= 0 && prev.q7_other_text ? prev.q7_other_text : "");
      return { ...prev, q7_ranked: ranked, q7_other_text: newOtherText };
    });
  };

  const validate = () => {
    const errs = {};
    if (!responses.q1) errs.q1 = "Required";
    if (!responses.q2) errs.q2 = "Required";
    if (!responses.q3) errs.q3 = "Required";
    if (!responses.q4) errs.q4 = "Required";
    if (!responses.q5) errs.q5 = "Required";
    if (!responses.q6) errs.q6 = "Required";
    if (!responses.q11) errs.q11 = "Required";

    if (responses.q1 === "a" && !responses.q1_study_course) {
      errs.q1_study_course = "Required";
    } else if (responses.q1 === "a" && responses.q1_study_course === "Other" && !responses.q1_study_other) {
      errs.q1_study_other = "Required";
    }

    if (responses.q1 === "b" && !responses.q1_exam_course) {
      errs.q1_exam_course = "Required";
    } else if (responses.q1 === "b" && responses.q1_exam_course === "Others (Please specify)" && !responses.q1_exam_other) {
      errs.q1_exam_other = "Required";
    }

    if (responses.q1 === "f" && !responses.q1_break_plan) {
      errs.q1_break_plan = "Required";
    } else if (responses.q1 === "f" && responses.q1_break_plan === "Other" && !responses.q1_break_other) {
      errs.q1_break_other = "Required";
    }

    if (responses.q1 === "g" && !responses.q1_unsure_reason) {
      errs.q1_unsure_reason = "Required";
    }

    if ((responses.q7_ranked || []).length < 3) {
      errs.q7_ranked = "Please select and rank exactly 3 pathways";
    }

    const q8sel = responses.q8_selected || [];
    q8sel.forEach((key) => {
      if (!responses[`q8_${key}`]) {
        errs[`q8_${key}`] = "Required";
      }
    });
    if (q8sel.includes("depth_tracks") && !responses.q8_depth_track_choice) {
      errs.q8_depth_track_choice = "Required";
    }
    if (
      q8sel.includes("depth_tracks") &&
      responses.q8_depth_track_choice === "Others" &&
      !responses.q8_depth_track_other
    ) {
      errs.q8_depth_track_other = "Required";
    }
    if (q8sel.includes("internship") && !responses.q8_internship_org) {
      errs.q8_internship_org = "Required";
    }

    if (!responses.q9_btcp) errs.q9_btcp = "Required";
    if (responses.q9_btcp === "yes" && !responses.q9_btcp_stage) errs.q9_btcp_stage = "Required";
    if (responses.q9_btcp === "yes" && ["Ideation", "Planning", "Implementation", "Closing out"].includes(responses.q9_btcp_stage) && !responses.q9_btcp_rating) {
      errs.q9_btcp_rating = "Required";
    }
    if (responses.q9_btcp === "no" && !responses.q9_btcp_reason) errs.q9_btcp_reason = "Required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(surveyDate, responses);
    } finally {
      setIsSubmitting(false);
    }
  };

  const q1 = responses.q1;
  const q8Selected = responses.q8_selected || [];
  const dropdownClass = "px-4 py-2.5 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm";

  const isQ7After = q1 === "c" || q1 === "d" || q1 === "e";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-headline font-black text-on-surface">Look Beyond Survey</h2>
          <p className="text-sm text-on-surface-variant mt-1">Please take a few minutes to share your post-Fellowship plans and reflections.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-on-surface">Survey Date:</label>
          <input
            type="date"
            value={surveyDate}
            onChange={(e) => setSurveyDate(e.target.value)}
            required
            className={dropdownClass}
          />
        </div>
      </div>

      {/* Section 1 */}
      <SectionLabel>Section 1: Post-Fellowship Plans</SectionLabel>
      <SectionNote>
        Please share your current thinking around your plans right after the Fellowship.
      </SectionNote>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-on-surface">
          1. Which statement, out of the following, best describes your current thinking around your plans right after the Fellowship?
        </label>
        <div className="grid grid-cols-1 gap-2 mt-2">
          {[
            { key: "a", label: "I would like to study" },
            { key: "b", label: "I will be preparing for competitive exams" },
            { key: "c", label: "I would like to work" },
            { key: "d", label: "I will be starting my own organization" },
            { key: "e", label: "I am on sabbatical and will return to my employer" },
            { key: "f", label: "I have decided to take a break" },
            { key: "g", label: "I am unsure" },
          ].map((opt) => (
            <label
              key={opt.key}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                q1 === opt.key
                  ? "border-primary bg-primary-fixed/10"
                  : "border-outline-variant hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name="q1"
                value={opt.key}
                checked={q1 === opt.key}
                onChange={() => update("q1", opt.key)}
                className="accent-primary w-4 h-4"
              />
              <span className="text-sm text-on-surface">{opt.label}</span>
            </label>
          ))}
        </div>
        {errors.q1 && <p className="text-red-500 text-xs mt-1">{errors.q1}</p>}
      </div>

      {q1 === "a" && (
        <div className="ml-4 pl-4 border-l-2 border-primary space-y-4">
          <Dropdown
            label="What course(s) are you aspiring to get into?"
            value={responses.q1_study_course}
            onChange={(v) => update("q1_study_course", v)}
            options={STUDY_COURSES}
            required
          />
          {errors.q1_study_course && <p className="text-red-500 text-xs">{errors.q1_study_course}</p>}
          {responses.q1_study_course === "Other" && (
            <div>
              <TextInput
                label="Please specify"
                value={responses.q1_study_other}
                onChange={(v) => update("q1_study_other", v)}
                placeholder="Please specify..."
                required
              />
              {errors.q1_study_other && <p className="text-red-500 text-xs">{errors.q1_study_other}</p>}
            </div>
          )}
        </div>
      )}

      {q1 === "b" && (
        <div className="ml-4 pl-4 border-l-2 border-primary space-y-4">
          <Dropdown
            label="What course(s) are you aspiring to get into?"
            value={responses.q1_exam_course}
            onChange={(v) => update("q1_exam_course", v)}
            options={EXAM_COURSES}
            required
          />
          {errors.q1_exam_course && <p className="text-red-500 text-xs">{errors.q1_exam_course}</p>}
          {responses.q1_exam_course === "Others (Please specify)" && (
            <div>
              <TextInput
                label="Please specify"
                value={responses.q1_exam_other}
                onChange={(v) => update("q1_exam_other", v)}
                placeholder="Please specify..."
                required
              />
              {errors.q1_exam_other && <p className="text-red-500 text-xs">{errors.q1_exam_other}</p>}
            </div>
          )}
        </div>
      )}

      {q1 === "f" && (
        <div className="ml-4 pl-4 border-l-2 border-primary space-y-4">
          <Dropdown
            label="What do you plan on doing during your break?"
            value={responses.q1_break_plan}
            onChange={(v) => update("q1_break_plan", v)}
            options={BREAK_PLANS}
            required
          />
          {errors.q1_break_plan && <p className="text-red-500 text-xs">{errors.q1_break_plan}</p>}
          {responses.q1_break_plan === "Other" && (
            <div>
              <TextInput
                label="Please specify"
                value={responses.q1_break_other}
                onChange={(v) => update("q1_break_other", v)}
                placeholder="Please specify..."
                required
              />
              {errors.q1_break_other && <p className="text-red-500 text-xs">{errors.q1_break_other}</p>}
            </div>
          )}
        </div>
      )}

      {q1 === "g" && (
        <div className="ml-4 pl-4 border-l-2 border-primary">
          <div>
            <TextInput
              label="What is making you unsure?"
              value={responses.q1_unsure_reason}
              onChange={(v) => update("q1_unsure_reason", v)}
              placeholder="Please share your thoughts..."
              required
            />
            {errors.q1_unsure_reason && <p className="text-red-500 text-xs">{errors.q1_unsure_reason}</p>}
          </div>
        </div>
      )}

      {/* Section 2 */}
      <SectionLabel>Section 2: Puzzle Piece Alignment</SectionLabel>

      <SectionHeading>Beliefs</SectionHeading>
      <div className="grid grid-cols-1 gap-5">
        <div>
          <Dropdown
            label="2. I have an evolving idea of the role I will play as an Alum of Teach For India towards educational equity"
            value={responses.q2}
            onChange={(v) => update("q2", v)}
            options={LIKERT_OPTIONS}
            required
          />
          {errors.q2 && <p className="text-red-500 text-xs mt-1">{errors.q2}</p>}
        </div>
        <div>
          <Dropdown
            label="3. I believe the Fellowship experience is helping me grow the capabilities I need (e.g., knowledge, skills, mindsets, etc.) to develop personally and professionally"
            value={responses.q3}
            onChange={(v) => update("q3", v)}
            options={LIKERT_OPTIONS}
            required
          />
          {errors.q3 && <p className="text-red-500 text-xs mt-1">{errors.q3}</p>}
        </div>
      </div>

      <SectionHeading>Knowledge of prioritized puzzle pieces</SectionHeading>
      <div className="grid grid-cols-1 gap-5">
        <div>
          <Dropdown
            label="4. I am familiar with and understand Teach For India's 3 prioritized puzzle pieces (Transformational Schools, Enablers of Transformation Outcomes, Policy and Governance)"
            value={responses.q4}
            onChange={(v) => update("q4", v)}
            options={EXTENT_OPTIONS}
            required
          />
          {errors.q4 && <p className="text-red-500 text-xs mt-1">{errors.q4}</p>}
        </div>
        <div>
          <Dropdown
            label="5. I am aware of the types of roles and organizations within Teach For India's 3 prioritized puzzle pieces"
            value={responses.q5}
            onChange={(v) => update("q5", v)}
            options={EXTENT_OPTIONS}
            required
          />
          {errors.q5 && <p className="text-red-500 text-xs mt-1">{errors.q5}</p>}
        </div>
        <div>
          <Dropdown
            label="6. I am aware of how my strengths align or do not align with the types of opportunities available within Teach For India's 3 prioritized puzzle pieces"
            value={responses.q6}
            onChange={(v) => update("q6", v)}
            options={EXTENT_OPTIONS}
            required
          />
          {errors.q6 && <p className="text-red-500 text-xs mt-1">{errors.q6}</p>}
        </div>
      </div>

      <SectionHeading>Pathway preferences</SectionHeading>
      {q1 && (
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10">
          <label className="text-sm font-medium text-on-surface">
            7. {isQ7After
              ? "What are the top 3 pathways you envision yourself working in right after the Fellowship?"
              : "What are the top 3 pathways you envision yourself working in when you seek a work opportunity in the future?"
            }
          </label>
          <p className="text-xs text-on-surface-variant mt-1 mb-4">
            Select exactly 3 options. The order you select them determines their rank (1st, 2nd, 3rd). Click an option again to deselect it.
          </p>

          <div className="space-y-6">
            {PATHWAY_GROUPS.map((group, gi) => (
              <div key={gi}>
                <p className="text-sm font-semibold text-on-surface mb-2">{group.heading}</p>
                <div className="space-y-2 ml-2">
                  {group.options.map((opt, oi) => {
                    const ranked = responses.q7_ranked || [];
                    const rankIndex = ranked.findIndex((r) => r.key === opt.key);
                    const isSelected = rankIndex >= 0;
                    return (
                      <div key={opt.key} className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => togglePathwaySelection(gi, oi, opt.key)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all cursor-pointer text-left flex-1 ${
                            isSelected
                              ? "border-primary bg-primary-fixed/10 shadow-sm"
                              : "border-outline-variant hover:border-primary/50"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isSelected
                                ? "bg-primary text-white"
                                : "border-2 border-outline-variant text-on-surface-variant"
                            }`}
                          >
                            {isSelected ? rankIndex + 1 : ""}
                          </span>
                          <span className="text-sm text-on-surface">{opt.label}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {responses.q7_ranked?.some((r) => r.key === "op_other") && (
            <div className="mt-4 ml-4">
              <TextInput
                label="Please specify the other pathway"
                value={responses.q7_other_text}
                onChange={(v) => update("q7_other_text", v)}
                placeholder="Please specify..."
                required
              />
            </div>
          )}
          {errors.q7_ranked && <p className="text-red-500 text-xs mt-2">{errors.q7_ranked}</p>}

          {(responses.q7_ranked || []).length > 0 && (
            <div className="mt-4 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
              <p className="text-xs font-semibold text-on-surface mb-2">Your Rankings:</p>
              {(responses.q7_ranked || []).map((rankedItem, idx) => {
                let label = "";
                for (const g of PATHWAY_GROUPS) {
                  for (const o of g.options) {
                    if (o.key === rankedItem.key) {
                      label = o.label;
                    }
                  }
                }
                return (
                  <p key={idx} className="text-sm text-on-surface-variant">
                    <span className="font-bold text-primary">Rank {idx + 1}:</span> {label}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Section 3 */}
      <SectionLabel>Section 3: Support and Opportunities provided</SectionLabel>

      <SectionHeading>Feedback on support</SectionHeading>

      <div className="space-y-4">
        <p className="text-sm font-semibold text-on-surface">
          8. Which of the following opportunities created by Teach For India have you accessed in your post-Fellowship exploration and search? (Select all that apply)
        </p>
        {Q8_OPPORTUNITIES.map((opp) => (
          <div key={opp.key} className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={q8Selected.includes(opp.key)}
                onChange={() => toggleQ8Selection(opp.key)}
                className="mt-0.5 w-4 h-4 accent-primary rounded"
              />
              <span className="text-sm text-on-surface">{opp.label}</span>
            </label>
            {q8Selected.includes(opp.key) && (
              <div className="ml-7 space-y-3">
                <div>
                  <select
                    value={responses[`q8_${opp.key}`] || ""}
                    onChange={(e) => update(`q8_${opp.key}`, e.target.value)}
                    required
                    className={dropdownClass + " w-full"}
                  >
                    <option value="">How helpful was this?</option>
                    {HELPFUL_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  {errors[`q8_${opp.key}`] && <p className="text-red-500 text-xs mt-1">{errors[`q8_${opp.key}`]}</p>}
                </div>

                {opp.key === "depth_tracks" && (
                  <div className="space-y-3">
                    <Dropdown
                      label="Please choose the track that you accessed:"
                      value={responses.q8_depth_track_choice}
                      onChange={(v) => update("q8_depth_track_choice", v)}
                      options={DEPTH_TRACKS}
                      required
                    />
                    {errors.q8_depth_track_choice && <p className="text-red-500 text-xs">{errors.q8_depth_track_choice}</p>}
                    {responses.q8_depth_track_choice === "Others" && (
                      <div>
                        <TextInput
                          label="Please specify"
                          value={responses.q8_depth_track_other}
                          onChange={(v) => update("q8_depth_track_other", v)}
                          placeholder="Please specify..."
                          required
                        />
                        {errors.q8_depth_track_other && <p className="text-red-500 text-xs">{errors.q8_depth_track_other}</p>}
                      </div>
                    )}
                  </div>
                )}

                {opp.key === "internship" && (
                  <div>
                    <TextInput
                      label="Please can you name the organisation you did your apprenticeship/internship with?"
                      value={responses.q8_internship_org}
                      onChange={(v) => update("q8_internship_org", v)}
                      placeholder="Organisation name..."
                      required
                    />
                    {errors.q8_internship_org && <p className="text-red-500 text-xs">{errors.q8_internship_org}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-on-surface">
            9. Have you done a Be The Change Project (BTCP)?
          </label>
          <div className="flex gap-4 mt-1">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="q9_btcp"
                  value={opt.toLowerCase()}
                  checked={responses.q9_btcp === opt.toLowerCase()}
                  onChange={() => {
                    update("q9_btcp", opt.toLowerCase());
                    update("q9_btcp_stage", "");
                    update("q9_btcp_rating", "");
                    update("q9_btcp_reason", "");
                  }}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-sm text-on-surface">{opt}</span>
              </label>
            ))}
          </div>
          {errors.q9_btcp && <p className="text-red-500 text-xs mt-1">{errors.q9_btcp}</p>}
        </div>

        {responses.q9_btcp === "yes" && (
          <div className="ml-4 pl-4 border-l-2 border-primary space-y-4">
            <div>
              <Dropdown
                label="Which stage of your BTCP are you on?"
                value={responses.q9_btcp_stage}
                onChange={(v) => update("q9_btcp_stage", v)}
                options={BTCP_STAGES}
                required
              />
              {errors.q9_btcp_stage && <p className="text-red-500 text-xs">{errors.q9_btcp_stage}</p>}
            </div>

            {["Ideation", "Planning", "Implementation", "Closing out"].includes(responses.q9_btcp_stage) && (
              <div>
                <Dropdown
                  label="Please select the option that best describes your experience:"
                  value={responses.q9_btcp_rating}
                  onChange={(v) => update("q9_btcp_rating", v)}
                  options={BTCP_RATINGS}
                  required
                />
                {errors.q9_btcp_rating && <p className="text-red-500 text-xs">{errors.q9_btcp_rating}</p>}
              </div>
            )}
          </div>
        )}

        {responses.q9_btcp === "no" && (
          <div className="ml-4 pl-4 border-l-2 border-primary">
            <div>
              <TextInput
                label="Please share the reason for not doing the BTCP"
                value={responses.q9_btcp_reason}
                onChange={(v) => update("q9_btcp_reason", v)}
                placeholder="Please share your reason..."
                required
              />
              {errors.q9_btcp_reason && <p className="text-red-500 text-xs">{errors.q9_btcp_reason}</p>}
            </div>
          </div>
        )}
      </div>

      <TextInput
        label="10. If you have accessed any other opportunities or created some for yourself that helped with your post-Fellowship exploration and search, please mention them below."
        value={responses.q10}
        onChange={(v) => update("q10", v)}
        placeholder="Please describe any other opportunities..."
      />

      <div>
        <Dropdown
          label="11. The support offered by Teach For India towards post-Fellowship is of high quality and is suited to my needs"
          value={responses.q11}
          onChange={(v) => update("q11", v)}
          options={LIKERT_OPTIONS}
          required
        />
        {errors.q11 && <p className="text-red-500 text-xs mt-1">{errors.q11}</p>}
      </div>

      <TextInput
        label="12. With respect to your post-Fellowship plans, please share any recommendations to strengthen the quality or type of support that Teach For India can offer to Fellows"
        value={responses.q12}
        onChange={(v) => update("q12", v)}
        placeholder="Please share your recommendations..."
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-full border border-outline-variant text-on-surface hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-semibold text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-colors cursor-pointer text-sm flex items-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Submitting...
            </>
          ) : (
            "Submit Survey"
          )}
        </button>
      </div>
    </form>
  );
}
