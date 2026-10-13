"use client";

import { useMemo, useState } from "react";

// Small client-side pagination helper.
// Returns the items for the current page plus the state needed by <Pagination />.
export default function usePagination(items, itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil((items?.length || 0) / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = useMemo(
    () => (items || []).slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage),
    [items, safePage, itemsPerPage]
  );
  return { currentPage: safePage, setCurrentPage, totalPages, pageItems };
}
