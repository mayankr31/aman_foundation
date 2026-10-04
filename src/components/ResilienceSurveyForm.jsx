"use client";

import { useState } from "react";

const sections = [
  "Consent",
  "Respondent Details",
  "Current Life Situation",
  "Planning",
  "Disaster Preparedness",
  "Disaster Belief",
  "Disaster Mindset",
  "Financial Resilience",
  "Health Resilience",
  "Social Connect",
  "Social Protection",
  "Disaster Awareness",
  "Vulnerability Assessment",
];

const GRID_ROWS = {
  "B.19": ["Education", "Skill development", "Jobs/Livelihood", "Money Matters (loans, savings etc.)", "Buying/Selling Assets", "Food", "Domestic chores (buying groceries, cooking, cleaning)", "Health (Physical)", "Health (Mental)", "Entertainment", "Spiritual & Religious", "Marriage", "NGO/Community level activities"],
  "D.1": ["Children's Education (if applicable)", "Adult education (if applicable)", "Increasing your Income", "Major expenditures (events, weddings, festivals)", "Routine cash savings", "Cash for any unexpected crises", "Reducing high interest loans (if applicable)", "Insurance (life, livelihood, health)", "Creating assets (land, site, building home)"],
  "H.5": ["Friends and family", "Nationalized banks", "Self-help group", "Money lenders", "MFI (micro finance institutions)", "Co-operative banks", "Private banks"],
  "K.1": ["Ration Card", "MGNREGA", "Old Age Pension", "Disability Pension", "Widow Pension", "Kissan Nidhi Scheme", "Ayushman Bharat", "Mudra Loan", "Life Insurance (PMJJBY)", "Accident Insurance (PMSBMY)", "Crop Insurance (PMFBY)"],
};

const REQUIRED_BY_SECTION = {
  0: ["A"],
  1: ["B.1", "B.17"],
  2: ["C.1", "C.2", "C.3", "C.4"],
  3: ["D.1", "D.2"],
  4: ["E.1", "E.2", "E.3", "E.4", "E.5"],
  5: ["F.1", "F.2", "F.3", "F.4"],
  6: ["G.1", "G.2", "G.3"],
  7: ["H.1", "H.2", "H.3", "H.4", "H.7", "H.8", "H.9", "H.10"],
  8: ["I.1", "I.2", "I.3", "I.4", "I.5"],
  9: ["J.1", "J.2", "J.3"],
  10: ["K.1", "K.2"],
  11: ["L.1", "L.2"],
  12: ["M.1", "M.3", "M.4", "M.9", "M.13"],
};

const CHECKBOX_IDS = new Set(["B.11", "B.13", "D.2", "M.1", "M.5", "M.6"]);
const MULTI_GRID_IDS = new Set(["B.19"]);
const SINGLE_GRID_IDS = new Set(["D.1", "H.5", "K.1"]);

const PROFILE_LOCKED_IDS = ["B.3", "B.4", "B.5", "B.6", "B.7", "B.8", "B.9", "B.10", "B.14", "B.16", "B.18"];

export default function ResilienceSurveyForm({
  mode = "page",
  prefill = {},
  hideQuestionIds = [],
  lockQuestionIds = [],
  title = "KYOR Form",
  submitLabel = "Submit Survey",
  onSubmit,
  onBack,
}) {
  const hidden = new Set(hideQuestionIds);
  const locked = new Set(lockQuestionIds);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sectionErrors, setSectionErrors] = useState([]);
  const [responses, setResponses] = useState(() => ({ ...prefill }));

  const requiredSet = new Set(REQUIRED_BY_SECTION[currentSectionIndex] || []);

  const isAnswered = (id) => {
    if (id === "B.16") {
      return String(responses["B.16_Min"] ?? "").trim() !== "" || String(responses["B.16_Max"] ?? "").trim() !== "";
    }
    if (id === "B.17") {
      return String(responses["B.17_Min"] ?? "").trim() !== "" || String(responses["B.17_Max"] ?? "").trim() !== "";
    }
    if (CHECKBOX_IDS.has(id)) {
      const v = responses[id];
      return Array.isArray(v) && v.length > 0;
    }
    if (MULTI_GRID_IDS.has(id)) {
      const v = responses[id] || {};
      return Object.values(v).some((arr) => Array.isArray(arr) && arr.length > 0);
    }
    if (SINGLE_GRID_IDS.has(id)) {
      const v = responses[id] || {};
      const rows = GRID_ROWS[id] || [];
      return rows.length > 0 && rows.every((r) => v[r] !== undefined && v[r] !== null && String(v[r]).trim() !== "");
    }
    const v = responses[id];
    return v !== undefined && v !== null && String(v).trim() !== "";
  };

  const validateSection = (index) => {
    const ids = REQUIRED_BY_SECTION[index] || [];
    return ids.filter((id) => !hidden.has(id) && !locked.has(id) && !isAnswered(id));
  };

  const handleNext = () => {
    const errors = validateSection(currentSectionIndex);
    if (errors.length > 0) {
      setSectionErrors(errors);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSectionErrors([]);
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1);
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    setSectionErrors([]);
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1);
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    } else if (mode === "embedded" && typeof onBack === "function") {
      onBack();
    }
  };

  const handleChange = (key, value) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  };

  const handleMultiChange = (key, value, checked) => {
    setResponses((prev) => {
      const arr = prev[key] || [];
      if (checked) {
        return { ...prev, [key]: [...arr, value] };
      } else {
        return { ...prev, [key]: arr.filter((item) => item !== value) };
      }
    });
  };

  const handleGridChange = (key, row, col) => {
    setResponses((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [row]: col,
      },
    }));
  };

  const handleMultiGridChange = (key, row, col, checked) => {
    setResponses((prev) => {
      const currentObj = prev[key] || {};
      const currentArr = currentObj[row] || [];
      return {
        ...prev,
        [key]: {
          ...currentObj,
          [row]: checked ? [...currentArr, col] : currentArr.filter((c) => c !== col),
        },
      };
    });
  };

  const handleSubmit = async () => {
    const errors = validateSection(currentSectionIndex);
    if (errors.length > 0) {
      setSectionErrors(errors);
      return;
    }
    setSectionErrors([]);
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit?.({ responses, scores: {} });
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelText = (id, text) => (
    <>
      {id}. {text}
      {requiredSet.has(id) && <span className="text-error ml-1">*</span>}
      {locked.has(id) && (
        <span className="ml-2 align-middle text-[9px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-[11px]">lock</span>
          From profile
        </span>
      )}
    </>
  );

  const cardClass = (id) =>
    `space-y-3 font-sans p-4 rounded border ${
      sectionErrors.includes(id)
        ? "border-error bg-error-container/10"
        : "border-surface-container-highest bg-surface-container-lowest"
    }`;

  const renderRadioQuestion = (id, text, options, description = "") => (
    <div key={id} className={cardClass(id)}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
        <label className="block text-sm font-semibold">{labelText(id, text)}</label>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full w-fit whitespace-nowrap">Single Choice</span>
      </div>
      {description && <p className="text-xs text-on-surface-variant mb-2">{description}</p>}
      <div className="flex flex-wrap gap-4">
        {options.map((opt) => (
          <label key={opt} className={`flex items-center gap-2 ${locked.has(id) ? "cursor-not-allowed" : "cursor-pointer"}`}>
            <input type="radio" name={id} value={opt} checked={responses[id] === opt} disabled={locked.has(id)} onChange={(e) => handleChange(id, e.target.value)} className="w-4 h-4" />
            <span className="text-sm">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderCheckboxQuestion = (id, text, options, description = "") => (
    <div key={id} className={cardClass(id)}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
        <label className="block text-sm font-semibold">{labelText(id, text)}</label>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full w-fit whitespace-nowrap">Multiple Choice</span>
      </div>
      {description && <p className="text-xs text-on-surface-variant mb-2">{description}</p>}
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <label key={opt} className={`flex items-center gap-2 ${locked.has(id) ? "cursor-not-allowed" : "cursor-pointer"}`}>
            <input type="checkbox" name={id} value={opt} checked={responses[id]?.includes(opt) || false} disabled={locked.has(id)} onChange={(e) => handleMultiChange(id, e.target.value, e.target.checked)} className="w-4 h-4" />
            <span className="text-sm">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderInputQuestion = (id, text, type = "text") => (
    <div key={id} className={cardClass(id)}>
      <div className="flex items-center gap-2 mb-1">
        <label className="block text-sm font-semibold">{labelText(id, text)}</label>
      </div>
      <input
        type={type}
        value={responses[id] || ""}
        disabled={locked.has(id)}
        onChange={(e) => handleChange(id, e.target.value)}
        className={`w-full max-w-md bg-surface-container-high border-none rounded p-3 text-sm focus:ring-2 focus:ring-primary outline-none ${locked.has(id) ? "opacity-60 cursor-not-allowed" : ""}`}
      />
    </div>
  );

  const renderGridQuestion = (id, text, rows, cols, isMulti = false, description = "") => (
    <div key={id} className={`${cardClass(id)} overflow-x-auto`}>
      <div className="flex items-center gap-2 mb-1">
        <label className="block text-sm font-semibold">{labelText(id, text)}</label>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isMulti ? "bg-primary-container text-on-primary-container" : "bg-surface-container-high text-on-surface-variant"}`}>
          {isMulti ? "Multiple Choice" : "Single Choice"}
        </span>
      </div>
      {description && <p className="text-xs text-on-surface-variant mb-2">{description}</p>}
      <table className="w-full text-left text-sm whitespace-nowrap min-w-max">
        <thead>
          <tr>
            <th className="p-2 border-b border-surface-container-highest">Items</th>
            {cols.map((c) => <th key={c} className="p-2 border-b border-surface-container-highest">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <td className="p-2 border-b border-surface-container-highest">{r}</td>
              {cols.map((c) => (
                <td key={c} className="p-2 border-b border-surface-container-highest text-center">
                  <input
                    type={isMulti ? "checkbox" : "radio"}
                    name={`${id}_${r}`}
                    value={c}
                    disabled={locked.has(id)}
                    checked={isMulti ? (responses[id]?.[r]?.includes(c) || false) : (responses[id]?.[r] === c)}
                    onChange={(e) => (isMulti ? handleMultiGridChange(id, r, c, e.target.checked) : handleGridChange(id, r, c))}
                    className="w-4 h-4"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSectionA = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline mb-4">Section A - Consent</h2>
      <p className="text-sm text-on-surface-variant font-sans mb-6">
        This household resilience measurement tool helps you to assess your families capacity to absorb, adapt and transform your lives when exposed to sudden and severe disturbances. We hope that this tool serves as a road map for your resilience journey showcasing your current position while also illuminating the way forward. Your participation in using this tool is voluntary and will take about half an hour of your time. You need to answer the questions posed from the perspective of the household. If you have any questions about the study, we would be happy to answer those for you. No one except the CSO team will be able to see your personal information. Your responses will also not be shared in an identifiable manner with anyone. An electronic version of the data will be stored without any personally identifiable information. In case you are not interested to participate you are free to drop out at any time. Do you consent for the same?
      </p>
      {renderRadioQuestion("A", "Do you consent for the same?", ["Yes", "No"])}
    </div>
  );

  const renderSectionB = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline mb-4">Section B - Respondent&apos;s Details</h2>
      {PROFILE_LOCKED_IDS.some((x) => locked.has(x)) && (
        <div className="text-xs font-sans text-on-surface-variant bg-primary-container/10 border border-primary/20 rounded-lg p-3 flex gap-2 items-start">
          <span className="material-symbols-outlined text-primary text-[16px] shrink-0">info</span>
          <span>Location and respondent details are sourced from the beneficiary profile. To change them, use <strong>Edit Profile → Personal</strong>.</span>
        </div>
      )}
      {renderInputQuestion("B.1", "Date", "date")}
      {renderInputQuestion("B.2", "Time of start of Interview", "time")}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {!hidden.has("B.3") && renderInputQuestion("B.3", "State")}
        {!hidden.has("B.4") && renderInputQuestion("B.4", "District")}
        {!hidden.has("B.5") && renderInputQuestion("B.5", "Block")}
        {!hidden.has("B.6") && renderInputQuestion("B.6", "Ward / GP")}
        {!hidden.has("B.7") && renderInputQuestion("B.7", "Village")}
        {!hidden.has("B.8") && renderInputQuestion("B.8", "Name")}
      </div>
      {!hidden.has("B.9") && renderRadioQuestion("B.9", "Gender", ["Male", "Female", "Don't want to respond", "Others"])}
      {!hidden.has("B.10") && renderInputQuestion("B.10", "What is the total number of members (including children, adults and elderly) in your household?", "number")}
      {!hidden.has("B.11") && renderCheckboxQuestion("B.11", "Do you live with following members?", ["Elderly parents or in-laws", "Adult children", "A spouse"])}
      {!hidden.has("B.12") && renderRadioQuestion("B.12", "Who is the head of your household?", ["Myself", "My spouse", "My Parents/In Laws", "Adult Son", "Adult Daughter"])}
      {!hidden.has("B.13") && renderCheckboxQuestion("B.13", "What are your source of income? Please indicate all the sources of income is currently having (Please select all that apply)", ["Wage Labour (casual or contract)", "Salaried employment (public or private sector)", "Farming on own land", "Livestock rearing (milk, meat, eggs, animal sales)", "Business or self-employment (non-agricultural)", "Agricultural services (equipment rental, custom farming)", "Fishing, forestry, or collection from commons (e.g., NTFPs, firewood)", "Remittances (from migrants or family members)", "Pension or government transfers (e.g., old-age, widow, disability)", "Rental income (land, buildings, machinery)", "Other"])}
      {!hidden.has("B.14") && renderInputQuestion("B.14", "Among the above selected, which is the primary income source for the family?")}
      {!hidden.has("B.15") && renderRadioQuestion("B.15", "Do your livelihood activities need specific equipment to produce income? (e.g., farm equipment, shops)", ["Yes", "No"])}
      {!hidden.has("B.16") && (
        <div className={cardClass("B.16")}>
          <label className="block text-sm font-semibold">{labelText("B.16", "Please share monthly income of your family")}</label>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Minimum / न्यूनतम:</span>
              <input type="number" value={responses["B.16_Min"] || ""} disabled={locked.has("B.16")} onChange={(e) => handleChange("B.16_Min", e.target.value)} className="bg-surface-container-high border-none rounded p-2 text-sm focus:ring-2 focus:ring-primary outline-none flex-1 max-w-[200px]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Maximum / अधिकतम:</span>
              <input type="number" value={responses["B.16_Max"] || ""} disabled={locked.has("B.16")} onChange={(e) => handleChange("B.16_Max", e.target.value)} className="bg-surface-container-high border-none rounded p-2 text-sm focus:ring-2 focus:ring-primary outline-none flex-1 max-w-[200px]" />
            </div>
          </div>
        </div>
      )}

      <div className={cardClass("B.17")}>
        <label className="block text-sm font-semibold">{labelText("B.17", "Please share monthly expenses of your family")}</label>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Minimum / न्यूनतम:</span>
            <input type="number" value={responses["B.17_Min"] || ""} onChange={(e) => handleChange("B.17_Min", e.target.value)} className="bg-surface-container-high border-none rounded p-2 text-sm focus:ring-2 focus:ring-primary outline-none flex-1 max-w-[200px]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Maximum / अधिकतम:</span>
            <input type="number" value={responses["B.17_Max"] || ""} onChange={(e) => handleChange("B.17_Max", e.target.value)} className="bg-surface-container-high border-none rounded p-2 text-sm focus:ring-2 focus:ring-primary outline-none flex-1 max-w-[200px]" />
          </div>
        </div>
      </div>
      {!hidden.has("B.18") && renderRadioQuestion("B.18", "What is the community group your family belongs to?", ["General", "OBC", "SC", "ST", "Particularly Vulnerable Tribal Groups (PVTGs)", "Minority", "Nomadic Tribes (NTs)", "Denotified Tribes (DNTs)", "Notified Tribes (NT)", "Other"])}
      {!hidden.has("B.19") && renderGridQuestion("B.19", "Who all are responsible for making decisions on the following topics (select everyone who participates):",
        GRID_ROWS["B.19"],
        ["Me", "Spouse", "Parents", "Adult children"], true)}
    </div>
  );

  const renderSectionC = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline mb-4">Section C - Current Life Situation</h2>
      <p className="text-sm text-on-surface-variant font-sans mb-6">
        Now I&apos;m going to ask you a few questions about how your family feels about your current life situation and whether you want to make any changes.
      </p>
      {renderRadioQuestion("C.1", "As a household, how satisfied are you with your current life situation overall (health, finance, education, job, social connections, emotional)?", ["Extremely dissatisfied", "Somewhat dissatisfied", "Satisfied", "Extremely satisfied"])}
      {renderRadioQuestion("C.2", "Do you feel that you need to change your current life situation for the better?", ["Yes", "No"])}
      {renderRadioQuestion("C.3", "Do you feel that you have the power to change to better your life situation?", ["Yes", "No", "Not Sure"])}
      {renderRadioQuestion("C.4", "Do you feel that you need the help of others to improve your life situation?", ["Yes", "No"])}
    </div>
  );

  const renderSectionD = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline mb-4">Section D - Planning</h2>
      {renderGridQuestion("D.1", "Do you have specific plans for the following for the next 1 year?",
        GRID_ROWS["D.1"],
        ["Yes", "No", "NA"])}
      {renderCheckboxQuestion("D.2", "If you need money, who would you get it from? (Multiple options)", ["Friends and family", "Nationalized banks", "Co-operative banks", "Private banks", "Self-help group", "Money lenders", "MFI (micro finance institutions)"])}
    </div>
  );

  const renderSectionE = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline mb-4">Section E - Disaster Preparedness</h2>
      <p className="text-sm text-on-surface-variant font-sans mb-6">
        Next, I&apos;d like to understand what your family does to prepare for things like floods, storms, or other disasters.
      </p>
      {renderRadioQuestion("E.1", "Do you keep anything ready in case of a flood, storm, or other emergency? (e.g., food, torch, documents, water, medicines etc)", ["Yes", "No"])}
      {renderRadioQuestion("E.2", "Do you and your family have a plan about what to do if a disaster comes?", ["Yes", "No"])}
      {renderRadioQuestion("E.3", "Have you changed anything in your home, work, or habits after a past disaster or warning?", ["Yes", "No"])}
      {renderRadioQuestion("E.4", "Do you talk with neighbors or others about what to do if a disaster comes?", ["Yes", "No"])}
      {renderRadioQuestion("E.5", "Do you usually make any plans before a disaster happens?", ["Yes", "No"])}
    </div>
  );

  const renderSectionF = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline mb-4">Section F - Disaster Belief</h2>
      <p className="text-sm text-on-surface-variant font-sans mb-6">
        Now I&apos;ll ask about how you and your family think about disasters—whether you believe they can be planned for or not.
      </p>
      {renderRadioQuestion("F.1", "Do you think there is no need to prepare unless something actually happens?", ["Yes", "No"])}
      {renderRadioQuestion("F.2", "Some people believe disasters are just fate or God's will, and that nothing can be done. Do you agree?", ["Yes", "No"])}
      {renderRadioQuestion("F.3", "Do you feel that no matter what you do, it won't change what is meant to happen?", ["Yes", "No"])}
      {renderRadioQuestion("F.4", "Do you avoid thinking or talking about disasters because it is too scary or not helpful?", ["Yes", "No"])}
    </div>
  );

  const renderSectionG = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline mb-4">Section G - Disaster Mindset</h2>
      <p className="text-sm text-on-surface-variant font-sans mb-6">
        Now I&apos;m going to ask a few questions about what your family might expect during a disaster—like whether you wait for others to help or feel it probably won&apos;t happen again.
      </p>
      {renderRadioQuestion("G.1", "If a disaster happens, do you mainly wait for the government or others to help?", ["Yes", "No"])}
      {renderRadioQuestion("G.2", "Do you depend on others to tell you what to do during a disaster?", ["Yes", "No"])}
      {renderRadioQuestion("G.3", "Do you believe disasters won't happen again in your area?", ["Yes", "No"])}
    </div>
  );

  const renderSectionH = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline mb-4">Section H - Financial Resilience</h2>
      <p className="text-sm text-on-surface-variant font-sans mb-6">
        Now I&apos;ll ask some questions about your family&apos;s money, loans, and whether you have things like savings, insurance, or assets you could use in a crisis.
      </p>
      {renderRadioQuestion("H.1", "Do you have things like land, gold, livestock, or tools that you could sell if your family faced a crisis?", ["Yes", "No"])}
      {renderRadioQuestion("H.2", "Does your household save money regularly (e.g.month, weekly etc.)?", ["Yes", "No"])}
      {renderRadioQuestion("H.3", "Does your household have outstanding loans?", ["Yes, from formal sources", "Yes, from informal sources", "No, because I don't need loans", "No, because I can't get loans (lack of documents/assets)", "I don't know"])}
      {renderRadioQuestion("H.4", "Are you paying a high interest (more than 24% per year) for any of your outstanding loans?", ["Yes", "No"])}
      {renderGridQuestion("H.5", "What are the sources of your loans and current outstanding?",
        GRID_ROWS["H.5"],
        ["> 100K", "10K - 100K", "< 10K", "Don't Know"], false)}
      {renderInputQuestion("H.6", "At present what is the highest rate of interest per annum you are paying for your loans? (if greater than 120%, select 120%)", "number")}
      {renderRadioQuestion("H.7", "Does your household have a plan to reduce the high interest debt (if any)?", ["Yes", "No", "Not Applicable"])}
      {renderRadioQuestion("H.8", "Does your household have a monthly budget plan for your expenses and income?", ["Yes", "No"])}
      {renderRadioQuestion("H.9", "Does your household own physical assets (such as agricultural land, plot, constructed building)?", ["Yes", "No"])}
      {renderRadioQuestion("H.10", "Does your household have insurance for your livelihood activities and equipment (e.g., crop insurance, equipment insurance)?", ["Yes", "No"])}
    </div>
  );

  const renderSectionI = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline mb-4">Section I - Health Resilience</h2>
      <p className="text-sm text-on-surface-variant font-sans mb-6">
        Now I&apos;ll ask some questions some questions about your family&apos;s access to health care, insurance, clean water, and toilets
      </p>
      {renderRadioQuestion("I.1", "If you need health care, which of the facilities do you routinely access?", ["Public health clinics/hospitals", "Private health clinics/hospitals", "None"])}
      {renderRadioQuestion("I.2", "Do you have health insurance for any of the members of the household?", ["Yes", "No", "Not Applicable"])}
      {renderRadioQuestion("I.3", "Do you know how to use any of the insurance you have (livelihood, health, life)?", ["Yes", "No", "Not Applicable"])}
      {renderRadioQuestion("I.4", "Do you have clean drinking water for your home?", ["Yes", "No"])}
      {renderRadioQuestion("I.5", "Do you have toilet facilities with water for your household use?", ["Yes", "No"])}
    </div>
  );

  const renderSectionJ = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline mb-4">Section J - Social Connect</h2>
      <p className="text-sm text-on-surface-variant font-sans mb-6">
        Now I&apos;ll ask about whether you&apos;re part of any local groups or government programs, and who you can turn to if your family faces a crisis.
      </p>
      {renderRadioQuestion("J.1", "Is your household a member of local groups or organizations?", ["Yes", "No"])}
      {renderRadioQuestion("J.2", "Do you have people (friends and family) you can trust to help you if you experience a crisis?", ["Yes", "No"])}
      {renderRadioQuestion("J.3", "In an emergency, is there someone you can borrow money from easily (like a moneylender or friend)?", ["Yes", "No"])}
    </div>
  );

  const renderSectionK = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline mb-4">Section K - Social Protection</h2>
      {renderGridQuestion("K.1", "Do you get benefits from any of the following government schemes?",
        GRID_ROWS["K.1"],
        ["Not Eligible", "Not aware about eligibility", "Eligible but don't have", "I am eligible and I have"], false)}
      {renderRadioQuestion("K.2", "Do you think you can rely on government schemes during the times of crisis?", ["Yes", "No", "Not Sure"])}
    </div>
  );

  const renderSectionL = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline mb-4">Section L - Disaster Awareness</h2>
      <p className="text-sm text-on-surface-variant font-sans mb-6">
        Next, I&apos;d like to ask about whether your family gets warnings before disasters and knows where to go for help if something happens.
      </p>
      {renderRadioQuestion("L.1", "Do you know where to go or who to ask for help if a disaster happens?", ["Yes", "No"])}
      {renderRadioQuestion("L.2", "Do you usually get warning messages before a disaster (like from phone, TV, or others)?", ["Yes", "No"])}
    </div>
  );

  const renderSectionM = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline mb-4">Section M - Vulnerability Assessment</h2>
      <p className="text-sm text-on-surface-variant font-sans mb-6">
        Now I want to ask about shocks your family has experienced in the past—like floods, illness, or job loss—and how those affected your household.
      </p>
      {renderCheckboxQuestion("M.1", "What were the major interruptions/shocks your household has experienced in the past?", ["Flooding", "Drought", "Earthquake", "Cyclone", "Pandemic", "Crop Failure (pests etc.)", "Unseasonal rain", "Heatwave", "Extreme Cold", "Communal clashes", "Personal Tragedy", "Health shocks", "Others"])}
      {renderInputQuestion("M.2", "What is the biggest interruption/shock your household has experienced in the past?")}
      {renderRadioQuestion("M.3", "When did the interruption of ... happen?", ["In the last 1 year", "1 to 3 years", "3 to 5 years", "more than 5 years ago"])}
      {renderRadioQuestion("M.4", "How severe was the impact of this shock?", ["Very severe", "Moderate", "No impact"])}
      {renderCheckboxQuestion("M.5", "Did you have insurance for the following when the disaster happened?", ["Home", "Physical assets (agricultural land, plot)", "Life Crops", "Livestock", "Health", "Livelihood"])}

      <p className="text-sm text-on-surface-variant font-sans mt-8 mb-4 border-t border-surface-container-high pt-8">
        Now I&apos;ll ask few question about what your family did to cope with that shock, and whether those actions helped you recover.
      </p>

      {renderCheckboxQuestion("M.6", "How did you respond to the interruption caused by ...? Please select all that apply.", ["Used the cash savings", "Claimed insurance benefits", "Took help from friends and family", "Took help from local organizations", "Received government relief (disaster schemes)", "Borrowed money from money lender", "Borrowed money from bank", "Pledged/sold movable assets like jewellery, bicycle, bike, TV, utensils", "Migrated", "Moved out of the dwelling", "Took on more work", "Withdrew children from school and put them to work", "More family members started working", "Did not do anything", "Other"])}
      {renderRadioQuestion("M.7", "To what extent have you recovered from the interruption caused by ...?", ["We have not recovered", "Somewhat recovered", "Completely recovered", "Doing better than before the shock"])}
      {renderRadioQuestion("M.8", "To what extent did your response of '...' help in your recovery?", ["Made things worse", "Not helpful", "Somewhat helpful", "Very helpful"])}
      {renderRadioQuestion("M.9", "If your household were to experience another shock (it could be anything), do you think you can handle it?", ["Yes", "No", "Unsure"])}
      {renderRadioQuestion("M.10", "If your life is interrupted by a shock such as ... , how long can you continue to meet your household expenses with the savings/cash you have?", ["Less than a week", "Up to one month", "Up to six months", "Up to a year", "More than a year"])}
      {renderRadioQuestion("M.11", "If your life is interrupted by a ..., is there any other way you can make an income?", ["We don't want to do anything else to make an income", "We want to but we can't get an alternative income", "Yes, please describe below"])}
      {renderInputQuestion("M.12", "Suppose you urgently need cash to deal with a shock (it could be anything), about how much money can you immediately generate?", "number")}

      <p className="text-sm text-on-surface-variant font-sans mt-8 mb-4 border-t border-surface-container-high pt-8">
        Just a few more quick questions to understand how your family thinks about the future and deals with challenges.
      </p>

      {renderRadioQuestion("M.13", "When something bad happens, as a family, do you feel you bounce back quickly?", ["Yes", "No", "Unsure"])}
      {renderRadioQuestion("M.14", "Is your home in an area that is often affected by floods or storms or other natural disasters?", ["Yes", "No", "Unsure"])}
      {renderRadioQuestion("M.15", "If your family faced a serious issue—like a land dispute, a theft, or a legal problem—do you know where to go for help?", ["Yes", "No", "Unsure"])}
      {renderRadioQuestion("M.16", "As a family, do you make any plans beyond the next one year?", ["Yes", "No", "Unsure"])}
    </div>
  );

  const renderCurrentSection = () => {
    switch (currentSectionIndex) {
      case 0: return renderSectionA();
      case 1: return renderSectionB();
      case 2: return renderSectionC();
      case 3: return renderSectionD();
      case 4: return renderSectionE();
      case 5: return renderSectionF();
      case 6: return renderSectionG();
      case 7: return renderSectionH();
      case 8: return renderSectionI();
      case 9: return renderSectionJ();
      case 10: return renderSectionK();
      case 11: return renderSectionL();
      case 12: return renderSectionM();
      default: return null;
    }
  };

  return (
    <div className={mode === "page" ? "bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/10 overflow-hidden" : "border border-outline-variant/20 rounded-xl overflow-hidden"}>
      {/* Progress Header */}
      <div className="bg-surface-container-low p-6 border-b border-outline-variant/10">
        <h1 className="text-2xl font-bold font-headline text-on-surface mb-2">{title}</h1>
        <div className="flex items-center justify-between text-sm font-sans text-on-surface-variant font-medium">
          <span>{sections[currentSectionIndex]}</span>
          <span>Step {currentSectionIndex + 1} of {sections.length}</span>
        </div>
        <div className="w-full bg-surface-container-highest h-2 rounded-full mt-4 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${((currentSectionIndex + 1) / sections.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-6 md:p-8 min-h-[400px]">
        {sectionErrors.length > 0 && (
          <div className="mb-5 p-3 rounded-lg border border-error/30 bg-error-container/10 font-sans">
            <p className="text-xs font-bold text-error mb-1">Please answer the required questions marked with * :</p>
            <p className="text-xs text-on-surface-variant">{sectionErrors.join(", ")}</p>
          </div>
        )}
        {renderCurrentSection()}
      </div>

      {/* Footer Actions */}
      <div className="bg-surface-container-low p-6 border-t border-outline-variant/10 flex items-center justify-between font-sans">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentSectionIndex === 0 && !(mode === "embedded" && typeof onBack === "function")}
          className={`px-5 py-2.5 rounded text-sm font-bold flex items-center gap-2 ${currentSectionIndex === 0 && !(mode === "embedded" && typeof onBack === "function") ? "opacity-50 cursor-not-allowed text-on-surface-variant" : "text-primary hover:bg-primary/10 transition-colors"}`}
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          {currentSectionIndex === 0 && mode === "embedded" ? "Back to Details" : "Previous"}
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting}
          className="gradient-primary bg-primary text-on-primary px-6 py-2.5 rounded font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 shadow-glow disabled:opacity-50"
        >
          {currentSectionIndex < sections.length - 1 ? (
            <>
              Next
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </>
          ) : (
            isSubmitting ? "Submitting..." : submitLabel
          )}
        </button>
      </div>
    </div>
  );
}
