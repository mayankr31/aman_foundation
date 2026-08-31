"use client";

import { useState } from "react";

const LIKERT_OPTIONS = ["Strongly disagree", "Disagree", "Agree", "Strongly agree"];
const GENDER_OPTIONS = ["Male", "Female", "Transgender", "Non-binary", "Prefer not to disclose"];
const YES_NO_DISCLOSE = ["Yes", "No", "Prefer not to disclose"];
const FREQUENCY_OPTIONS = ["Once a week", "Once in two weeks", "Once in three weeks", "Once a month", "Once in two months", "Just once since the new academic year started"];

const Q22_OPTIONS = [
  { key: "a", label: "Institute prepared me with the adequate foundational skills to begin teaching", bold: "Institute" },
  { key: "b", label: "Technical trainings help me upskill and develop as a teacher", bold: "Technical trainings" },
  { key: "c", label: "Learning Circle (or Community Circle for TTF) is a safe and effective space to connect and build relationships, problem solve, share best practices and reflect on progress", bold: "Learning Circle (or Community Circle for TTF)" },
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
  q1: "", q2: "",
  q3: "", q4: "",
  q5: "", q6: "", q7: "", q8: "", q9: "", q10: "", q11: "", q12: "",
  q13: "", q14: "", q14Reason: "",
  q15: "", q16: "", q17: "", q18: "", q19: "",
  q20: "",
  q21: "",
  q22_selected: [],
  q22a: "", q22b: "", q22c: "",
  q23: "",
  q24: "", q24Reason: "",
  q25: "", q26: "",
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

export default function EngagementSurveyForm({ onSubmit, onCancel }) {
  const [responses, setResponses] = useState(INITIAL_RESPONSES);
  const [surveyDate, setSurveyDate] = useState(getISTDate());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key, value) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  };

  const toggleQ22Selection = (key) => {
    setResponses((prev) => {
      const selected = prev.q22_selected || [];
      if (selected.includes(key)) {
        const updated = selected.filter((k) => k !== key);
        const resetKey = `q22${key}`;
        return { ...prev, q22_selected: updated, [resetKey]: "" };
      }
      return { ...prev, q22_selected: [...selected, key] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(surveyDate, responses);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showQ14Reason = responses.q14 === "Strongly disagree" || responses.q14 === "Disagree";
  const showQ24Reason = responses.q24 !== "" && parseInt(responses.q24) < 6;
  const q22Selected = responses.q22_selected || [];

  const dropdownClass = "px-4 py-2.5 border rounded-lg focus:outline-none focus:border-primary border-outline-variant bg-transparent text-on-surface text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-headline font-black text-on-surface">Fellow Engagement Survey</h2>
          <p className="text-sm text-on-surface-variant mt-1">Please take a few minutes to share your experience and feedback.</p>
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

      <SectionNote>
        Please note that these questions will be used to understand aggregate trends, and will not be used to reveal the identity of the Fellow.
      </SectionNote>

      {/* Demographics */}
      <SectionHeading>Demographics</SectionHeading>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Dropdown label="1. I identify as ______" value={responses.q1} onChange={(v) => update("q1", v)} options={GENDER_OPTIONS} required />
        <Dropdown label="2. I share the background (economic, racial, ethnic, religious, etc.) of the most disadvantaged groups in India" value={responses.q2} onChange={(v) => update("q2", v)} options={YES_NO_DISCLOSE} required />
      </div>

      {/* Section 1 */}
      <SectionLabel>Section 1</SectionLabel>
      <SectionNote>
        Before proceeding with the survey, we request you to take a few minutes to reflect on your Fellowship journey since the start of this academic year.
      </SectionNote>
      <SectionHeading>Belief Questions</SectionHeading>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Dropdown label="3. I have a growing understanding of why all children in Assam today do not attain a quality education and livelihood opportunities" value={responses.q3} onChange={(v) => update("q3", v)} options={LIKERT_OPTIONS} required />
        <Dropdown label="4. I believe it is possible for all children in Assam to attain quality education" value={responses.q4} onChange={(v) => update("q4", v)} options={LIKERT_OPTIONS} required />
      </div>

      {/* Section 2 */}
      <SectionLabel>Section 2</SectionLabel>
      <SectionNote>
        In the following section, we would like to understand how you feel about Aman Foundation&apos;s culture, alignment of your experience, and progress towards your goal so far.
      </SectionNote>
      <SectionHeading>Culture</SectionHeading>
      <div className="grid grid-cols-1 gap-5">
        {[
          { key: "q5", label: "5. My journey at Aman Foundation so far has been a good investment in my personal and professional development." },
          { key: "q6", label: "6. I feel supported by the Aman Foundation Staff" },
          { key: "q7", label: "7. I feel comfortable in approaching my Program Manager and Senior Leadership Team" },
          { key: "q8", label: "8. I feel part of a community, where peers help each other drive impact collectively" },
          { key: "q9", label: "9. I find purpose and meaning in the work I do" },
          { key: "q10", label: "10. I am proud to be a part of Aman Foundation" },
          { key: "q11", label: "11. I plan to stay in touch with the Aman Foundation Alumni community after my Fellowship" },
          { key: "q12", label: "12. There are repercussions when a Fellow/Staff performs poorly or acts against our core values" },
        ].map(({ key, label }) => (
          <Dropdown key={key} label={label} value={responses[key]} onChange={(v) => update(key, v)} options={LIKERT_OPTIONS} required />
        ))}
      </div>

      <SectionHeading>Expectations, Well-being and Progress</SectionHeading>
      <div className="grid grid-cols-1 gap-5">
        <Dropdown label="13. I know what is expected of me in my role" value={responses.q13} onChange={(v) => update("q13", v)} options={LIKERT_OPTIONS} required />
        <div className="space-y-3">
          <Dropdown label="14. My day-to-day experiences match the expectations that were set when I went through the recruitment and selection process" value={responses.q14} onChange={(v) => update("q14", v)} options={LIKERT_OPTIONS} required />
          {showQ14Reason && (
            <TextInput
              label="What would you have liked to know about the Fellowship experience before starting the Fellowship?"
              value={responses.q14Reason}
              onChange={(v) => update("q14Reason", v)}
              placeholder="Please share your thoughts..."
              required
            />
          )}
        </div>
        <Dropdown label="15. My organization provides me with the resources and support I need to manage my well-being" value={responses.q15} onChange={(v) => update("q15", v)} options={LIKERT_OPTIONS} required />
        <Dropdown label="16. I feel equipped to build relationships with school & Community stakeholders and deal with challenges at school & Community level" value={responses.q16} onChange={(v) => update("q16", v)} options={LIKERT_OPTIONS} required />
        <Dropdown label="17. Aman Foundation creates an inclusive environment for me" value={responses.q17} onChange={(v) => update("q17", v)} options={LIKERT_OPTIONS} required />
        <Dropdown label="18. My feedback is welcomed and valued" value={responses.q18} onChange={(v) => update("q18", v)} options={LIKERT_OPTIONS} required />
        <Dropdown label="19. People who perform well are recognized for it" value={responses.q19} onChange={(v) => update("q19", v)} options={LIKERT_OPTIONS} required />
      </div>

      {/* Section 3 */}
      <SectionLabel>Section 3</SectionLabel>
      <SectionNote>
        In this section, we would like you to reflect on the quality of support you have received from your Program Manager/Manager.
      </SectionNote>
      <SectionHeading>Support</SectionHeading>
      <div className="space-y-5">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-on-surface">20. My PM/Manager -</p>
          <ul className="list-disc list-inside pl-4 space-y-1 text-sm text-on-surface-variant leading-relaxed">
            <li>a. facilitates conversations that provide useful and timely feedback on my performance</li>
            <li>b. helps me set ambitious goals and reflect on my growth as a teacher and leader.</li>
            <li>c. operates with empathy and holds space for me when I am going through challenges</li>
            <li>d. encourages me to solve challenges coming my way</li>
            <li>e. facilitates reflections for me to make connections between my growth as a teacher and leader</li>
          </ul>
          <select
            value={responses.q20}
            onChange={(e) => update("q20", e.target.value)}
            required
            className={dropdownClass}
          >
            <option value="">Select an option</option>
            {LIKERT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-on-surface leading-relaxed">
            21. Since the beginning of the academic year, my PM/Manager has observed my class and shared feedback through technical notes/conversations at the following frequency
          </label>
          <select
            value={responses.q21}
            onChange={(e) => update("q21", e.target.value)}
            required
            className={dropdownClass}
          >
            <option value="">Select frequency</option>
            {FREQUENCY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Section 4 */}
      <SectionLabel>Section 4</SectionLabel>
      <SectionNote>
        In this section, we would like you to reflect on the opportunities and resources you have accessed to provide your students with an excellent education.
      </SectionNote>
      <SectionHeading>Quality of L&D Spaces</SectionHeading>
      <div className="space-y-5">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-on-surface">
            22. Since the start of the year, which of the following learning and development spaces have you accessed? (Select all that apply)
          </p>
          {Q22_OPTIONS.map((opt) => (
            <div key={opt.key} className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={q22Selected.includes(opt.key)}
                  onChange={() => toggleQ22Selection(opt.key)}
                  className="mt-0.5 w-4 h-4 accent-primary rounded"
                />
                <span className="text-sm text-on-surface leading-relaxed">
                  <strong>{opt.bold}</strong>{opt.label.substring(opt.bold.length)}
                </span>
              </label>
              {q22Selected.includes(opt.key) && (
                <div className="ml-7">
                  <select
                    value={responses[`q22${opt.key}`] || ""}
                    onChange={(e) => update(`q22${opt.key}`, e.target.value)}
                    required
                    className={dropdownClass + " w-full"}
                  >
                    <option value="">How effective was this?</option>
                    {LIKERT_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
        <TextInput
          label="23. Based on all the learning and development opportunities that Aman Foundation provides, what aspects of them have you found to be helpful or what could be strengthened?"
          value={responses.q23}
          onChange={(v) => update("q23", v)}
          placeholder="Please share your feedback..."
        />
      </div>

      {/* Section 5 */}
      <SectionLabel>Section 5</SectionLabel>
      <SectionNote>
        In this last section, we would love for you to share your overall experience with the Aman Foundation Fellowship program. We will appreciate your valuable feedback.
      </SectionNote>
      <SectionHeading>Overall Feedback</SectionHeading>
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-on-surface">
            24. On a scale of 0-10 (0 being the lowest), how likely is it that you would recommend the Fellowship to any qualified individual you know?
          </label>
          <div className="flex flex-wrap gap-2">
            {[...Array(11).keys()].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => update("q24", String(num))}
                className={`w-10 h-10 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
                  responses.q24 === String(num)
                    ? "bg-primary text-white border-primary shadow-md"
                    : "border-outline-variant text-on-surface hover:border-primary hover:bg-primary-fixed/10"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          {showQ24Reason && (
            <TextInput
              label="Please share the reason for your rating"
              value={responses.q24Reason}
              onChange={(v) => update("q24Reason", v)}
              placeholder="Please share your reason..."
              required
            />
          )}
        </div>
        <TextInput
          label="25. Based on your experience, what are the top two aspects of the Fellowship program that you like the most?"
          value={responses.q25}
          onChange={(v) => update("q25", v)}
          placeholder="Please describe..."
          required
        />
        <TextInput
          label="26. Based on your experience, what are the top 2 areas that Aman Foundation can focus on to enhance your experience with the Fellowship program?"
          value={responses.q26}
          onChange={(v) => update("q26", v)}
          placeholder="Please describe..."
          required
        />
      </div>

      {/* Form Actions */}
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
