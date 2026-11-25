"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import ConfirmActionModal from "@/components/ConfirmActionModal";

const ConfirmContext = createContext(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm must be used within a ConfirmProvider");
  return context;
}

/**
 * Promise-based replacement for window.confirm(). Usage:
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title, message, variant: "danger" }))) return;
 */
export function ConfirmProvider({ children }) {
  const [options, setOptions] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback(
    (config = {}) =>
      new Promise((resolve) => {
        resolverRef.current = resolve;
        setOptions({
          title: config.title || "Confirm Action",
          message: config.message || "Are you sure you want to proceed?",
          confirmText: config.confirmText || "Confirm",
          cancelText: config.cancelText || "Cancel",
          variant: config.variant || "danger",
        });
      }),
    []
  );

  const close = useCallback((result) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
    setOptions(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmActionModal
        isOpen={Boolean(options)}
        onClose={() => close(false)}
        onConfirm={() => close(true)}
        title={options?.title}
        message={options?.message}
        confirmText={options?.confirmText}
        cancelText={options?.cancelText}
        variant={options?.variant}
      />
    </ConfirmContext.Provider>
  );
}
