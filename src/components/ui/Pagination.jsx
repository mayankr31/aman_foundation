"use client";

export default function Pagination({ currentPage, totalItems, itemsPerPage = 10, onPageChange, className = "" }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  if (totalPages <= 1) return null;

  const pages = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (currentPage <= 3) {
    pages.push(1, 2, 3, "...", totalPages);
  } else if (currentPage >= totalPages - 2) {
    pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, "...", currentPage, "...", totalPages);
  }

  return (
    <div className={`px-6 py-4 flex items-center justify-between border-t border-surface-container-low font-sans ${className}`}>
      <span className="text-xs text-on-surface-variant">
        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
      </span>
      <div className="flex gap-2 items-center">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Prev
        </button>
        <div className="flex items-center gap-1 mx-2">
          {pages.map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === "number" && onPageChange(page)}
              disabled={page === "..."}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                page === currentPage
                  ? "bg-primary text-white shadow-sm"
                  : page === "..."
                    ? "text-on-surface-variant cursor-default"
                    : "text-on-surface hover:bg-surface-container-high cursor-pointer"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
}
