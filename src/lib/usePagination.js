"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readListReturn, readPageParam, writePageParam } from "@/lib/listReturn";

// Small client-side pagination helper.
// The current page is mirrored into a URL query parameter so browser back/forward
// and in-app "Back to list" links land on the same page. Returns the items for the
// current page plus the state needed by <Pagination />.
export default function usePagination(items, itemsPerPage = 10, options = {}) {
  const { pageParam = "page" } = options;
  const [currentPage, setCurrentPageState] = useState(1);
  const currentPageRef = useRef(1);

  const totalPages = Math.max(1, Math.ceil((items?.length || 0) / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = useMemo(
    () => (items || []).slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage),
    [items, safePage, itemsPerPage]
  );

  const setCurrentPage = useCallback(
    (next) => {
      const raw = typeof next === "function" ? next(currentPageRef.current) : next;
      const page = Math.max(1, Math.floor(Number(raw)) || 1);
      currentPageRef.current = page;
      setCurrentPageState(page);
      writePageParam(pageParam, page);
    },
    [pageParam]
  );

  // Restore the page from the URL (or the pending return marker) after hydration.
  useEffect(() => {
    const urlPage = readPageParam(pageParam);
    const marker = readListReturn();
    const returnPage =
      marker && marker.pageParam === pageParam && marker.listPath === window.location.pathname
        ? marker.page
        : null;
    const initial = Math.max(1, Number(urlPage ?? returnPage ?? 1) || 1);

    if (initial !== currentPageRef.current) {
      currentPageRef.current = initial;
      setCurrentPageState(initial);
    }
    if (!urlPage && initial > 1) {
      writePageParam(pageParam, initial);
    }
  }, [pageParam]);

  // If filters shrink the result set below the current page, clamp it and clean the URL.
  useEffect(() => {
    if (!items?.length) return;
    if (currentPageRef.current > totalPages) {
      currentPageRef.current = totalPages;
      setCurrentPageState(totalPages);
      writePageParam(pageParam, totalPages);
    }
  }, [items, totalPages, pageParam]);

  return { currentPage: safePage, setCurrentPage, totalPages, pageItems };
}
