"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearListReturn,
  isListReturnStale,
  readListReturn,
  saveListReturn,
  withPageParam,
} from "@/lib/listReturn";

const MAX_RESTORE_MS = 6000;

function escapeSelectorValue(value) {
  if (typeof window !== "undefined" && window.CSS?.escape) {
    return window.CSS.escape(String(value));
  }
  return String(value).replace(/["\\]/g, "\\$&");
}

export default function ListReturnManager() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleClick = (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      // Navigating from the sidebar/header is a fresh destination, not a return.
      if (target.closest("#side-nav, header")) {
        clearListReturn();
        return;
      }

      const marker = readListReturn();
      const anchor = target.closest("a[href]");

      // Preserve the saved page when a detail page's own "Back to ..." link is used.
      if (marker && anchor && !anchor.target && window.location.pathname !== marker.listPath) {
        try {
          const anchorUrl = new URL(anchor.href, window.location.origin);
          if (anchorUrl.origin === window.location.origin && anchorUrl.pathname === marker.listPath) {
            event.preventDefault();
            event.stopPropagation();
            router.push(withPageParam(anchorUrl.href, marker.pageParam || "page", marker.page || 1));
            return;
          }
        } catch {
          // Ignore malformed href values.
        }
      }

      if (anchor && anchor.target && anchor.target !== "_self") return;

      const item = target.closest("[data-list-item-key]");
      if (!item) return;

      // Buttons inside a row/card are actions, not links into the detail page.
      const action = target.closest("button, [role='button']");
      if (action && action !== item) return;

      const itemKey = item.getAttribute("data-list-item-key");
      if (!itemKey) return;

      const container = item.closest("[data-list-page-param]");
      const pageParam = container?.getAttribute("data-list-page-param")?.trim() || "page";
      const detailPrefixes = container?.getAttribute("data-list-detail-prefix") || "";
      const explicitHref = item.getAttribute("data-list-href");
      const href = explicitHref || anchor?.getAttribute("href") || "";

      let detailPath = null;
      if (href) {
        try {
          detailPath = new URL(href, window.location.origin).pathname;
        } catch {
          detailPath = null;
        }
      }

      const pageValue = new URLSearchParams(window.location.search).get(pageParam);
      const page = Math.max(1, Number.parseInt(pageValue || "1", 10) || 1);

      saveListReturn({
        listPath: window.location.pathname,
        pageParam,
        page,
        itemKey,
        scrollY: window.scrollY,
        detailPath,
        detailPrefixes,
        savedAt: Date.now(),
      });
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [router]);

  useEffect(() => {
    const marker = readListReturn();
    if (!marker) return;

    if (marker.listPath !== pathname) {
      if (isListReturnStale(marker, pathname)) clearListReturn();
      return;
    }

    let frame = null;
    let stopped = false;
    const startedAt = performance.now();

    const findItem = () => {
      let scope = document;
      if (marker.pageParam) {
        scope =
          document.querySelector(`[data-list-page-param="${escapeSelectorValue(marker.pageParam)}"]`) ||
          document;
      }
      return scope.querySelector(`[data-list-item-key="${escapeSelectorValue(marker.itemKey)}"]`);
    };

    const attempt = () => {
      if (stopped) return;

      const item = findItem();
      if (item) {
        item.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
        clearListReturn();
        return;
      }

      if (performance.now() - startedAt < MAX_RESTORE_MS) {
        frame = window.requestAnimationFrame(attempt);
        return;
      }

      if (Number.isFinite(marker.scrollY)) {
        window.scrollTo({ top: marker.scrollY, left: 0, behavior: "auto" });
      }
      clearListReturn();
    };

    frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(attempt);
    });

    return () => {
      stopped = true;
      if (frame != null) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
