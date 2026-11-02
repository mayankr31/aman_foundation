"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/js/pdf.worker.min.mjs";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const DEFAULT_PAGE_RATIO = 1.414;

function LazyPage({ pageNumber, width, ratio, devicePixelRatio }) {
  const holderRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const element = holderRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "900px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);

  const placeholderHeight = Math.round(width * ratio);

  return (
    <div
      ref={holderRef}
      className="max-w-full"
      style={{ width, minHeight: visible ? undefined : placeholderHeight }}
    >
      {visible ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          devicePixelRatio={devicePixelRatio}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={
            <div
              className="animate-pulse rounded-lg bg-slate-200/70"
              style={{ width, height: placeholderHeight }}
            />
          }
          className="overflow-hidden rounded-lg shadow-lg"
        />
      ) : (
        <div
          className="w-full animate-pulse rounded-lg bg-slate-200/70"
          style={{ height: placeholderHeight }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default function PDFViewer({ file }) {
  const [numPages, setNumPages] = useState(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pageRatio, setPageRatio] = useState(DEFAULT_PAGE_RATIO);
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);
  const containerRef = useRef(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const update = () => {
      const styles = window.getComputedStyle(element);
      const horizontalPadding =
        (parseFloat(styles.paddingLeft) || 0) +
        (parseFloat(styles.paddingRight) || 0);
      const width = element.clientWidth - horizontalPadding;
      if (width > 0) setPageWidth(width);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDevicePixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }, []);

  useEffect(() => {
    // The framework deck is landscape; a fit-to-width PDF is too small to read
    // on a phone, so start slightly zoomed in and allow horizontal panning.
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setZoom(1.5);
    } else {
      setZoom(1);
    }
    setNumPages(null);
  }, [file]);

  const handleLoadSuccess = async (pdf) => {
    let ratio = DEFAULT_PAGE_RATIO;
    try {
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1 });
      if (viewport.width > 0) {
        ratio = viewport.height / viewport.width;
      }
    } catch (error) {
      // Keep the default ratio if the first page cannot be measured.
    }
    // Set the ratio before mounting the page placeholders so a landscape deck
    // does not first render very tall placeholders and then jump.
    setPageRatio(ratio);
    setNumPages(pdf.numPages);
  };

  const adjustZoom = (delta) => {
    setZoom((current) => {
      const next = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, Number((current + delta).toFixed(2)))
      );
      return next;
    });
  };

  const baseWidth = Math.max(pageWidth || 0, 280);
  const renderedWidth = Math.round(baseWidth * zoom);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 bg-surface-container-low px-2 py-1.5 sm:px-4 sm:py-2">
        <p className="text-[11px] font-semibold text-on-surface-variant">
          {numPages ? `${numPages} page${numPages === 1 ? "" : "s"}` : "Loading…"}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => adjustZoom(-ZOOM_STEP)}
            disabled={zoom <= MIN_ZOOM}
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <span className="material-symbols-outlined text-[20px]">zoom_out</span>
          </button>
          <span className="min-w-12 text-center text-xs font-bold text-on-surface">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => adjustZoom(ZOOM_STEP)}
            disabled={zoom >= MAX_ZOOM}
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <span className="material-symbols-outlined text-[20px]">zoom_in</span>
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="ml-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-primary transition-colors hover:bg-primary/10"
            title="Fit to width"
          >
            Fit
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-auto overscroll-contain bg-slate-100/70 p-2 sm:p-4"
      >
        <div className="min-h-full w-max min-w-full">
          <Document
            file={file}
            onLoadSuccess={handleLoadSuccess}
            loading={
              <div className="flex items-center justify-center py-24 text-on-surface-variant">
                Loading PDF…
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center gap-3 px-4 py-24 text-center text-red-500">
                <span className="material-symbols-outlined text-3xl">error</span>
                <p className="text-sm">Failed to load this PDF.</p>
                <a
                  href={file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Open it in a new tab instead
                </a>
              </div>
            }
            className="flex min-h-full flex-col items-center gap-4"
          >
            {Array.from(new Array(numPages || 0), (_, index) => (
              <LazyPage
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={renderedWidth}
                ratio={pageRatio}
                devicePixelRatio={devicePixelRatio}
              />
            ))}
          </Document>
        </div>
      </div>
    </div>
  );
}
