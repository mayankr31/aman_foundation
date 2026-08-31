"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/js/pdf.worker.min.mjs";

export default function PDFViewer({ file }) {
  const [numPages, setNumPages] = useState(null);
  const [pageWidth, setPageWidth] = useState(800);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setPageWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center">
      <Document
        file={file}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={
          <div className="flex items-center justify-center py-24 text-on-surface-variant">
            Loading PDF...
          </div>
        }
        error={
          <div className="flex items-center justify-center py-24 text-red-500">
            Failed to load PDF. Please try again.
          </div>
        }
        className="flex flex-col items-center gap-6"
      >
        {Array.from(new Array(numPages || 0), (_, i) => (
          <Page
            key={`page_${i + 1}`}
            pageNumber={i + 1}
            width={pageWidth}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-lg rounded-lg overflow-hidden"
          />
        ))}
      </Document>
    </div>
  );
}
