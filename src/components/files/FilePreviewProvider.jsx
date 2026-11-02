"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import dynamic from "next/dynamic";
import PhotoLightbox from "@/components/PhotoLightbox";
import { fileNameFromUrl, getPreviewKind } from "@/lib/filePreview";

// The PDF renderer is heavy; only download its chunk when a PDF is opened.
const PDFViewerModal = dynamic(
  () => import("@/components/PDFViewerModal"),
  { ssr: false }
);

const FilePreviewContext = createContext(null);

/**
 * Opens uploaded images and PDFs in the app instead of a new browser tab.
 * Files that cannot be previewed keep their normal anchor/new-tab behaviour.
 */
export function FilePreviewProvider({ children }) {
  const [preview, setPreview] = useState(null);

  const openFile = useCallback((input) => {
    const url = typeof input === "string" ? input : input?.url;
    if (!url) return false;

    const kind = getPreviewKind(url);
    if (!kind) return false;

    const name =
      (typeof input === "object" && input && input.name) ||
      fileNameFromUrl(url);

    setPreview({ kind, url, name });
    return true;
  }, []);

  const closePreview = useCallback(() => setPreview(null), []);

  const value = useMemo(() => ({ openFile }), [openFile]);

  return (
    <FilePreviewContext.Provider value={value}>
      {children}
      <PhotoLightbox
        src={preview?.kind === "image" ? preview.url : null}
        alt={preview?.name || "Attachment"}
        onClose={closePreview}
      />
      {preview?.kind === "pdf" && (
        <PDFViewerModal
          isOpen
          file={preview.url}
          title={preview.name || "Document"}
          onClose={closePreview}
        />
      )}
    </FilePreviewContext.Provider>
  );
}

export function useFilePreview() {
  const context = useContext(FilePreviewContext);
  if (!context) {
    throw new Error("useFilePreview must be used inside FilePreviewProvider");
  }
  return context;
}
