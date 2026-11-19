"use client";

import useBodyScrollLock from "@/lib/useBodyScrollLock";

export default function PhotoSourceModal({
  open,
  onClose,
  onUpload,
  onCapture,
  busy = false,
  title = "Profile photo",
  description = "Upload a photo from your device or take a new one with the camera.",
}) {
  useBodyScrollLock(Boolean(open));

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={busy ? undefined : onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-surface-container-lowest p-5 sm:p-6 shadow-2xl border border-outline-variant/10"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-headline font-bold text-on-surface">{title}</h3>
            <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-2 -mr-1 -mt-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close photo options"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose?.();
              onUpload?.();
            }}
            disabled={busy}
            className="flex items-center gap-3 rounded-xl border border-outline-variant/40 px-4 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px] text-primary">upload</span>
            Upload from device
          </button>
          <button
            type="button"
            onClick={() => {
              onClose?.();
              onCapture?.();
            }}
            disabled={busy}
            className="flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px]">photo_camera</span>
            Take photo
          </button>
        </div>
      </div>
    </div>
  );
}
