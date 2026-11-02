"use client";

import { useEffect } from "react";
import PDFViewer from "@/components/PDFViewer";

export default function PDFViewerModal({
  isOpen,
  onClose,
  file,
  title = "Document",
  downloadUrl,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const downloadHref = downloadUrl || file;

  return (
    <div
      className="modal-viewer fixed inset-0 z-[400] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/60 p-2 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="pdf-modal-height relative flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-outline-variant/20 px-3 py-2.5 sm:px-6 sm:py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-headline text-sm font-bold text-on-surface sm:text-lg">
              {title}
            </h2>
            <p className="hidden text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant sm:block">
              PDF preview
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <a
              href={file}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              aria-label="Open PDF in new tab"
              title="Open in new tab"
            >
              <span className="material-symbols-outlined text-[20px]">
                open_in_new
              </span>
            </a>
            <a
              href={downloadHref}
              download
              className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              aria-label="Download PDF"
              title="Download"
            >
              <span className="material-symbols-outlined text-[20px]">
                download
              </span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              aria-label="Close PDF preview"
            >
              <span className="material-symbols-outlined text-[22px]">
                close
              </span>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <PDFViewer file={file} />
        </div>
      </div>
    </div>
  );
}
