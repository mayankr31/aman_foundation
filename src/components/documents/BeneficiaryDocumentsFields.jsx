"use client";

import { useState } from "react";
import YesNoToggle from "@/components/ui/YesNoToggle";
import {
  BENEFICIARY_DOCUMENT_SECTIONS,
  BENEFICIARY_DOCUMENTS,
  DOCUMENT_SUPPORT_TYPES,
  INSURANCE_CATEGORIES,
  createEmptyDocumentEntry,
  createEmptyCustomDocument,
  getDocumentPolicies,
  getSupportLabel,
} from "@/lib/beneficiaryDocuments";

const inputClass =
  "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary border-outline-variant bg-transparent text-on-surface text-sm";

export default function BeneficiaryDocumentsFields({
  documents,
  onUpdate,
  errors = {},
  excludeTypes = ["BANK_ACCOUNT"],
}) {
  const [openSections, setOpenSections] = useState(() =>
    BENEFICIARY_DOCUMENT_SECTIONS.reduce((state, section) => {
      state[section.key] = Boolean(section.defaultOpen);
      return state;
    }, {})
  );

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateDocument = (type, patch) => {
    onUpdate(type, patch);
  };

  const handleHasDocument = (document, entry, value) => {
    if (value === "yes") {
      const policies = getDocumentPolicies(entry);
      updateDocument(document.type, {
        hasDocument: true,
        answered: true,
        supportType: null,
        ...(document.supportsPolicies && policies.length === 0
          ? { policies: [{ category: "HEALTH", policyNumber: "" }] }
          : {}),
      });
      return;
    }

    updateDocument(document.type, {
      hasDocument: false,
      answered: true,
      identifier: "",
      identifier2: "",
      supportType: null,
      policies: [],
    });
  };

  const handleSupport = (document, entry, checked) => {
    updateDocument(document.type, {
      supportType: checked
        ? entry.hasDocument
          ? DOCUMENT_SUPPORT_TYPES.CORRECTION
          : DOCUMENT_SUPPORT_TYPES.CREATION
        : null,
      answered: true,
    });
  };

  const updatePolicy = (document, entry, index, patch) => {
    const policies = getDocumentPolicies(entry).map((policy, policyIndex) =>
      policyIndex === index ? { ...policy, ...patch } : policy
    );
    updateDocument(document.type, { policies, answered: true });
  };

  const addPolicy = (document, entry) => {
    updateDocument(document.type, {
      policies: [
        ...getDocumentPolicies(entry),
        { category: "HEALTH", policyNumber: "" },
      ],
      answered: true,
    });
  };

  const removePolicy = (document, entry, index) => {
    updateDocument(document.type, {
      policies: getDocumentPolicies(entry).filter((_, policyIndex) => policyIndex !== index),
      answered: true,
    });
  };

  const updateCustomItem = (document, entry, index, patch) => {
    const items = (entry.items || []).map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item
    );
    updateDocument(document.type, { items, answered: true });
  };

  const addCustomItem = (document, entry) => {
    updateDocument(document.type, {
      items: [...(entry.items || []), createEmptyCustomDocument()],
      answered: true,
    });
  };

  const removeCustomItem = (document, entry, index) => {
    const items = (entry.items || []).filter((_, itemIndex) => itemIndex !== index);
    updateDocument(document.type, { items, answered: items.length > 0 });
  };

  const updateCustomSupport = (document, entry, index, item, checked) => {
    updateCustomItem(document, entry, index, {
      supportType: checked
        ? item.hasDocument
          ? DOCUMENT_SUPPORT_TYPES.CORRECTION
          : DOCUMENT_SUPPORT_TYPES.CREATION
        : null,
      answered: true,
    });
  };

  const renderCustomDocuments = (document, entry, error) => {
    const items = entry.items || [];

    return (
      <div className="flex flex-col gap-3">
        {items.length === 0 && (
          <p className="text-[10px] italic text-on-surface-variant">
            No other documents added yet.
          </p>
        )}

        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-lg border border-surface-container-high bg-surface-container-low/20 p-3"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Document Name
                </label>
                <input
                  type="text"
                  maxLength={60}
                  placeholder="e.g. Land Record Certificate"
                  className={inputClass}
                  value={item.label || ""}
                  onChange={(event) =>
                    updateCustomItem(document, entry, index, {
                      label: event.target.value,
                      answered: true,
                    })
                  }
                />
              </div>

              <div className="flex min-w-0 flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Does the participant have this document?
                </label>
                <div className="self-start">
                  <YesNoToggle
                    label={`Does the participant have ${item.label || "this document"}?`}
                    value={item.hasDocument ? "yes" : "no"}
                    onChange={(value) =>
                      updateCustomItem(document, entry, index, {
                        hasDocument: value === "yes",
                        answered: true,
                        identifier: value === "no" ? "" : item.identifier,
                        supportType: null,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {item.hasDocument && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Document Number <span className="normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={60}
                  placeholder="e.g. certificate or reference number"
                  className={inputClass}
                  value={item.identifier || ""}
                  onChange={(event) =>
                    updateCustomItem(document, entry, index, {
                      identifier: event.target.value,
                      answered: true,
                    })
                  }
                />
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex min-w-0 cursor-pointer items-start gap-2 rounded-lg bg-surface-container-low/40 px-2.5 py-2 text-[11px] font-medium text-on-surface">
                <input
                  type="checkbox"
                  checked={Boolean(item.supportType)}
                  onChange={(event) =>
                    updateCustomSupport(document, entry, index, item, event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <span className="break-words">
                  {item.hasDocument
                    ? "Needs help/support correcting this document"
                    : "Needs help/support obtaining this document"}
                </span>
              </label>

              <button
                type="button"
                onClick={() => removeCustomItem(document, entry, index)}
                className="inline-flex w-full shrink-0 items-center justify-center gap-1 rounded-lg border border-error/30 px-3 py-2 text-[11px] font-semibold text-error hover:bg-error-container/20 transition-colors cursor-pointer sm:w-auto"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Remove
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => addCustomItem(document, entry)}
          className="inline-flex w-full items-center justify-center gap-1 rounded-full border border-primary/30 px-3 py-2 text-[11px] font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer sm:w-fit"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add Document
        </button>

        {error && (
          <p data-add-error className="text-[11px] font-semibold text-error">
            {error}
          </p>
        )}
      </div>
    );
  };

  const renderIdentifier = (document, entry, secondary = false) => {
    const value = secondary ? entry.identifier2 : entry.identifier;
    const label = secondary ? document.identifier2Label : document.identifierLabel;
    const placeholder = secondary ? document.identifier2Placeholder : document.identifierPlaceholder;
    const maxLength = secondary ? document.identifier2MaxLength : document.identifierMaxLength;
    const inputMode = secondary ? "text" : document.identifierInputMode;
    const pattern = secondary ? undefined : document.identifierPattern;
    const title = secondary ? undefined : document.identifierTitle;
    const sanitize = secondary ? document.sanitizeIdentifier2 : document.sanitizeIdentifier;

    return (
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
          {label}
        </label>
        <input
          type="text"
          inputMode={inputMode}
          maxLength={maxLength}
          pattern={pattern}
          title={title}
          placeholder={placeholder}
          className={inputClass}
          value={value || ""}
          onChange={(event) =>
            updateDocument(document.type, {
              [secondary ? "identifier2" : "identifier"]: sanitize
                ? sanitize(event.target.value)
                : event.target.value,
              answered: true,
            })
          }
        />
      </div>
    );
  };

  const renderPolicies = (document, entry) => {
    const policies = getDocumentPolicies(entry);

    return (
      <div className="flex flex-col gap-2">
        {policies.map((policy, index) => (
          <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1 sm:w-40">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Insurance Type
              </label>
              <select
                className={inputClass}
                value={policy.category || "HEALTH"}
                onChange={(event) =>
                  updatePolicy(document, entry, index, { category: event.target.value })
                }
              >
                {INSURANCE_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Policy Number
              </label>
              <input
                type="text"
                maxLength={30}
                placeholder="e.g. POL-123456"
                className={inputClass}
                value={policy.policyNumber || ""}
                onChange={(event) =>
                  updatePolicy(document, entry, index, {
                    policyNumber: event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""),
                  })
                }
              />
            </div>
            <button
              type="button"
              onClick={() => removePolicy(document, entry, index)}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-error/30 px-2.5 py-2 text-[11px] font-semibold text-error hover:bg-error-container/20 transition-colors cursor-pointer"
              aria-label="Remove policy"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        ))}

        {policies.length === 0 && (
          <p className="text-[10px] italic text-on-surface-variant">
            Add a policy number to record this insurance.
          </p>
        )}

        <button
          type="button"
          onClick={() => addPolicy(document, entry)}
          className="inline-flex w-fit items-center gap-1 rounded-full border border-primary/30 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add Policy
        </button>
      </div>
    );
  };

  const renderSupportCheckbox = (document, entry) => (
    <label className="mt-1 flex cursor-pointer items-start gap-2 rounded-lg bg-surface-container-low/40 px-2.5 py-2 text-[11px] font-medium text-on-surface">
      <input
        type="checkbox"
        checked={Boolean(entry.supportType)}
        onChange={(event) => handleSupport(document, entry, event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-outline-variant text-primary focus:ring-primary"
      />
      <span>{getSupportLabel(document, entry.hasDocument)}</span>
    </label>
  );

  return (
    <div className="space-y-3">
      {BENEFICIARY_DOCUMENT_SECTIONS.map((section) => {
        const sectionDocuments = BENEFICIARY_DOCUMENTS.filter(
          (document) => document.section === section.key && !excludeTypes.includes(document.type)
        );
        if (sectionDocuments.length === 0) return null;
        const isOpen = openSections[section.key];
        const answeredCount = sectionDocuments.filter((document) => {
          const entry = documents?.[document.type];
          if (document.isCustomList) return Boolean(entry?.items?.length);
          return entry?.answered;
        }).length;
        const hasError = sectionDocuments.some((document) => errors[document.type]);

        return (
          <div
            key={section.key}
            className="overflow-hidden rounded-xl border border-surface-container-high"
          >
            <button
              type="button"
              onClick={() => toggleSection(section.key)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 bg-surface-container-low/40 px-3 py-2.5 text-left cursor-pointer"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">
                    {section.label}
                  </p>
                  <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[9px] font-bold text-on-surface-variant">
                    {answeredCount}/{sectionDocuments.length} answered
                  </span>
                  {hasError && (
                    <span className="rounded-full bg-error-container px-2 py-0.5 text-[9px] font-bold text-on-error-container">
                      Needs attention
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[10px] text-on-surface-variant">{section.description}</p>
              </div>
              <span
                className={`material-symbols-outlined shrink-0 text-on-surface-variant transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                expand_more
              </span>
            </button>

            {isOpen && (
              <div className="grid grid-cols-1 gap-3 border-t border-surface-container-high p-3 md:grid-cols-2">
                {sectionDocuments.map((document) => {
                  const rawEntry = documents?.[document.type];
                  const entry =
                    rawEntry || (document.isCustomList ? { items: [] } : createEmptyDocumentEntry());
                  const error = errors[document.type];

                  if (document.isCustomList) {
                    return (
                      <div
                        key={document.type}
                        className="flex flex-col gap-2 rounded-xl border border-surface-container-high p-3 md:col-span-2"
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                            {document.label}
                          </p>
                          {document.description && (
                            <p className="mt-0.5 text-[10px] text-on-surface-variant">
                              {document.description}
                            </p>
                          )}
                        </div>
                        {renderCustomDocuments(document, entry, error)}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={document.type}
                      className="flex flex-col gap-2 rounded-xl border border-surface-container-high p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                            {document.label}
                          </p>
                          {document.description && (
                            <p className="mt-0.5 text-[10px] text-on-surface-variant">
                              {document.description}
                            </p>
                          )}
                        </div>
                        <YesNoToggle
                          label={`Does the participant have ${document.label}?`}
                          value={entry.hasDocument ? "yes" : "no"}
                          onChange={(value) => handleHasDocument(document, entry, value)}
                        />
                      </div>

                      {entry.hasDocument ? (
                        <>
                          {document.supportsPolicies
                            ? renderPolicies(document, entry)
                            : document.hasIdentifier !== false && (
                                <>
                                  {renderIdentifier(document, entry)}
                                  {document.hasSecondaryIdentifier &&
                                    renderIdentifier(document, entry, true)}
                                </>
                              )}
                          {renderSupportCheckbox(document, entry)}
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] italic text-on-surface-variant">
                            No {document.label} available.
                          </p>
                          {renderSupportCheckbox(document, entry)}
                        </>
                      )}

                      {error && (
                        <p
                          data-add-error
                          className="text-[11px] font-semibold text-error"
                        >
                          {error}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
