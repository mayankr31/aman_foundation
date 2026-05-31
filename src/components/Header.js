"use client";

export default function Header({ onMenuToggle }) {
  return (
    <header className="bg-white/85 dark:bg-slate-950/85 backdrop-blur-md text-teal-700 dark:text-teal-400 font-sans text-sm tracking-wide uppercase font-semibold sticky top-0 z-40 w-full flex justify-between items-center h-16 px-8 border-b border-surface-container/50 transition-all duration-300 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="md:hidden text-slate-500 hover:text-teal-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="text-xl font-black text-slate-900 dark:text-white normal-case tracking-normal">
          Impact Portal
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <button className="text-slate-500 hover:text-teal-600 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full p-2 flex items-center justify-center">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-slate-500 hover:text-teal-600 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full p-2 flex items-center justify-center">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
        <div className="w-8 h-8 rounded-full bg-surface-container overflow-hidden shrink-0">
          <img
            alt="User profile avatar"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCy0YC_TGbMxUogj7u6FlVKznrRAyySoM1Wk5t86itV9-_WFTvj8S0Yzjr9GbBo8Bfm5nmRm_UZNvqkNLAOwajxpIHTPsvU3uWB_8oQCTDeLlTy5FFvFEdJbGbOLV8T87s7JItDrrR2LELtEkIRHVgt-MZ4wCsnMNliGHkwJgzEzPmZLJ3RyksBBrHyBQUOrsN9TswbWGEUCWg7Kct8wDcojEkOb4jbZtq_alD8mtnNZfS9PFgwiRKdk4k-6T8WSccDJBrvSEgUpobq"
          />
        </div>
      </div>
    </header>
  );
}
