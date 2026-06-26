import React from 'react';
import kyrDict from '@/lib/kyrDictionary.json';
import { getCapacityQuestionText, getCapacityOptionLabel } from '@/lib/capacityDictionaries';

const SHOCKS_DICT = {
  "s1": "Flood", "s2": "Drought", "s3": "Cyclone", "s4": "Unseasonal Rain",
  "s5": "Crop Failure", "s6": "Extreme Cold", "s7": "Disease Outbreaks", "s8": "Others"
};

const EFFECTS_DICT = {
  "e1": "Loss of income", "e2": "Food shortage", "e3": "Illness", "e4": "Water Issues",
  "e5": "Power cuts", "e6": "Asset damage (House/Equip)", "e7": "Lost school days", "e8": "Others"
};

const PRICES_DICT = {
  "p1": "Increase in prices - Grocery", "p2": "Increase in rent / housing",
  "p3": "Increase in lease / land", "p4": "Increase in farm input prices",
  "p5": "No changes in prices (grocery & inputs)", "p6": "Decrease in Yield / Production",
  "p7": "Decrease in prices of products", "p8": "Others"
};

const HARDSHIPS_DICT = {
  "h1": "Minor and major illnesses (Fever...etc)",
  "h2": "Shortage in basic necessities (e.g. water, electricity)",
  "h3": "Difficulty in accessing technology (phones, internet)",
  "h4": "Theft of household & Farm assets",
  "h5": "Shortage of Cash", "h6": "Others"
};

export default function SurveyResponseViewer({ type, responses, planData }) {
  if (!responses && !planData) return null;

  const renderValue = (val) => {
    if (val === null || val === undefined) return "N/A";
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === 'object') {
      return Object.entries(val).map(([k, v]) => `${k}: ${v}`).join(" | ");
    }
    return String(val);
  };

  if (type === 'solution-plan' && planData) {
    return (
      <div className="mt-4 p-4 bg-surface-container-lowest rounded-lg border border-surface-container-highest space-y-4">
        <h4 className="font-bold text-primary border-b border-surface-container-highest pb-2">Action Plan Highlights</h4>
        <p className="text-sm">Total Priorities Targeted: <span className="font-bold">{planData.numAreasPrioritized || 0}</span></p>
        
        {planData.priorities && planData.priorities.map((p, i) => (
          <div key={i} className="bg-surface-container-low/30 p-3 rounded border border-surface-container-highest">
            <h5 className="font-bold text-on-surface text-sm mb-2">{p.name}</h5>
            <ul className="list-disc pl-5 space-y-2">
              {p.activities && p.activities.map((act, j) => (
                <li key={j} className="text-xs text-on-surface-variant">
                  <span className="font-semibold text-on-surface">{act.activity}</span>
                  <div className="mt-1 flex gap-4 text-[10px] text-slate-500">
                    <span>Timeframe: {act.timeframe || 'N/A'}</span>
                    <span>Resources: {act.resources || 'N/A'}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'vulnerability') {
    const qData = [
      { id: 'q1', text: "What are the shocks you faced?", dict: SHOCKS_DICT },
      { id: 'q2', text: "What was the effect of this shock on you and your family?", dict: EFFECTS_DICT },
      { id: 'q3', text: "What was the immediate effect on the prices of basic necessities?", dict: PRICES_DICT },
      { id: 'q4', text: "What are the hardships your family faced immediately?", dict: HARDSHIPS_DICT },
    ];

    return (
      <div className="mt-4 space-y-3">
        {qData.map(q => {
          const ans = responses[q.id];
          if (!ans || (!ans.selected?.length && !ans.othersText)) return null;
          return (
            <div key={q.id} className="p-3 bg-surface-container-lowest rounded-lg border border-surface-container-highest text-sm">
              <p className="font-bold text-on-surface mb-2">{q.text}</p>
              <ul className="list-disc pl-5 space-y-1 text-on-surface-variant">
                {ans.selected?.map(s => (
                  <li key={s}>
                    {q.dict[s] || s} 
                    {s === 's8' || s === 'e8' || s === 'p8' || s === 'h8' ? ` (${ans.othersText})` : ''}
                    {ans.severity && ans.severity[s] && <span className="ml-2 px-2 py-0.5 bg-error-container text-on-error-container rounded text-[10px] font-bold uppercase">Severity: {ans.severity[s]}</span>}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    );
  }

  // KYR or Capacity
  return (
    <div className="mt-4 space-y-2">
      {Object.entries(responses).map(([key, val]) => {
        if (key === 'vulnerabilityNote' || key === 'facilitator') return null;
        
        let questionText = key;
        let formattedVal = val;
        
        if (type === 'kyr') {
          // Check for sub-questions or exact match
          questionText = kyrDict[key] || kyrDict[key.split('_')[0]] || key;
        } else if (['adaptive', 'absorptive', 'transformative'].includes(type)) {
          questionText = getCapacityQuestionText(type, key);
          formattedVal = getCapacityOptionLabel(type, key, val);
        }

        return (
          <div key={key} className="p-3 bg-surface-container-lowest rounded-lg border border-surface-container-highest text-sm">
            <p className="font-bold text-on-surface mb-1">{questionText}</p>
            <p className="text-on-surface-variant font-medium bg-surface-container-low p-2 rounded inline-block w-full">
              {renderValue(formattedVal)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
