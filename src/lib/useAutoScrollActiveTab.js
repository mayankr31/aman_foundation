"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Keeps the active tab visible inside a horizontally scrollable tab bar.
 * Pass the same callback ref to the active tab button and attach the
 * container ref to the scrollable tab bar.
 */
export default function useAutoScrollActiveTab(activeKey, ready = true) {
  const containerRef = useRef(null);
  const activeRef = useRef(null);

  useEffect(() => {
    if (!ready) return;
    const container = containerRef.current;
    const active = activeRef.current;
    if (!container || !active) return;

    const frame = requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      const targetLeft =
        container.scrollLeft +
        (activeRect.left - containerRect.left) -
        (containerRect.width - activeRect.width) / 2;

      container.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: "auto",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [activeKey, ready]);

  const setActiveRef = useCallback((node) => {
    activeRef.current = node;
  }, []);

  return { containerRef, setActiveRef };
}
