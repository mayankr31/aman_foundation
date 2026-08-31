"use client";

import { useEffect } from "react";
import PDFViewer from "@/components/PDFViewer";

export default function PDFViewerModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-surface-container-lowest rounded-xl shadow-2xl flex flex-col w-full max-w-[95vw] h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 shrink-0">
          <h2 className="font-headline font-bold text-lg text-on-surface">
            Learning & Leadership Progression Framework
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Scrollable PDF content */}
        <div className="flex-1 overflow-y-auto p-6">
          <PDFViewer file="/docs/Learning-Leadership-Progression-Framework.pdf" />
        </div>
      </div>
    </div>
  );
}
