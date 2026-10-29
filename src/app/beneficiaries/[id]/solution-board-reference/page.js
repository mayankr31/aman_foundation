"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { solutionBoardData } from "@/data/solutionBoardData";

const renderSupportText = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.gov\.in|[a-zA-Z0-9.-]+\.nic\.in|[a-zA-Z0-9.-]+\.org|[a-zA-Z0-9.-]+\.1ngo\.in)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      const href = part.startsWith("http") ? part : `https://${part}`;
      return (
        <a key={index} href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
          {part}
        </a>
      );
    }
    return part;
  });
};

const howToUseSteps = [
  {
    title: "Identify the challenge",
    description:
      "What is affecting the household most? Consider the root causes and how flood seasons, erosion, health, education, income, or social barriers affect the family."
  },
  {
    title: "Choose a priority",
    description:
      "Select one or two urgent and achievable priorities first. Use the household's Resilience Index or discussion to identify gaps."
  },
  {
    title: "Choose practical actions",
    description:
      "Agree on actions that fit the family's capacities, preferences, safety, and available resources. Do not assume every household needs the same solution."
  },
  {
    title: "Identify support",
    description:
      "List who can help: family members, neighbours, SHGs, Gaon Panchayat, ASHA/ANM, Anganwadi, school, bank, agriculture or veterinary staff, ASRLM, local administration, or AMAN Foundation."
  },
  {
    title: "Set a timeline and review",
    description:
      "Agree on who will do what and by when. Review progress during follow-up visits and update the plan when circumstances change."
  }
];

const actionPlanFields = [
  "Priority gap",
  "Root cause / risk",
  "Action chosen",
  "Who will help?",
  "By when?",
  "Progress / follow-up"
];

const exampleTimeline = [
  {
    when: "Within one week",
    detail:
      "Identify a safer storage point for documents, seeds, feed, medicines, and school materials; list emergency contacts and a safe route."
  },
  {
    when: "Within one month",
    detail:
      "Speak with agriculture and veterinary staff about locally suitable crops, animal care, and flood-season preparation; check eligibility for relevant support."
  },
  {
    when: "Within two months",
    detail:
      "Explore a small kitchen garden or suitable secondary income activity based on land, labour, market access, and household preference."
  },
  {
    when: "At each follow-up",
    detail:
      "Review what was completed, barriers faced, changes in flood risk, and whether the plan should be revised."
  }
];

const facilitatorChecklist = [
  "Explain that the household owns the plan and can decline any proposed action.",
  "Ask permission before recording personal information or taking photographs; keep household data confidential.",
  "Prioritise immediate safety, food, shelter, health, child protection, and urgent documentation needs.",
  "Use locally understandable language and visual prompts; adapt for literacy, disability, gender, and age.",
  "Verify scheme details, eligibility, deadlines, and service availability before making a referral.",
  "Record referrals and follow-up dates; do not promise approval, funds, or services.",
  "Review progress after floods or other major shocks and revise the plan with the household."
];

function SectionHeading({ number, title }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {number}
      </span>
      <h2 className="text-xl md:text-2xl font-bold font-headline text-on-surface leading-tight pt-0.5 min-w-0 break-words">
        {title}
      </h2>
    </div>
  );
}

export default function SolutionBoardReferencePage() {
  const params = useParams();
  const id = params?.id;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full font-sans">
      <Link href={`/beneficiaries/${id}`} className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity mb-4 w-fit font-bold text-sm">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Beneficiary Profile
      </Link>

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/10 overflow-hidden mb-8">
        <header className="bg-surface-container-low p-5 md:p-8 border-b border-outline-variant/10">
          <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.22em] text-primary mb-2">
            AMAN Foundation
          </p>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-on-surface">
            Household Resilience Solution Board
          </h1>
          <p className="mt-2 text-sm md:text-base font-semibold text-on-surface break-words">
            Assam-Centric Adaptation <span className="text-on-surface-variant font-normal">|</span> Barpeta District, Assam
          </p>
          <p className="mt-1 text-sm italic text-on-surface-variant">Sustainable Livelihood with Dignity</p>
        </header>

        <div className="p-5 md:p-8 space-y-10 text-on-surface leading-relaxed">
          <section>
            <SectionHeading number="1" title="Purpose and local context" />
            <div className="space-y-4 max-w-4xl text-[15px] md:text-base">
              <p>
                The AMAN Foundation Household Resilience Solution Board is a practical, community-led planning tool for
                households in Barpeta district, including flood-prone riverine Char-Chapori communities along the
                Brahmaputra and Beki river systems. It helps families identify priority risks, select realistic actions,
                connect with available services, and track progress. The tool should be adapted to each household&apos;s
                situation, language, resources, disability and care needs, and seasonal livelihood calendar.
              </p>
              <p>
                Resilience means being able to prepare for, withstand, adapt to, and recover from shocks without
                sacrificing long-term wellbeing. In this context, shocks may include floods, riverbank erosion, loss of
                crops or livestock, illness, school disruption, unemployment, rising costs, and damage to homes or
                essential documents. The Solution Board builds on three capacities: <strong>absorptive</strong> (cope with
                immediate shocks), <strong>adaptive</strong> (adjust livelihoods and practices), and{" "}
                <strong>transformative</strong> (access systems, services, rights, and opportunities that enable
                longer-term change).
              </p>
            </div>
          </section>

          <section>
            <SectionHeading number="2" title="How to use the Solution Board" />
            <div className="space-y-3">
              {howToUseSteps.map((step, index) => (
                <div key={step.title} className="flex items-start gap-3 md:gap-4 rounded-lg border border-outline-variant/15 bg-surface-container-low/50 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-on-surface">{step.title}</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading number="3" title="Assam-centric solution menu" />

            <div className="w-full overflow-x-auto border border-surface-container-highest rounded-xl bg-surface-container-lowest">
              <table className="mobile-card-table w-full table-fixed text-left border-collapse min-w-[900px]">
                <caption className="sr-only">Assam-centric solution menu</caption>
                <thead>
                  <tr className="bg-primary/10">
                    <th scope="col" className="border border-surface-container-highest p-4 font-bold text-on-surface w-[22%]">Priority area</th>
                    <th scope="col" className="border border-surface-container-highest p-4 font-bold text-on-surface w-[48%]">Possible household actions</th>
                    <th scope="col" className="border border-surface-container-highest p-4 font-bold text-on-surface w-[30%]">Potential support / referral</th>
                  </tr>
                </thead>
                <tbody>
                  {solutionBoardData.map((row) => (
                    <tr key={row.category} className="hover:bg-surface-container-low/50 transition-colors">
                      <td data-label="" className="border border-surface-container-highest p-4 font-bold text-primary align-top max-md:col-span-2">
                        {row.category}
                      </td>
                      <td data-label="Possible household actions" className="border border-surface-container-highest p-4 align-top max-md:col-span-2">
                        <ul className="list-disc pl-5 space-y-2 text-sm text-on-surface">
                          {row.options.map((option, index) => (
                            <li key={index}>{option}</li>
                          ))}
                        </ul>
                      </td>
                      <td data-label="Potential support / referral" className="border border-surface-container-highest p-4 align-top max-md:col-span-2">
                        <ul className="list-disc pl-5 space-y-2 text-sm text-on-surface">
                          {row.support.map((support, index) => (
                            <li key={index}>{renderSupportText(support)}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <SectionHeading number="4" title="Household action plan" />
            <p className="max-w-4xl mb-5 text-[15px] md:text-base">
              Complete this with the household in the language they are most comfortable using. Agree on priorities
              together; do not impose actions or promise benefits.
            </p>

            <div className="w-full overflow-x-auto border border-surface-container-highest rounded-xl bg-surface-container-lowest">
              <table className="mobile-card-table w-full table-fixed text-left border-collapse min-w-[900px]">
                <caption className="sr-only">Household action plan template</caption>
                <thead>
                  <tr className="bg-primary/10">
                    {actionPlanFields.map((field) => (
                      <th key={field} scope="col" className="border border-surface-container-highest p-3 font-bold text-on-surface text-sm">
                        {field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {actionPlanFields.map((field) => (
                      <td key={field} data-label={field} className="border border-surface-container-highest p-3 align-top max-md:col-span-2">
                        <div className="h-12 rounded-md border border-dashed border-outline-variant/30 bg-surface-container-low/30" />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-on-surface-variant">
              Use one row per priority gap. To complete and save this plan for the household, use the{" "}
              <Link href={`/beneficiaries/${id}/solution-plan`} className="text-primary font-semibold hover:underline">
                Create Solution Plan
              </Link>{" "}
              page.
            </p>
          </section>

          <section>
            <SectionHeading number="5" title="Example: a flood-affected household in Barpeta" />
            <div className="rounded-xl border border-primary/15 bg-primary/5 p-5">
              <p className="max-w-4xl text-sm md:text-[15px]">
                <span className="font-bold text-on-surface">Situation:</span> A household in a low-lying village reports
                repeated flood damage to vegetable crops, poultry losses, interruptions to children&apos;s schooling, and
                borrowing for emergency expenses. The family chooses two first priorities: protect essential assets during
                floods and reduce dependence on one source of income.
              </p>
              <div className="mt-4 space-y-3">
                {exampleTimeline.map((item) => (
                  <div key={item.when} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <p className="text-sm text-on-surface">
                      <span className="font-bold">{item.when}:</span> {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <SectionHeading number="6" title="AMAN Foundation facilitator checklist" />
            <ul className="grid gap-3 md:grid-cols-2">
              {facilitatorChecklist.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-lg border border-outline-variant/15 bg-surface-container-low/50 p-3 text-sm">
                  <span className="material-symbols-outlined shrink-0 text-primary text-[20px]">check_circle</span>
                  <span className="min-w-0 break-words">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <footer className="border-t border-surface-container-highest px-5 md:px-8 py-4 text-xs leading-relaxed text-on-surface-variant">
          AMAN Foundation <span className="px-1">|</span> Household Resilience Solution Board{" "}
          <span className="px-1">|</span> Barpeta, Assam
        </footer>
      </div>
    </div>
  );
}
