"use client";

export default function EmptyState({
  icon = "inbox",
  title,
  message,
  variant = "card",
  colSpan,
  className = "",
  action,
}) {
  if (variant === "table") {
    return (
      <tr>
        <td colSpan={colSpan || 1} className={`py-12 text-center text-on-surface-variant font-sans text-sm ${className}`}>
          <div className="flex flex-col items-center justify-center gap-2">
            {icon && <span className="material-symbols-outlined text-3xl opacity-40">{icon}</span>}
            {title && <span className="font-semibold">{title}</span>}
            {message && <span className="text-xs opacity-80">{message}</span>}
          </div>
        </td>
      </tr>
    );
  }

  if (variant === "inline") {
    return (
      <p className={`text-sm text-on-surface-variant text-center py-8 italic ${className}`}>
        {message || title}
      </p>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 text-center bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 text-on-surface-variant ${className}`}
    >
      {icon && <span className="material-symbols-outlined text-3xl opacity-40">{icon}</span>}
      {title && <p className="font-headline font-semibold text-on-surface">{title}</p>}
      {message && <p className="text-xs opacity-80 max-w-sm">{message}</p>}
      {action}
    </div>
  );
}
