"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { solutionBoardData, gramPanchayatContacts, ngoContacts } from "@/data/solutionBoardData";

const renderSupportText = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.gov\.in|[a-zA-Z0-9.-]+\.nic\.in|[a-zA-Z0-9.-]+\.org|[a-zA-Z0-9.-]+\.1ngo\.in)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a key={index} href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function SolutionBoardReferencePage() {
  const params = useParams();
  const id = params?.id;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full font-sans">
      <Link href={`/beneficiaries/${id}`} className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity mb-6 w-fit font-bold text-sm">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Beneficiary Profile
      </Link>

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/10 overflow-hidden mb-8">
        <div className="bg-surface-container-low p-6 border-b border-outline-variant/10">
          <h1 className="text-3xl font-bold font-headline text-on-surface">Resilience- Solution Board</h1>
        </div>

        <div className="p-6 md:p-8 space-y-8 text-on-surface leading-relaxed">
          
          <section>
            <h2 className="text-xl font-bold font-headline mb-4">Background:</h2>
            <p className="mb-4">
              Resilience is the ability of individuals and households to cope with shock, adapt, and recover without
              sacrificing their long-term well-being. The Resilience Index helps households understand their ability to
              manage shocks, based on their response to previous shocks, by assessing their <strong>absorptive, adaptive, and
              transformative</strong> capacities. Through this process, households generate a Resilience Score that highlights
              their strengths and areas needing improvement. For many vulnerable households financial instability,
              limited access to healthcare and education, food insecurity, and unexpected crises—can make it hard to
              build their resilience. While the Resilience Score helps households identify their gaps, knowing the gaps
              is not enough. Households must prioritize key areas and create a solution plan to strengthen their
              resilience.
            </p>
            <p className="mb-4">
              Despite the importance of resilience-building, both households and facilitators face challenges when
              trying to create a solution plan:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Many households are not aware about what solutions are available or where to seek help.</li>
              <li>Some households lack training in financial planning, health management, and livelihood improvement.</li>
              <li>Without guidance, households struggle to decide which resilience gaps to address first.</li>
              <li>Some households are unaware of community programs that could help them.</li>
              <li>Many households feel discouraged by multiple challenges and don't know where to start.</li>
            </ul>
            <p>
              To address these issues, we are planning to develop the Solution Board as a structured, user-friendly tool
              that helps households step by step identify problems, explore solutions, and create a practical action plan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold font-headline mb-4">What is the Solution Board?</h2>
            <p>
              The Solution Board is an indicative planning tool that helps households strengthen their resilience by
              addressing the identified gaps. It provides a list of 'solutions' that households can choose to work
              on/engage with based on their current capacities and needs. Instead of a one-size-fits-all approach, the
              Solution Board allows households to select the steps that work best for their situation. In short, the
              Solution Board is not just a tool—it's a bridge between knowledge and action.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold font-headline mb-4">How Does It Work?</h2>
            <p className="mb-4">
              The Solution Board follows the principles of the Resilience Index, which measures how well a household
              can absorb shocks, adapt to change, and transform their situation.
            </p>
            <p className="mb-4">
              To create a solution plan, households answer four key questions for each priority area:
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-surface-container p-4 rounded-lg">
                <h3 className="font-bold mb-2">1. Why don't I have this indicator in green?</h3>
                <ul className="list-disc pl-6 text-sm space-y-1">
                  <li>Helps households think about the root causes of their challenges—whether financial, social, behavioral, or structural.</li>
                  <li>Encourages self-awareness by identifying habits or external factors affecting their resilience.</li>
                </ul>
              </div>

              <div className="bg-surface-container p-4 rounded-lg">
                <h3 className="font-bold mb-2">2. What can I do to move this indicator to green?</h3>
                <ul className="list-disc pl-6 text-sm space-y-1">
                  <li>Households explore realistic and achievable actions based on their abilities and available resources.</li>
                  <li>The Solution Board provides a menu of possible actions, allowing households to choose what fits their situation best.</li>
                </ul>
              </div>

              <div className="bg-surface-container p-4 rounded-lg">
                <h3 className="font-bold mb-2">3. Who can support me to achieve this?</h3>
                <ul className="list-disc pl-6 text-sm space-y-1">
                  <li>Resilience is not built alone—households need support from community members, NGOs, local governments, and service providers.</li>
                  <li>The Solution Board helps households connect with these resources and teaches them how to seek help effectively.</li>
                </ul>
              </div>

              <div className="bg-surface-container p-4 rounded-lg">
                <h3 className="font-bold mb-2">4. How much time will I need to get there?</h3>
                <ul className="list-disc pl-6 text-sm space-y-1">
                  <li>Establishes a clear and realistic timeline for achieving goals.</li>
                  <li>Helps households to track progress, stay committed, and stay motivated.</li>
                </ul>
              </div>
            </div>

            <p className="mb-4 italic text-on-surface-variant">
              For example, if a household prioritizes Financial Resilience, they might recognize that they lack budgeting
              skills. The Solution Board would provide practical steps like creating a financial plan, tracking expenses,
              or joining a local savings group.
            </p>
            <p className="italic text-on-surface-variant">
              Similarly, if a household wants to improve Health Resilience, the Solution Board might suggest better
              nutrition, accessing healthcare services, health insurance, practicing prevention, while also connecting
              them to local clinics and health workers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold font-headline mb-4">Why is the Solution Board Important?</h2>
            <p className="mb-4">
              The Solution Board is an essential tool because it transforms knowledge into action. It helps vulnerable
              households identify their challenges, explore practical solutions, and create a realistic plan to improve
              their resilience. Here's why it matters:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Empowers households to take charge of their resilience journey.</li>
              <li>Provides clear and practical guidance tailored to each household's situation.</li>
              <li>Strengthens community collaboration by encouraging connections with local networks.</li>
              <li>Encourages long-term commitment by helping households set achievable and realistic goals.</li>
            </ul>
            <p className="font-semibold">
              By using the Solution Board, vulnerable households can systematically improve their resilience without
              compromising their well-being, supporting the vision of the Resilience Movement.
            </p>
          </section>

          <hr className="border-surface-container-highest my-8" />

          <section>
            <h2 className="text-2xl font-bold font-headline mb-6 text-primary">Solution Board Reference Options</h2>
            <p className="mb-6 text-sm text-on-surface-variant">
              Use the table below to explore potential options and sources of support for various resilience indicators.
            </p>
            
            <div className="w-full overflow-x-auto border border-surface-container-highest rounded-xl bg-surface-container-lowest">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-primary/10">
                    <th className="border border-surface-container-highest p-4 font-bold text-on-surface w-[20%]">Category</th>
                    <th className="border border-surface-container-highest p-4 font-bold text-on-surface w-[50%]">Options</th>
                    <th className="border border-surface-container-highest p-4 font-bold text-on-surface w-[30%]">Source of Support</th>
                  </tr>
                </thead>
                <tbody>
                  {solutionBoardData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="border border-surface-container-highest p-4 font-bold text-primary align-top">
                        {row.category}
                      </td>
                      <td className="border border-surface-container-highest p-4 align-top">
                        <ul className="list-disc pl-5 space-y-2 text-sm text-on-surface">
                          {row.options.map((opt, i) => (
                            <li key={i}>{opt}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="border border-surface-container-highest p-4 align-top">
                        <ul className="list-disc pl-5 space-y-2 text-sm text-on-surface">
                          {row.support.map((sup, i) => (
                            <li key={i}>{renderSupportText(sup)}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <hr className="border-surface-container-highest my-8" />

          <section>
            <h2 className="text-2xl font-bold font-headline mb-6 text-primary">Gram Panchayat Contact Details</h2>
            <div className="w-full overflow-x-auto border border-surface-container-highest rounded-xl bg-surface-container-lowest">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-primary/10">
                    <th className="border border-surface-container-highest p-4 font-bold text-on-surface w-[30%]">Gram Panchayat</th>
                    <th className="border border-surface-container-highest p-4 font-bold text-on-surface w-[40%]">Panchayat Development Officer (PDO)</th>
                    <th className="border border-surface-container-highest p-4 font-bold text-on-surface w-[30%]">Contact Number</th>
                  </tr>
                </thead>
                <tbody>
                  {gramPanchayatContacts.map((row, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="border border-surface-container-highest p-4 text-on-surface">{row.panchayat}</td>
                      <td className="border border-surface-container-highest p-4 text-on-surface">{row.pdo}</td>
                      <td className="border border-surface-container-highest p-4 text-primary font-semibold">{row.number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <hr className="border-surface-container-highest my-8" />

          <section>
            <h2 className="text-2xl font-bold font-headline mb-6 text-primary">Additional NGOs/Training Centers for Kanakapura</h2>
            <div className="w-full overflow-x-auto border border-surface-container-highest rounded-xl bg-surface-container-lowest">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-primary/10">
                    <th className="border border-surface-container-highest p-4 font-bold text-on-surface w-[30%]">Organization Name</th>
                    <th className="border border-surface-container-highest p-4 font-bold text-on-surface w-[30%]">Focus Area</th>
                    <th className="border border-surface-container-highest p-4 font-bold text-on-surface w-[20%]">Contact Number</th>
                    <th className="border border-surface-container-highest p-4 font-bold text-on-surface w-[20%]">Website</th>
                  </tr>
                </thead>
                <tbody>
                  {ngoContacts.map((row, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="border border-surface-container-highest p-4 text-on-surface font-semibold">{row.name}</td>
                      <td className="border border-surface-container-highest p-4 text-on-surface">{row.focus}</td>
                      <td className="border border-surface-container-highest p-4 text-on-surface">{row.number || "-"}</td>
                      <td className="border border-surface-container-highest p-4 text-primary">
                        <a href={`https://${row.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {row.website}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
