"use client";

import KyrReadOnlyView from "./KyrReadOnlyView";
import CapacityReadOnlyView from "./CapacityReadOnlyView";
import VulnerabilityReadOnlyView from "./VulnerabilityReadOnlyView";
import SolutionPlanReadOnlyView from "./SolutionPlanReadOnlyView";

export default function ResponseViewerClient({ surveyType, surveyData, beneficiaryId }) {
  const getSurveyTitle = () => {
    switch (surveyType) {
      case 'kyr': return "Resilience KYR Tool Survey";
      case 'adaptive': return "Adaptive Capacity Survey";
      case 'absorptive': return "Absorptive Capacity Survey";
      case 'transformative': return "Transformative Capacity Survey";
      case 'vulnerability': return "Vulnerability Assessment";
      case 'solution-plan': return "Solution Plan";
      default: return "Survey Responses";
    }
  };

  const getSurveyIcon = () => {
    switch (surveyType) {
      case 'kyr': return "assignment";
      case 'adaptive': return "trending_up";
      case 'absorptive': return "shield";
      case 'transformative': return "architecture";
      case 'vulnerability': return "warning";
      case 'solution-plan': return "flag";
      default: return "assignment";
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-ambient border border-outline-variant/10 space-y-6 relative overflow-hidden">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-secondary"></div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-container-highest">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2 font-headline">
            <span className="material-symbols-outlined text-primary text-3xl font-bold">{getSurveyIcon()}</span>
            {getSurveyTitle()}
          </h2>
          <p className="text-sm text-on-surface-variant font-sans mt-1">
            Submitted on {new Date(surveyData.surveyDate || surveyData.createdAt || Date.now()).toLocaleDateString()}
          </p>
        </div>
        
        {surveyData.overallScore !== undefined && (
          <div className="bg-surface-container-high px-4 py-2 rounded-lg text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Overall Score</p>
            <p className="text-xl font-bold text-primary">{parseFloat(surveyData.overallScore).toFixed(2)}</p>
          </div>
        )}
      </div>

      <div className="pt-2">
        {surveyType === 'kyr' && <KyrReadOnlyView responses={surveyData.responses} />}
        {(surveyType === 'adaptive' || surveyType === 'absorptive' || surveyType === 'transformative') && 
          <CapacityReadOnlyView type={surveyType} responses={surveyData.responses} />
        }
        {surveyType === 'vulnerability' && <VulnerabilityReadOnlyView responses={surveyData.responses} />}
        {surveyType === 'solution-plan' && <SolutionPlanReadOnlyView planData={surveyData.planData} />}
      </div>
    </div>
  );
}
