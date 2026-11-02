"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const PwaContext = createContext(null);

function detectIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const classicalIos = /iPad|iPhone|iPod/i.test(ua);
  // iPadOS 13+ reports itself as a Mac; touch points reveal the real device.
  const ipadOs = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  return classicalIos || ipadOs;
}

function detectStandalone() {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia
    ? window.matchMedia("(display-mode: standalone)").matches
    : false;
  return media || window.navigator.standalone === true;
}

export function PwaProvider({ children }) {
  const [promptEvent, setPromptEvent] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [iosHelpOpen, setIosHelpOpen] = useState(false);
  const [updateWorker, setUpdateWorker] = useState(null);
  const [updateVisible, setUpdateVisible] = useState(false);
  const updateRequestedRef = useRef(false);

  useEffect(() => {
    setIsInstalled(detectStandalone());
    setIsIos(detectIos());

    const media = window.matchMedia
      ? window.matchMedia("(display-mode: standalone)")
      : null;
    const onDisplayModeChange = () => setIsInstalled(detectStandalone());
    media?.addEventListener?.("change", onDisplayModeChange);

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };
    const onInstalled = () => {
      setPromptEvent(null);
      setIsInstalled(true);
      setIosHelpOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      media?.removeEventListener?.("change", onDisplayModeChange);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    const pwaEnabled =
      process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_ENABLE_PWA === "true";
    if (!pwaEnabled) return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    if (!window.isSecureContext) return;

    let cancelled = false;

    const onControllerChange = () => {
      if (updateRequestedRef.current) {
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (cancelled) return;

        if (registration.waiting && navigator.serviceWorker.controller) {
          setUpdateWorker(registration.waiting);
          setUpdateVisible(true);
        }

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setUpdateWorker(worker);
              setUpdateVisible(true);
            }
          });
        });
      } catch (error) {
        // Registration can fail in private mode or behind an insecure proxy.
        // The app must keep working normally in that case.
        console.warn("Service worker registration failed:", error);
      }
    };

    register();

    const checkForUpdates = () => {
      if (document.visibilityState !== "visible") return;
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => registration?.update())
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", checkForUpdates);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", checkForUpdates);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
    };
  }, []);

  const install = useCallback(async () => {
    if (isInstalled) return;

    if (promptEvent) {
      try {
        // prompt() must run inside the original user gesture.
        promptEvent.prompt();
        await promptEvent.userChoice;
      } catch (error) {
        // Ignore a dismissed or expired prompt.
      } finally {
        setPromptEvent(null);
      }
      return;
    }

    if (isIos) {
      setIosHelpOpen(true);
    }
  }, [isInstalled, isIos, promptEvent]);

  const applyUpdate = useCallback(() => {
    updateRequestedRef.current = true;
    if (updateWorker) {
      updateWorker.postMessage({ type: "SKIP_WAITING" });
      // Fallback in case the browser does not fire controllerchange.
      window.setTimeout(() => {
        if (updateRequestedRef.current) window.location.reload();
      }, 1500);
      return;
    }
    window.location.reload();
  }, [updateWorker]);

  const canInstall = !isInstalled && (Boolean(promptEvent) || isIos);

  const value = useMemo(
    () => ({ canInstall, isInstalled, isIos, install, openIosHelp: () => setIosHelpOpen(true) }),
    [canInstall, isInstalled, isIos, install]
  );

  return (
    <PwaContext.Provider value={value}>
      {children}

      {updateVisible && (
        <div
          className="pwa-floating-bottom fixed inset-x-3 z-[550] sm:inset-x-auto sm:right-4 sm:max-w-sm"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3 rounded-2xl border border-teal-200 bg-white p-3.5 shadow-2xl dark:border-teal-800 dark:bg-slate-900">
            <span className="material-symbols-outlined mt-0.5 shrink-0 text-[22px] text-teal-700 dark:text-teal-300">
              system_update
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                New version available
              </p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Refresh to load the latest update.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={applyUpdate}
                  className="rounded-full bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-teal-800"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => setUpdateVisible(false)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {iosHelpOpen && (
        <div
          className="fixed inset-0 z-[600] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          onClick={() => setIosHelpOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2
                  id="ios-install-title"
                  className="text-lg font-bold text-slate-900 dark:text-white"
                >
                  Install Aman Portal
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Add the app to your Home Screen on iPhone or iPad.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIosHelpOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                aria-label="Close install instructions"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                  1
                </span>
                <span>
                  Open this site in <strong>Safari</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                  2
                </span>
                <span className="flex flex-wrap items-center gap-1.5">
                  Tap the
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <span className="material-symbols-outlined text-[16px]">
                      ios_share
                    </span>
                    Share
                  </span>
                  button.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                  3
                </span>
                <span>
                  Choose <strong>Add to Home Screen</strong>.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setIosHelpOpen(false)}
              className="mt-6 w-full rounded-full bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-teal-800"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error("usePwa must be used inside PwaProvider");
  }
  return context;
}
