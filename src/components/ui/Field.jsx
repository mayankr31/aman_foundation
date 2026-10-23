"use client";

// Standard, reusable form field with mandatory asterisk + inline error.
// onChange receives the native event (e) for input/select/textarea.
export default function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  options,
  error,
  hint,
  rows,
  disabled = false,
  className = "",
  ...rest
}) {
  const base =
    "w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary bg-transparent text-on-surface text-sm disabled:opacity-60";

  const borderClass = error ? "border-error" : "border-outline-variant";
  const inputClasses = `${base} ${borderClass}`;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={name} className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}

      {options ? (
        <select
          id={name}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={inputClasses}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o, index) => {
            const optValue = typeof o === "string" ? o : o.value;
            const optLabel = typeof o === "string" ? o : o.label;
            return (
              <option key={`${optValue}-${index}`} value={optValue}>
                {optLabel}
              </option>
            );
          })}
        </select>
      ) : rows ? (
        <textarea
          id={name}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          required={required}
          disabled={disabled}
          rows={rows}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={inputClasses}
          {...rest}
        />
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={inputClasses}
          {...rest}
        />
      )}

      {hint && !error && (
        <span className="text-[11px] text-on-surface-variant">{hint}</span>
      )}
      {error && <span className="text-[11px] font-medium text-error">{error}</span>}
    </div>
  );
}
