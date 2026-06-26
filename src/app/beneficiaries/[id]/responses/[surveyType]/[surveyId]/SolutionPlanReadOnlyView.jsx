"use client";

export default function SolutionPlanReadOnlyView({ planData }) {
  if (!planData) return <div>No plan data available.</div>;

  return (
    <div className="font-sans space-y-8">
      <div className="bg-primary/10 p-6 rounded-xl border border-primary/20 text-center">
        <h3 className="text-2xl font-bold text-primary mb-2">Customized Action Plan</h3>
        <p className="text-on-surface-variant max-w-2xl mx-auto">
          This is a roadmap of actionable priorities tailored for this household to build resilience and improve their capacity over time.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-3xl font-bold text-on-surface">{planData.numAreasPrioritized || 0}</span>
          <span className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">Focus Areas Targeted</span>
        </div>
      </div>

      <div className="space-y-6">
        {planData.priorities && planData.priorities.map((p, i) => (
          <div key={i} className="bg-surface-container-lowest p-0 rounded-xl border border-surface-container-highest overflow-hidden shadow-sm">
            {/* Priority Header */}
            <div className="bg-surface-container-low px-6 py-4 border-b border-surface-container-highest flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold shadow-sm">
                {i + 1}
              </div>
              <h4 className="text-lg font-bold text-on-surface">{p.name}</h4>
            </div>

            {/* Activities List */}
            <div className="p-6 space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Planned Interventions</h5>
              {p.activities && p.activities.length > 0 ? (
                <ul className="space-y-3">
                  {p.activities.map((act, j) => (
                    <li key={j} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-surface-container-low/50 border border-surface-container-highest hover:bg-surface-container-low transition-colors">
                      <div className="flex items-start gap-3 flex-grow">
                        <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                        <p className="text-sm font-semibold text-on-surface">{act.activity}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-500 sm:w-80 flex-shrink-0">
                        <div className="flex flex-col w-1/3">
                          <span className="uppercase tracking-wider text-[9px] mb-1">Timeline</span>
                          <span className="truncate" title={act.timeline}>{act.timeline || "N/A"}</span>
                        </div>
                        <div className="flex flex-col w-1/3">
                          <span className="uppercase tracking-wider text-[9px] mb-1">Support Needed?</span>
                          <span className="truncate" title={act.supportNeeded}>{act.supportNeeded || "N/A"}</span>
                        </div>
                        <div className="flex flex-col w-1/3">
                          <span className="uppercase tracking-wider text-[9px] mb-1">By Whom?</span>
                          <span className="truncate" title={act.byWhom}>{act.byWhom || "N/A"}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-on-surface-variant italic">No specific activities planned for this area.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
