"use client";

import React from "react";
import { AlertTriangle, Info, CheckCircle, HelpCircle } from "lucide-react";

export default function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary" // primary, danger, success, warning
}) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertTriangle className="w-8 h-8" />,
          iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
          buttonBg: "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20",
        };
      case "success":
        return {
          icon: <CheckCircle className="w-8 h-8" />,
          iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          buttonBg: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-8 h-8" />,
          iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          buttonBg: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20",
        };
      case "primary":
      default:
        return {
          icon: <HelpCircle className="w-8 h-8" />,
          iconBg: "bg-primary/10 text-primary",
          buttonBg: "bg-primary hover:bg-primary/90 shadow-primary/20",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in font-sans">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-center transform scale-100 transition-transform duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Icon Banner */}
        <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center shadow-inner ${styles.iconBg}`}>
          {styles.icon}
        </div>

        {/* Modal Info */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
            {title}
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed px-2">
            {message}
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-2.5 rounded-full text-white text-xs font-bold transition-all shadow-md cursor-pointer ${styles.buttonBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
