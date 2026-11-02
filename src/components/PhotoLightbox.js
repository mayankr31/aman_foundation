"use client";

import { useEffect } from "react";

/**
 * Full-screen image viewer.
 *
 * Usage:
 *   const [photo, setPhoto] = useState(null);
 *   <img src={url} onClick={() => setPhoto(url)} className="cursor-pointer" />
 *   <PhotoLightbox src={photo} onClose={() => setPhoto(null)} />
 */
export default function PhotoLightbox({ src, alt = "Photo", onClose }) {
  useEffect(() => {
    if (!src) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="modal-lightbox fixed inset-0 z-[400] flex items-center justify-center overflow-auto overscroll-contain bg-black/80 p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div
        className="modal-lightbox-close absolute z-10 flex items-center gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
          aria-label="Download image"
          title="Download"
        >
          <span className="material-symbols-outlined text-[22px]">download</span>
        </a>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-none bg-white/20 text-white transition-colors hover:bg-white/30"
        >
          <span className="material-symbols-outlined text-[22px]">close</span>
        </button>
      </div>
      <img
        src={src}
        alt={alt}
        className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
