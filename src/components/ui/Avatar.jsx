"use client";

import { useState } from "react";

export function getInitials(name = "") {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Renders an avatar image with a graceful initials fallback.
 * If the image URL is missing or fails to load, the provided fallback (or
 * initials derived from `name`) is rendered instead of a broken image.
 */
export default function Avatar({
  src,
  name,
  fallback,
  alt,
  className = "w-full h-full object-cover",
  fallbackClassName = "",
  onClick,
  title,
  ...rest
}) {
  // Track the exact URL that failed so changing `src` automatically retries.
  const [failedSrc, setFailedSrc] = useState(null);
  const hasSrc = Boolean(src) && src !== "null" && src !== "undefined";
  const failed = hasSrc && failedSrc === src;

  if (!hasSrc || failed) {
    return (
      <span aria-hidden="true" className={fallbackClassName}>
        {fallback ?? getInitials(name)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt || name || "avatar"}
      className={className}
      onClick={onClick}
      title={title}
      onError={() => setFailedSrc(src)}
      {...rest}
    />
  );
}
