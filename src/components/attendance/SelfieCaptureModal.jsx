"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_OUTPUT_SIZE = 720;

function drawSquareImage(source, sourceWidth, sourceHeight) {
  const side = Math.min(sourceWidth, sourceHeight);
  const outputSize = Math.min(side, MAX_OUTPUT_SIZE);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d");
  if (!context) return null;

  // Selfie previews are mirrored, so mirror the captured image to match.
  context.translate(outputSize, 0);
  context.scale(-1, 1);
  context.drawImage(
    source,
    (sourceWidth - side) / 2,
    (sourceHeight - side) / 2,
    side,
    side,
    0,
    0,
    outputSize,
    outputSize
  );

  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85);
  });
}

export default function SelfieCaptureModal({
  open,
  mode = "check-in",
  busy = false,
  onClose,
  onSkip,
  onUse,
}) {
  const [status, setStatus] = useState("starting");
  const [errorMessage, setErrorMessage] = useState("");
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const previewUrlRef = useRef("");

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const clearPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    setPreviewUrl("");
    setCapturedBlob(null);
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    clearPreview();
    setErrorMessage("");
    setStatus("starting");

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setStatus("error");
      setErrorMessage(
        "Camera is not available on this device or browser. Allow camera access and try again."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error?.name === "NotAllowedError"
          ? "Camera access was denied. Allow camera permission in your browser settings and try again."
          : "Could not start the camera. Please try again."
      );
    }
  }, [clearPreview, stopStream]);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;

    (async () => {
      stopStream();
      clearPreview();
      setErrorMessage("");
      setStatus("starting");

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(
            "Camera is not available on this device or browser. Allow camera access and try again."
          );
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 1280 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setStatus("ready");
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(
            error?.name === "NotAllowedError"
              ? "Camera access was denied. Allow camera permission in your browser settings and try again."
              : "Could not start the camera. Please try again."
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, clearPreview, stopStream]);

  useEffect(() => {
    if (status === "ready" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [status]);

  useEffect(
    () => () => {
      stopStream();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [stopStream]
  );

  if (!open) return null;

  const setPreviewFromBlob = (blob) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(blob);
    previewUrlRef.current = url;
    setCapturedBlob(blob);
    setPreviewUrl(url);
    setStatus("review");
  };

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setErrorMessage("The camera is still starting. Please try again in a moment.");
      return;
    }

    const canvas = drawSquareImage(video, video.videoWidth, video.videoHeight);
    if (!canvas) {
      setErrorMessage("Could not capture the photo. Please try again.");
      return;
    }

    const blob = await canvasToBlob(canvas);
    if (!blob) {
      setErrorMessage("Could not capture the photo. Please try again.");
      return;
    }

    stopStream();
    setPreviewFromBlob(blob);
  };

  const handleRetake = () => {
    startCamera();
  };

  const title = mode === "check-out" ? "Check-out selfie" : "Check-in selfie";

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 p-4 py-6">
      <div className="my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              Optional — take a selfie now or skip.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
            aria-label="Close selfie capture"
          >
            <span className="material-symbols-outlined text-lg leading-none">close</span>
          </button>
        </div>

        <div
          className="min-h-0 overflow-y-auto p-5"
          style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        >
          <div className="relative mx-auto aspect-square w-full max-w-[min(100%,45dvh)] overflow-hidden rounded-xl bg-slate-900">
            {status === "starting" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300">
                <span className="material-symbols-outlined animate-spin text-3xl">
                  progress_activity
                </span>
                <p className="text-xs font-semibold">Starting camera...</p>
              </div>
            )}

            {status === "ready" && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full -scale-x-100 object-cover"
              />
            )}

            {status === "review" && previewUrl && (
              <img
                src={previewUrl}
                alt="Selfie preview"
                className="h-full w-full object-cover"
              />
            )}

            {status === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-slate-300">
                <span className="material-symbols-outlined text-4xl">no_photography</span>
                <p className="text-xs font-semibold leading-relaxed">{errorMessage}</p>
              </div>
            )}
          </div>

          {errorMessage && status !== "error" && (
            <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {errorMessage}
            </p>
          )}

          <div className="mt-4 space-y-2">
            {status === "ready" && (
              <button
                type="button"
                onClick={handleCapture}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-lg">photo_camera</span>
                Capture Selfie
              </button>
            )}

            {status === "review" && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={busy}
                  className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Retake
                </button>
                <button
                  type="button"
                  onClick={() => capturedBlob && onUse(capturedBlob)}
                  disabled={busy || !capturedBlob}
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? (
                    <span className="material-symbols-outlined animate-spin text-lg">
                      progress_activity
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-lg">check</span>
                  )}
                  {busy ? "Saving..." : "Use Selfie"}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onSkip || onClose}
              disabled={busy}
              className="w-full rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
