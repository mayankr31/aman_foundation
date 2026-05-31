import Link from "next/link";

export default function LivelihoodHub() {
  return (
    <main className="flex-1 p-12 bg-surface">
      <Link
        href="/"
        className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal">
          arrow_back
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Back to Dashboard
        </span>
      </Link>

      {/* Hero Section */}
      <div className="mb-16 max-w-4xl">
        <h2 className="text-display-md font-headline text-on-surface mb-6">
          Livelihood Management
        </h2>
        <p className="text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
          Oversee and optimize community economic development programs. Manage livestock health, track agricultural yields, and monitor beneficiary resilience scores across diverse livelihood initiatives.
        </p>
      </div>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Card 1: Goat Rearing */}
        <Link
          className="block group bg-surface-container-lowest rounded-lg p-8 ambient-shadow hover:-translate-y-1 transition-transform duration-300 h-full flex flex-col justify-between"
          href="/livelihood/goat-rearing"
        >
          <div>
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-6 text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
                pets
              </span>
            </div>
            <h3 className="text-xl font-headline font-semibold text-on-surface mb-3 group-hover:text-primary transition-colors">
              Goat Rearing
            </h3>
            <p className="text-body-md text-on-surface-variant">
              Manage livestock distribution, track vaccination schedules, and monitor flock growth metrics for beneficiary families.
            </p>
          </div>
          <div className="mt-8 flex items-center justify-between">
            <span className="text-label-md text-primary font-medium tracking-widest">
              Manage Module
            </span>
            <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </Link>

        {/* Card 2: Sugarcane Cultivation */}
        <Link
          className="block group bg-surface-container-lowest rounded-lg p-8 ambient-shadow hover:-translate-y-1 transition-transform duration-300 h-full flex flex-col justify-between"
          href="/livelihood/sugarcane"
        >
          <div>
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-6 text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
                agriculture
              </span>
            </div>
            <h3 className="text-xl font-headline font-semibold text-on-surface mb-3 group-hover:text-primary transition-colors">
              Sugarcane Cultivation
            </h3>
            <p className="text-body-md text-on-surface-variant">
              Track crop cycles, monitor fertilizer usage, and record harvest yields to optimize agricultural output and profitability.
            </p>
          </div>
          <div className="mt-8 flex items-center justify-between">
            <span className="text-label-md text-primary font-medium tracking-widest">
              Manage Module
            </span>
            <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </Link>

        {/* Card 3: Beneficiaries Master */}
        <Link
          className="block group bg-primary rounded-lg p-8 ambient-shadow hover:-translate-y-1 transition-transform duration-300 h-full flex flex-col justify-between relative overflow-hidden"
          href="/beneficiaries"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-container rounded-full opacity-50 blur-2xl"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center mb-6 text-on-primary">
              <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
                group
              </span>
            </div>
            <h3 className="text-xl font-headline font-semibold text-on-primary mb-3">
              Beneficiaries Master
            </h3>
            <p className="text-body-md text-on-primary/80">
              Central database for all program participants. View complete profiles, resilience scoring, and cross-module engagement data.
            </p>
          </div>
          <div className="mt-8 flex items-center justify-between relative z-10">
            <span className="text-label-md text-primary-fixed font-medium tracking-widest">
              Access Database
            </span>
            <span className="material-symbols-outlined text-primary-fixed group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </Link>
      </div>
    </main>
  );
}
