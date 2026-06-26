"use client";

import kyrDict from '@/lib/kyrDictionary.json';

const sectionTitles = {
  A: "Consent",
  B: "Respondent's Details",
  C: "Current Life Situation",
  D: "Planning",
  E: "Disaster Preparedness",
  F: "Disaster Belief",
  G: "Disaster Mindset",
  H: "Financial Resilience",
  I: "Health Resilience",
  J: "Social Connect",
  K: "Social Protection",
  L: "Disaster Awareness",
  M: "Vulnerability Assessment"
};

export default function KyrReadOnlyView({ responses }) {
  if (!responses) return <div>No responses recorded.</div>;

  const renderValue = (val) => {
    if (val === null || val === undefined || val === "") return "N/A";
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === 'object') {
      return (
        <ul className="space-y-1.5 w-full">
          {Object.entries(val).map(([k, v]) => (
            <li key={k} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 border-b border-surface-container-highest last:border-0 pb-1.5 last:pb-0">
              <span className="font-bold text-on-surface text-xs min-w-[120px]">{k}:</span>
              <span className="text-on-surface-variant">{Array.isArray(v) ? v.join(", ") : String(v)}</span>
            </li>
          ))}
        </ul>
      );
    }
    return String(val);
  };

  // Group responses by section prefix
  const groupedResponses = {};
  
  Object.keys(kyrDict).forEach(key => {
    // some keys are B.16_Min, we want just 'B'
    const prefixMatch = key.match(/^([A-Z])/);
    if (prefixMatch) {
      const prefix = prefixMatch[1];
      if (!groupedResponses[prefix]) groupedResponses[prefix] = [];
      
      const val = responses[key] !== undefined ? responses[key] : (
        // Grid questions have answers like responses['B.16'] = { "row1": "col1" }
        // But our dict keys might just be 'B.16'
        responses[key]
      );

      groupedResponses[prefix].push({
        key,
        text: kyrDict[key],
        val: val
      });
    }
  });

  // Also catch any responses not in dictionary
  Object.keys(responses).forEach(key => {
    if (key === 'vulnerabilityNote' || key === 'facilitator') return;
    if (!kyrDict[key] && !kyrDict[key.split('_')[0]]) {
      const prefixMatch = key.match(/^([A-Z])/);
      const prefix = prefixMatch ? prefixMatch[1] : 'Other';
      if (!groupedResponses[prefix]) groupedResponses[prefix] = [];
      groupedResponses[prefix].push({
        key,
        text: key,
        val: responses[key]
      });
    }
  });

  return (
    <div className="font-sans space-y-12">
      {Object.keys(sectionTitles).map(prefix => {
        const questions = groupedResponses[prefix];
        if (!questions || questions.length === 0) return null;

        return (
          <div key={prefix} className="space-y-6">
            <h3 className="text-xl font-bold font-headline border-b border-surface-container-highest pb-2">
              Section {prefix} - {sectionTitles[prefix]}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {questions.map((q) => (
                <div key={q.key} className="p-4 bg-surface-container-lowest rounded-lg border border-surface-container-highest flex flex-col justify-between">
                  <p className="text-sm font-semibold text-on-surface mb-3 leading-relaxed">
                    {q.key}. {q.text}
                  </p>
                  <div className="bg-surface-container-low p-3 rounded text-sm text-on-surface-variant font-medium mt-auto">
                    {renderValue(q.val)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
