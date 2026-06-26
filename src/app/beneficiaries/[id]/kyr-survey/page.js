"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/context/ToastContext";

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

export default function KYRSurveyPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const toast = useToast();
  
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responses, setResponses] = useState({});

  const handleNext = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1);
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1);
      window.scrollTo(0, 0);
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
        return { ...prev, [key]: arr.filter(item => item !== value) };
      }
    });
  };

  const handleGridChange = (key, row, col) => {
    setResponses((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [row]: col
      }
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
          [row]: checked ? [...currentArr, col] : currentArr.filter(c => c !== col)
        }
      };
    });
  };

  const calculateScores = () => {
    // Mock randomized scores to simulate the scoring engine
    return {
      lifeSatisfactionScore: Math.floor(Math.random() * 50) + 50,
      planningScore: Math.floor(Math.random() * 50) + 50,
      disasterReadinessScore: Math.floor(Math.random() * 50) + 50,
      disasterBeliefsScore: Math.floor(Math.random() * 50) + 50,
      disasterMindsetScore: Math.floor(Math.random() * 50) + 50,
      financialResilienceScore: Math.floor(Math.random() * 50) + 50,
      healthResilienceScore: Math.floor(Math.random() * 50) + 50,
      socialConnectednessScore: Math.floor(Math.random() * 50) + 50,
      socialProtectionScore: Math.floor(Math.random() * 50) + 50,
      disasterWarningScore: Math.floor(Math.random() * 50) + 50,
      vulnerabilityScore: Math.floor(Math.random() * 50) + 50,
      overallScore: Math.floor(Math.random() * 50) + 50,
    };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = { responses, scores: calculateScores() };
      const res = await fetch(`/api/beneficiaries/${id}/resilience-surveys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Survey submitted successfully!");
        router.push(`/beneficiaries/${id}`);
      } else {
        toast.error("Error submitting survey: " + data.error);
      }
    } catch (error) {
      console.error("Submission failed", error);
      toast.error("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRadioQuestion = (id, text, options, description = "") => (
    <div key={id} className="space-y-3 font-sans p-4 bg-surface-container-lowest rounded border border-surface-container-highest">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
        <label className="block text-sm font-semibold">{id}. {text}</label>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full w-fit whitespace-nowrap">Single Choice</span>
      </div>
      {description && <p className="text-xs text-on-surface-variant mb-2">{description}</p>}
      <div className="flex flex-wrap gap-4">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name={id} value={opt} checked={responses[id] === opt} onChange={(e) => handleChange(id, e.target.value)} className="w-4 h-4" /> 
            <span className="text-sm">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderCheckboxQuestion = (id, text, options, description = "") => (
    <div key={id} className="space-y-3 font-sans p-4 bg-surface-container-lowest rounded border border-surface-container-highest">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
        <label className="block text-sm font-semibold">{id}. {text}</label>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full w-fit whitespace-nowrap">Multiple Choice</span>
      </div>
      {description && <p className="text-xs text-on-surface-variant mb-2">{description}</p>}
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name={id} value={opt} checked={responses[id]?.includes(opt) || false} onChange={(e) => handleMultiChange(id, e.target.value, e.target.checked)} className="w-4 h-4" /> 
            <span className="text-sm">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderInputQuestion = (id, text, type = "text") => (
    <div key={id} className="space-y-3 font-sans p-4 bg-surface-container-lowest rounded border border-surface-container-highest">
      <div className="flex items-center gap-2 mb-1">
        <label className="block text-sm font-semibold">{id}. {text}</label>
      </div>
      <input type={type} value={responses[id] || ""} onChange={(e) => handleChange(id, e.target.value)} className="w-full max-w-md bg-surface-container-high border-none rounded p-3 text-sm focus:ring-2 focus:ring-primary outline-none" />
    </div>
  );

  const renderGridQuestion = (id, text, rows, cols, isMulti = false, description = "") => (
    <div key={id} className="space-y-3 font-sans p-4 bg-surface-container-lowest rounded border border-surface-container-highest overflow-x-auto">
      <div className="flex items-center gap-2 mb-1">
        <label className="block text-sm font-semibold">{id}. {text}</label>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isMulti ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
          {isMulti ? "Multiple Choice" : "Single Choice"}
        </span>
      </div>
      {description && <p className="text-xs text-on-surface-variant mb-2">{description}</p>}
      <table className="w-full text-left text-sm whitespace-nowrap min-w-max">
        <thead>
          <tr>
            <th className="p-2 border-b border-surface-container-highest">Items</th>
            {cols.map(c => <th key={c} className="p-2 border-b border-surface-container-highest">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r}>
              <td className="p-2 border-b border-surface-container-highest">{r}</td>
              {cols.map(c => (
                <td key={c} className="p-2 border-b border-surface-container-highest text-center">
                  <input 
                    type={isMulti ? "checkbox" : "radio"} 
                    name={`${id}_${r}`} 
                    value={c} 
                    checked={isMulti ? (responses[id]?.[r]?.includes(c) || false) : (responses[id]?.[r] === c)}
                    onChange={(e) => isMulti ? handleMultiGridChange(id, r, c, e.target.checked) : handleGridChange(id, r, c)} 
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
      <h2 className="text-xl font-bold font-headline mb-4">Section B - Respondent's Details</h2>
      {renderInputQuestion("B.1", "Date", "date")}
      {renderInputQuestion("B.2", "Time of start of Interview", "time")}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {renderInputQuestion("B.3", "State")}
        {renderInputQuestion("B.4", "District")}
        {renderInputQuestion("B.5", "Block")}
        {renderInputQuestion("B.6", "Ward / GP")}
        {renderInputQuestion("B.7", "Village")}
        {renderInputQuestion("B.8", "Name")}
      </div>
      {renderRadioQuestion("B.9", "Gender", ["Male", "Female", "Don't want to respond", "Others"])}
      {renderInputQuestion("B.10", "What is the total number of members (including children, adults and elderly) in your household?", "number")}
      {renderCheckboxQuestion("B.11", "Do you live with following members?", ["Elderly parents or in-laws", "Adult children", "A spouse"])}
      {renderRadioQuestion("B.12", "Who is the head of your household?", ["Myself", "My spouse", "My Parents/In Laws", "Adult Son", "Adult Daughter"])}
      {renderCheckboxQuestion("B.13", "What are your source of income? Please indicate all the sources of income is currently having (Please select all that apply)", ["Wage Labour (casual or contract)", "Salaried employment (public or private sector)", "Farming on own land", "Livestock rearing (milk, meat, eggs, animal sales)", "Business or self-employment (non-agricultural)", "Agricultural services (equipment rental, custom farming)", "Fishing, forestry, or collection from commons (e.g., NTFPs, firewood)", "Remittances (from migrants or family members)", "Pension or government transfers (e.g., old-age, widow, disability)", "Rental income (land, buildings, machinery)", "Other"])}
      {renderInputQuestion("B.14", "Among the above selected, which is the primary income source for the family?")}
      {renderRadioQuestion("B.15", "Do your livelihood activities need specific equipment to produce income? (e.g., farm equipment, shops)", ["Yes", "No"])}
      <div className="space-y-3 font-sans p-4 bg-surface-container-lowest rounded border border-surface-container-highest">
        <label className="block text-sm font-semibold">B.16 Please share monthly income of your family</label>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Minimum / न्यूनतम:</span>
            <input type="number" value={responses["B.16_Min"] || ""} onChange={(e) => handleChange("B.16_Min", e.target.value)} className="bg-surface-container-high border-none rounded p-2 text-sm focus:ring-2 focus:ring-primary outline-none flex-1 max-w-[200px]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Maximum / अधिकतम:</span>
            <input type="number" value={responses["B.16_Max"] || ""} onChange={(e) => handleChange("B.16_Max", e.target.value)} className="bg-surface-container-high border-none rounded p-2 text-sm focus:ring-2 focus:ring-primary outline-none flex-1 max-w-[200px]" />
          </div>
        </div>
      </div>
      
      <div className="space-y-3 font-sans p-4 bg-surface-container-lowest rounded border border-surface-container-highest">
        <label className="block text-sm font-semibold">B.17 Please share monthly expenses of your family</label>
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
      {renderRadioQuestion("B.18", "What is the community group your family belongs to?", ["General", "OBC", "SC", "ST", "Particularly Vulnerable Tribal Groups (PVTGs)", "Minority", "Nomadic Tribes (NTs)", "Denotified Tribes (DNTs)", "Notified Tribes (NT)", "Other"])}
      {renderGridQuestion("B.19", "Who all are responsible for making decisions on the following topics (select everyone who participates):", 
        ["Education", "Skill development", "Jobs/Livelihood", "Money Matters (loans, savings etc.)", "Buying/Selling Assets", "Food", "Domestic chores (buying groceries, cooking, cleaning)", "Health (Physical)", "Health (Mental)", "Entertainment", "Spiritual & Religious", "Marriage", "NGO/Community level activities"], 
        ["Me", "Spouse", "Parents", "Adult children"], true)}
    </div>
  );

  const renderSectionC = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline mb-4">Section C - Current Life Situation</h2>
      <p className="text-sm text-on-surface-variant font-sans mb-6">
        Now I'm going to ask you a few questions about how your family feels about your current life situation and whether you want to make any changes.
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
        ["Children's Education (if applicable)", "Adult education (if applicable)", "Increasing your Income", "Major expenditures (events, weddings, festivals)", "Routine cash savings", "Cash for any unexpected crises", "Reducing high interest loans (if applicable)", "Insurance (life, livelihood, health)", "Creating assets (land, site, building home)"], 
        ["Yes", "No", "NA"])}
      {renderCheckboxQuestion("D.2", "If you need money, who would you get it from? (Multiple options)", ["Friends and family", "Nationalized banks", "Co-operative banks", "Private banks", "Self-help group", "Money lenders", "MFI (micro finance institutions)"])}
    </div>
  );

  const renderSectionE = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline mb-4">Section E - Disaster Preparedness</h2>
      <p className="text-sm text-on-surface-variant font-sans mb-6">
        Next, I'd like to understand what your family does to prepare for things like floods, storms, or other disasters.
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
        Now I'll ask about how you and your family think about disasters—whether you believe they can be planned for or not.
      </p>
      {renderRadioQuestion("F.1", "Do you think there is no need to prepare unless something actually happens?", ["Yes", "No"])}
      {renderRadioQuestion("F.2", "Some people believe disasters are just fate or God’s will, and that nothing can be done. Do you agree?", ["Yes", "No"])}
      {renderRadioQuestion("F.3", "Do you feel that no matter what you do, it won’t change what is meant to happen?", ["Yes", "No"])}
      {renderRadioQuestion("F.4", "Do you avoid thinking or talking about disasters because it is too scary or not helpful?", ["Yes", "No"])}
    </div>
  );

  const renderSectionG = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline mb-4">Section G - Disaster Mindset</h2>
      <p className="text-sm text-on-surface-variant font-sans mb-6">
        Now I'm going to ask a few questions about what your family might expect during a disaster—like whether you wait for others to help or feel it probably won't happen again.
      </p>
      {renderRadioQuestion("G.1", "If a disaster happens, do you mainly wait for the government or others to help?", ["Yes", "No"])}
      {renderRadioQuestion("G.2", "Do you depend on others to tell you what to do during a disaster?", ["Yes", "No"])}
      {renderRadioQuestion("G.3", "Do you believe disasters won’t happen again in your area?", ["Yes", "No"])}
    </div>
  );

  const renderSectionH = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline mb-4">Section H - Financial Resilience</h2>
      <p className="text-sm text-on-surface-variant font-sans mb-6">
        Now I'll ask some questions about your family's money, loans, and whether you have things like savings, insurance, or assets you could use in a crisis.
      </p>
      {renderRadioQuestion("H.1", "Do you have things like land, gold, livestock, or tools that you could sell if your family faced a crisis?", ["Yes", "No"])}
      {renderRadioQuestion("H.2", "Does your household save money regularly (e.g.month, weekly etc.)?", ["Yes", "No"])}
      {renderRadioQuestion("H.3", "Does your household have outstanding loans?", ["Yes, from formal sources", "Yes, from informal sources", "No, because I don't need loans", "No, because I can't get loans (lack of documents/assets)", "I don't know"])}
      {renderRadioQuestion("H.4", "Are you paying a high interest (more than 24% per year) for any of your outstanding loans?", ["Yes", "No"])}
      {renderGridQuestion("H.5", "What are the sources of your loans and current outstanding?", 
        ["Friends and family", "Nationalized banks", "Self-help group", "Money lenders", "MFI (micro finance institutions)", "Co-operative banks", "Private banks"], 
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
        Now I'll ask some questions some questions about your family's access to health care, insurance, clean water, and toilets
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
        Now I'll ask about whether you're part of any local groups or government programs, and who you can turn to if your family faces a crisis.
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
        ["Ration Card", "MGNREGA", "Old Age Pension", "Disability Pension", "Widow Pension", "Kissan Nidhi Scheme", "Ayushman Bharat", "Mudra Loan", "Life Insurance (PMJJBY)", "Accident Insurance (PMSBMY)", "Crop Insurance (PMFBY)"], 
        ["Not Eligible", "Not aware about eligibility", "Eligible but don't have", "I am eligible and I have"], false)}
      {renderRadioQuestion("K.2", "Do you think you can rely on government schemes during the times of crisis?", ["Yes", "No", "Not Sure"])}
    </div>
  );

  const renderSectionL = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-headline mb-4">Section L - Disaster Awareness</h2>
      <p className="text-sm text-on-surface-variant font-sans mb-6">
        Next, I'd like to ask about whether your family gets warnings before disasters and knows where to go for help if something happens.
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
        Now I'll ask few question about what your family did to cope with that shock, and whether those actions helped you recover.
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
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
      <Link href={`/beneficiaries/${id}`} className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity mb-6 w-fit font-sans font-bold text-sm">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Beneficiary Profile
      </Link>

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/10 overflow-hidden">
        {/* Progress Header */}
        <div className="bg-surface-container-low p-6 border-b border-outline-variant/10">
          <h1 className="text-2xl font-bold font-headline text-on-surface mb-2">Resilience Measurement Survey</h1>
          <div className="flex items-center justify-between text-sm font-sans text-on-surface-variant font-medium">
            <span>{sections[currentSectionIndex]}</span>
            <span>Step {currentSectionIndex + 1} of {sections.length}</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-surface-container-highest h-2 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${((currentSectionIndex + 1) / sections.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 min-h-[400px]">
          {renderCurrentSection()}
        </div>

        {/* Footer Actions */}
        <div className="bg-surface-container-low p-6 border-t border-outline-variant/10 flex items-center justify-between font-sans">
          <button 
            onClick={handlePrev}
            disabled={currentSectionIndex === 0}
            className={`px-5 py-2.5 rounded text-sm font-bold flex items-center gap-2 ${currentSectionIndex === 0 ? "opacity-50 cursor-not-allowed text-on-surface-variant" : "text-primary hover:bg-primary/10 transition-colors"}`}
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            Previous
          </button>
          
          <button 
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
              isSubmitting ? "Submitting..." : "Submit Survey"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
