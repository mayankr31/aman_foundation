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
      className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-8 cursor-pointer"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer border-none text-white"
      >
        <span className="material-symbols-outlined text-2xl">close</span>
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
