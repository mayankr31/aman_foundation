"use client";

/**
 * Compact pill-style Yes/No selector used for optional document fields.
 */
export default function YesNoToggle({
  value,
  onChange,
  label = "Yes or no",
  yesLabel = "Yes",
  noLabel = "No",
}) {
  const options = [
    { value: "yes", label: yesLabel },
    { value: "no", label: noLabel },
  ];

  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-outline-variant bg-surface-container-lowest p-0.5"
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              active
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
