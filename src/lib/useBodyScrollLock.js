"use client";

import { useEffect } from "react";

/**
 * Prevents the page behind a modal from scrolling while the modal is open.
 * Restores the previous inline overflow value on unmount.
 */
export default function useBodyScrollLock(active = true) {
  useEffect(() => {
    if (typeof document === "undefined" || !active) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, [active]);
}
