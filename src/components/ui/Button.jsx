"use client";

const VARIANTS = {
  primary: "bg-primary text-white hover:bg-primary-container",
  secondary: "bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/20",
  outline: "border border-outline-variant text-on-surface hover:bg-surface-container-low bg-transparent",
  danger: "bg-error text-white hover:opacity-90",
  ghost: "text-primary hover:bg-primary/10 bg-transparent",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  icon: "p-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
  children,
  ...props
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
    VARIANTS[variant] || VARIANTS.primary
  } ${SIZES[size] || SIZES.md} ${className}`;

  return (
    <button type={type} disabled={disabled} className={classes} {...props}>
      {children}
    </button>
  );
}
