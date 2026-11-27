// Shared catalogue and helpers for the participant document registry.
// Imported by client forms (to render inputs and validate inline) and by API
// routes (defence in depth), so this module must stay free of React/DOM code.

import {
  isBlank,
  digitsOnly,
  upperAlnum,
  trimText,
  validateAadhaar,
  validatePan,
  validateVoterId,
  validateRationCard,
} from "@/lib/validation";

export const DOCUMENT_SUPPORT_TYPES = {
  CORRECTION: "CORRECTION",
  CREATION: "CREATION",
};

export const INSURANCE_CATEGORIES = [
  { value: "HEALTH", label: "Health" },
  { value: "LIFE", label: "Life" },
  { value: "ASSETS", label: "Assets" },
];

const toUpperCode = (value) =>
  String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");

const toText = (value) => String(value ?? "");

const toAlnum = (value) => upperAlnum(value);

const digitsLengthValidator = (label, length) => (value) =>
  new RegExp(`^[0-9]{${length}}$`).test(value)
    ? null
    : `${label} must be exactly ${length} digits.`;

const patternValidator = (pattern, message) => (value) =>
  pattern.test(value) ? null : message;

const textLengthValidator = (label, min = 2, max = 60) => (value) => {
  const text = trimText(value);
  if (text.length < min) return `Enter a valid ${label.toLowerCase()}.`;
  if (text.length > max) return `${label} is too long.`;
  return null;
};

export const BENEFICIARY_DOCUMENT_SECTIONS = [
  {
    key: "identity",
    label: "Identity Cards",
    description:
      "Government-issued identity documents. Enter the document number when the participant has it.",
    defaultOpen: true,
  },
  {
    key: "registrations",
    label: "Other Cards & Registrations",
    description:
      "Scheme registrations, insurance policies and bank account details.",
    defaultOpen: true,
  },
  {
    key: "certificates",
    label: "Certificates",
    description:
      "Certificates and historical voter documents. Support can be requested for any of them.",
    defaultOpen: true,
  },
];

// Each entry defines how the document is stored and rendered.
// `identifierRequired` means a value must be entered when hasDocument is Yes.
// Docs without any identifier can still request support.
export const BENEFICIARY_DOCUMENTS = [
  {
    type: "AADHAAR",
    section: "identity",
    label: "Aadhaar Card",
    identifierLabel: "Aadhaar Number",
    identifierPlaceholder: "e.g. 123456789012",
    identifierInputMode: "numeric",
    identifierMaxLength: 12,
    identifierPattern: "[0-9]{12}",
    identifierTitle: "Aadhaar must be exactly 12 digits.",
    identifierRequired: true,
    sanitizeIdentifier: (value) => digitsOnly(value).slice(0, 12),
    validateIdentifier: (value) => validateAadhaar(value, { required: true }),
    legacyField: "aadhar",
  },
  {
    type: "PAN",
    section: "identity",
    label: "PAN Card",
    identifierLabel: "PAN Number",
    identifierPlaceholder: "e.g. ABCDE1234F",
    identifierMaxLength: 10,
    identifierPattern: "[A-Z]{5}[0-9]{4}[A-Z]",
    identifierTitle: "PAN must be in the format ABCDE1234F.",
    identifierRequired: true,
    sanitizeIdentifier: (value) => upperAlnum(value).slice(0, 10),
    validateIdentifier: (value) => validatePan(value, { required: true }),
    legacyField: "panCard",
  },
  {
    type: "VOTER_ID",
    section: "identity",
    label: "Voter ID Card",
    identifierLabel: "Voter ID Number",
    identifierPlaceholder: "e.g. ABC1234567",
    identifierMaxLength: 10,
    identifierPattern: "[A-Z]{3}[0-9]{7}",
    identifierTitle: "Voter ID must be 3 letters followed by 7 digits.",
    identifierRequired: true,
    sanitizeIdentifier: (value) => upperAlnum(value).slice(0, 10),
    validateIdentifier: (value) => validateVoterId(value, { required: true }),
    legacyField: "voterId",
  },
  {
    type: "RATION_CARD",
    section: "identity",
    label: "Ration Card",
    identifierLabel: "Ration Card Number",
    identifierPlaceholder: "e.g. SFY-AS-4029",
    identifierMaxLength: 20,
    identifierPattern: "[A-Z0-9][A-Z0-9-]{5,19}",
    identifierTitle: "Ration card must be 6 to 20 letters, digits or hyphens.",
    identifierRequired: true,
    sanitizeIdentifier: (value) => toUpperCode(value).slice(0, 20),
    validateIdentifier: (value) => validateRationCard(value, { required: true }),
    legacyField: "rationCard",
  },
  {
    type: "PASSPORT",
    section: "identity",
    label: "Passport",
    identifierLabel: "Passport Number",
    identifierPlaceholder: "e.g. A1234567",
    identifierMaxLength: 8,
    identifierPattern: "[A-Z][0-9]{7}",
    identifierTitle: "Passport number must be a letter followed by 7 digits.",
    identifierRequired: true,
    sanitizeIdentifier: (value) => upperAlnum(value).slice(0, 8),
    validateIdentifier: (value) =>
      patternValidator(
        /^[A-Z][0-9]{7}$/,
        "Passport number must be a letter followed by 7 digits."
      )(value),
  },
  {
    type: "DRIVING_LICENSE",
    section: "identity",
    label: "Driving License",
    identifierLabel: "Driving License Number",
    identifierPlaceholder: "e.g. AS0120110001234",
    identifierMaxLength: 25,
    identifierRequired: true,
    sanitizeIdentifier: (value) => toAlnum(value).slice(0, 25),
    validateIdentifier: (value) =>
      patternValidator(
        /^[A-Z0-9]{6,25}$/,
        "Driving license must be 6 to 25 letters or digits."
      )(value),
  },
  {
    type: "ABHA",
    section: "identity",
    label: "Health Card (ABHA)",
    identifierLabel: "ABHA Number",
    identifierPlaceholder: "e.g. 12345678901234",
    identifierInputMode: "numeric",
    identifierMaxLength: 14,
    identifierPattern: "[0-9]{14}",
    identifierTitle: "ABHA number must be exactly 14 digits.",
    identifierRequired: true,
    sanitizeIdentifier: (value) => digitsOnly(value).slice(0, 14),
    validateIdentifier: digitsLengthValidator("ABHA number", 14),
  },
  {
    type: "JOB_CARD",
    section: "identity",
    label: "Job Card (MGNREGA)",
    identifierLabel: "Job Card Number",
    identifierPlaceholder: "e.g. AS-01-002-001-001/123",
    identifierMaxLength: 30,
    identifierRequired: true,
    sanitizeIdentifier: (value) => toUpperCode(value).slice(0, 30),
    validateIdentifier: textLengthValidator("Job card number", 3, 30),
  },
  {
    type: "UDID",
    section: "identity",
    label: "Disability Card (UDID)",
    identifierLabel: "UDID Number",
    identifierPlaceholder: "e.g. 123456789012345678",
    identifierMaxLength: 25,
    identifierRequired: true,
    sanitizeIdentifier: (value) => toAlnum(value).slice(0, 25),
    validateIdentifier: textLengthValidator("UDID number", 4, 25),
  },
  {
    type: "LABOUR_CARD",
    section: "identity",
    label: "Labour Card (Shramik)",
    identifierLabel: "Labour Card Number",
    identifierPlaceholder: "e.g. AS-SHR-00123",
    identifierMaxLength: 25,
    identifierRequired: true,
    sanitizeIdentifier: (value) => toUpperCode(value).slice(0, 25),
    validateIdentifier: textLengthValidator("labour card number", 3, 25),
  },
  {
    type: "FARMER_CARD",
    section: "identity",
    label: "Farmer Card",
    identifierLabel: "Farmer Card ID",
    identifierPlaceholder: "e.g. AS-FRM-00123",
    identifierMaxLength: 25,
    identifierRequired: true,
    sanitizeIdentifier: (value) => toUpperCode(value).slice(0, 25),
    validateIdentifier: textLengthValidator("farmer card ID", 3, 25),
  },
  {
    type: "PASHU_AADHAAR",
    section: "identity",
    label: "Pashu Aadhaar",
    identifierLabel: "Pashu Aadhaar ID",
    identifierPlaceholder: "e.g. 123456789012",
    identifierMaxLength: 25,
    identifierRequired: true,
    sanitizeIdentifier: (value) => toAlnum(value).slice(0, 25),
    validateIdentifier: textLengthValidator("Pashu Aadhaar ID", 4, 25),
  },
  {
    type: "INSURANCE",
    section: "registrations",
    label: "Insurance",
    description: "Health, life or asset insurance. Add a policy number for each policy.",
    hasIdentifier: false,
    supportsPolicies: true,
  },
  {
    type: "ORUNODOI",
    section: "registrations",
    label: "Orunodoi / Arunodoi",
    identifierLabel: "Application No. / Beneficiary ID",
    identifierPlaceholder: "e.g. ORN-AS-0012345",
    identifierMaxLength: 30,
    identifierRequired: true,
    sanitizeIdentifier: (value) => toUpperCode(value).slice(0, 30),
    validateIdentifier: textLengthValidator("Orunodoi application or beneficiary ID", 3, 30),
  },
  {
    type: "SHG",
    section: "registrations",
    label: "SHG Registration",
    identifierLabel: "SHG Name",
    identifierPlaceholder: "e.g. Bartari Mahila SHG",
    identifierMaxLength: 80,
    identifierRequired: true,
    sanitizeIdentifier: (value) => toText(value).slice(0, 80),
    validateIdentifier: textLengthValidator("SHG name", 2, 80),
  },
  {
    type: "SOIL_HEALTH_CARD",
    section: "registrations",
    label: "Soil Health Card (SHC)",
    identifierLabel: "SHC Number",
    identifierPlaceholder: "e.g. SHC-AS-001234",
    identifierMaxLength: 30,
    identifierRequired: true,
    sanitizeIdentifier: (value) => toUpperCode(value).slice(0, 30),
    validateIdentifier: textLengthValidator("soil health card number", 3, 30),
  },
  {
    type: "BANK_ACCOUNT",
    section: "registrations",
    label: "Bank Account",
    description: "Bank account details are captured in the Bank Details section below.",
    hasIdentifier: false,
  },
  {
    type: "OTHER",
    section: "registrations",
    label: "Other Documents",
    description: "Add any other document the participant has or needs help with.",
    isCustomList: true,
    hasIdentifier: false,
  },
  {
    type: "BIRTH_CERTIFICATE",
    section: "certificates",
    label: "Birth Certificate",
    identifierLabel: "Birth Certificate Number",
    identifierPlaceholder: "e.g. BC-AS-2015-001234",
    identifierMaxLength: 30,
    identifierRequired: true,
    sanitizeIdentifier: (value) => toUpperCode(value).slice(0, 30),
    validateIdentifier: textLengthValidator("birth certificate number", 3, 30),
  },
  {
    type: "UDYAM",
    section: "certificates",
    label: "Udyam Registration",
    identifierLabel: "Udyam Registration Number (URN)",
    identifierPlaceholder: "e.g. UDYAM-AS-01-0012345",
    identifierMaxLength: 30,
    identifierRequired: true,
    sanitizeIdentifier: (value) => toUpperCode(value).slice(0, 30),
    validateIdentifier: textLengthValidator("Udyam URN", 6, 30),
  },
  {
    type: "KCC",
    section: "certificates",
    label: "Kisan Credit Card (KCC)",
    identifierLabel: "CIF / Customer ID",
    identifierPlaceholder: "e.g. 1234567890",
    identifierInputMode: "numeric",
    identifierMaxLength: 20,
    identifier2Label: "KCC Loan Account No.",
    identifier2Placeholder: "e.g. KCC123456789",
    identifier2MaxLength: 25,
    hasSecondaryIdentifier: true,
    identifierRequired: false,
    identifier2Required: false,
    requiresAnyIdentifier: true,
    sanitizeIdentifier: (value) => digitsOnly(value).slice(0, 20),
    validateIdentifier: textLengthValidator("CIF / customer ID", 4, 20),
    sanitizeIdentifier2: (value) => toUpperCode(value).slice(0, 25),
    validateIdentifier2: textLengthValidator("KCC loan account number", 4, 25),
  },
  {
    type: "DIGILOCKER",
    section: "certificates",
    label: "DigiLocker",
    description: "DigiLocker account setup.",
    hasIdentifier: false,
  },
  {
    type: "PRC",
    section: "certificates",
    label: "Permanent Residence Certificate (PRC)",
    identifierLabel: "PRC Number",
    identifierPlaceholder: "e.g. PRC-AS-001234",
    identifierMaxLength: 30,
    identifierRequired: true,
    sanitizeIdentifier: (value) => toUpperCode(value).slice(0, 30),
    validateIdentifier: textLengthValidator("PRC number", 3, 30),
  },
  {
    type: "OLD_PENSION",
    section: "certificates",
    label: "Old Age Pension",
    description: "Old age pension enrollment.",
    hasIdentifier: false,
  },
  ...["1951", "1966", "1971", "1997", "2010"].map((year) => ({
    type: `VOTER_FOLI_${year}`,
    section: "certificates",
    label: `Voter Foli Copy ${year}`,
    description: `Voter foli copy for ${year}.`,
    hasIdentifier: false,
  })),
];

const DOCUMENT_BY_TYPE = new Map(
  BENEFICIARY_DOCUMENTS.map((document) => [document.type, document])
);

export const getDocumentConfig = (type) => DOCUMENT_BY_TYPE.get(type) || null;

export const CUSTOM_DOCUMENT_TYPE_PREFIX = "OTHER:";

export const isCustomDocumentType = (type) =>
  typeof type === "string" && type.startsWith(CUSTOM_DOCUMENT_TYPE_PREFIX);

export const customDocumentType = (id) => `${CUSTOM_DOCUMENT_TYPE_PREFIX}${id}`;

export function createEmptyCustomDocument() {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    label: "",
    hasDocument: false,
    answered: false,
    identifier: "",
    identifier2: "",
    supportType: null,
    policies: [],
  };
}

export function createEmptyDocumentEntry() {
  return {
    hasDocument: false,
    answered: false,
    identifier: "",
    identifier2: "",
    supportType: null,
    policies: [],
  };
}

export function createEmptyDocumentsState() {
  return BENEFICIARY_DOCUMENTS.reduce((state, document) => {
    state[document.type] = document.isCustomList
      ? { items: [] }
      : createEmptyDocumentEntry();
    return state;
  }, {});
}

export function getDocumentPolicies(entry) {
  if (Array.isArray(entry?.policies)) return entry.policies;
  if (Array.isArray(entry?.details?.policies)) return entry.details.policies;
  return [];
}

function normalizePolicies(policies) {
  return (Array.isArray(policies) ? policies : [])
    .map((policy) => ({
      category: INSURANCE_CATEGORIES.some((option) => option.value === policy?.category)
        ? policy.category
        : "HEALTH",
      policyNumber: toUpperCode(policy?.policyNumber).slice(0, 30),
    }))
    .filter((policy) => !isBlank(policy.policyNumber));
}

function normalizeIdentifier(document, value, secondary = false) {
  if (!value) return null;
  const sanitize = secondary
    ? document.sanitizeIdentifier2 || toText
    : document.sanitizeIdentifier || toText;
  const normalized = String(sanitize(value) ?? "").trim();
  return isBlank(normalized) ? null : normalized;
}

export function normalizeDocumentEntry(document, raw) {
  const hasDocument = Boolean(raw?.hasDocument);
  const rawPolicies = Array.isArray(raw?.policies)
    ? raw.policies
    : Array.isArray(raw?.details?.policies)
      ? raw.details.policies
      : [];
  const policies = document.supportsPolicies && hasDocument ? normalizePolicies(rawPolicies) : [];
  const hasPolicyNumbers = policies.length > 0;
  const identifier = hasDocument && document.hasIdentifier !== false
    ? normalizeIdentifier(document, raw?.identifier)
    : null;
  const identifier2 = hasDocument && document.hasSecondaryIdentifier
    ? normalizeIdentifier(document, raw?.identifier2, true)
    : null;
  const hasSupportRequest =
    raw?.supportType === DOCUMENT_SUPPORT_TYPES.CORRECTION ||
    raw?.supportType === DOCUMENT_SUPPORT_TYPES.CREATION;
  const supportType = hasSupportRequest
    ? hasDocument
      ? DOCUMENT_SUPPORT_TYPES.CORRECTION
      : DOCUMENT_SUPPORT_TYPES.CREATION
    : null;
  const answered =
    Boolean(raw?.answered) ||
    hasDocument ||
    !isBlank(identifier) ||
    !isBlank(identifier2) ||
    hasPolicyNumbers ||
    Boolean(supportType);

  return {
    type: document.type,
    hasDocument,
    answered,
    identifier,
    identifier2,
    supportType,
    details: document.supportsPolicies ? { policies } : null,
  };
}

export function isDocumentEntryTouched(entry) {
  if (!entry) return false;
  return Boolean(
    entry.answered ||
      entry.hasDocument ||
      entry.supportType ||
      !isBlank(entry.identifier) ||
      !isBlank(entry.identifier2) ||
      getDocumentPolicies(entry).some((policy) => !isBlank(policy.policyNumber))
  );
}

function customDocumentTouched(item) {
  return Boolean(
    item &&
      (trimText(item.label) ||
        trimText(item.identifier) ||
        item.hasDocument ||
        item.supportType ||
        item.answered)
  );
}

function normalizeCustomDocument(item) {
  const label = trimText(item.label);
  const hasDocument = Boolean(item.hasDocument);
  const hasSupportRequest =
    item.supportType === DOCUMENT_SUPPORT_TYPES.CORRECTION ||
    item.supportType === DOCUMENT_SUPPORT_TYPES.CREATION;

  return {
    type: customDocumentType(item.id),
    label,
    hasDocument,
    answered: true,
    identifier:
      hasDocument && !isBlank(item.identifier)
        ? trimText(item.identifier).slice(0, 60)
        : null,
    identifier2: null,
    supportType: hasSupportRequest
      ? hasDocument
        ? DOCUMENT_SUPPORT_TYPES.CORRECTION
        : DOCUMENT_SUPPORT_TYPES.CREATION
      : null,
    details: null,
  };
}

export function serializeDocuments(documents) {
  return BENEFICIARY_DOCUMENTS.reduce((rows, document) => {
    if (document.isCustomList) {
      const items = documents?.[document.type]?.items || [];
      for (const item of items) {
        if (!customDocumentTouched(item)) continue;
        const normalized = normalizeCustomDocument(item);
        if (!normalized.label) continue;
        rows.push(normalized);
      }
      return rows;
    }

    const entry = documents?.[document.type];
    if (!isDocumentEntryTouched(entry)) return rows;
    rows.push(normalizeDocumentEntry(document, entry));
    return rows;
  }, []);
}

export function validateDocumentEntry(document, entry) {
  const errors = {};
  if (!entry?.hasDocument) return errors;

  if (document.supportsPolicies) {
    const policies = getDocumentPolicies(entry);
    if (policies.length === 0) {
      errors.identifier = "Add at least one policy number.";
      return errors;
    }
    const hasIncompletePolicy = policies.some(
      (policy) => isBlank(policy.category) || isBlank(policy.policyNumber)
    );
    if (hasIncompletePolicy) {
      errors.identifier = "Select a category and enter a policy number for each policy.";
    }
    return errors;
  }

  if (document.hasIdentifier === false) return errors;

  const primary = trimText(entry.identifier);
  const secondary = trimText(entry.identifier2);

  if (document.hasSecondaryIdentifier) {
    if (document.requiresAnyIdentifier && isBlank(primary) && isBlank(secondary)) {
      errors.identifier = "Enter the CIF / customer ID or the KCC loan account number.";
      return errors;
    }
    if (!isBlank(primary) && document.validateIdentifier) {
      const message = document.validateIdentifier(primary);
      if (message) errors.identifier = message;
    }
    if (!isBlank(secondary) && document.validateIdentifier2) {
      const message = document.validateIdentifier2(secondary);
      if (message) errors.identifier2 = message;
    }
    return errors;
  }

  if (isBlank(primary)) {
    if (document.identifierRequired) {
      errors.identifier = `${document.identifierLabel || document.label} is required.`;
    }
    return errors;
  }

  if (document.validateIdentifier) {
    const message = document.validateIdentifier(primary);
    if (message) errors.identifier = message;
  }
  return errors;
}

// Returns an object keyed by document type with the first error message.
export function validateDocuments(documents) {
  const errors = {};
  for (const document of BENEFICIARY_DOCUMENTS) {
    if (document.isCustomList) {
      const items = documents?.[document.type]?.items || [];
      const invalidItem = items.find((item) => {
        if (!customDocumentTouched(item)) return false;
        const label = trimText(item.label);
        return !label || label.length < 2 || label.length > 60;
      });
      if (invalidItem) {
        const label = trimText(invalidItem.label);
        errors[document.type] = !label
          ? "Document name is required."
          : label.length < 2
            ? "Enter a valid document name."
            : "Document name is too long.";
      }
      continue;
    }

    const entry = documents?.[document.type];
    const documentErrors = validateDocumentEntry(document, entry);
    const firstMessage = Object.values(documentErrors)[0];
    if (firstMessage) errors[document.type] = firstMessage;
  }
  return errors;
}

function stateFromRegistryDocument(document) {
  const details = document?.details;
  return {
    hasDocument: Boolean(document?.hasDocument),
    answered: document?.answered !== false,
    identifier: document?.identifier || "",
    identifier2: document?.identifier2 || "",
    supportType:
      document?.supportType === DOCUMENT_SUPPORT_TYPES.CORRECTION ||
      document?.supportType === DOCUMENT_SUPPORT_TYPES.CREATION
        ? document.supportType
        : null,
    policies: Array.isArray(details?.policies)
      ? details.policies.map((policy) => ({
          category: policy.category || "HEALTH",
          policyNumber: policy.policyNumber || "",
        }))
      : [],
  };
}

// Builds the modal form state from API registry rows, falling back to the
// legacy Beneficiary columns for records created before the registry existed.
export function buildDocumentsState(apiDocuments, beneficiary) {
  const state = createEmptyDocumentsState();

  for (const document of Array.isArray(apiDocuments) ? apiDocuments : []) {
    if (!document?.type) continue;

    if (isCustomDocumentType(document.type)) {
      state.OTHER.items.push({
        id: document.type.slice(CUSTOM_DOCUMENT_TYPE_PREFIX.length),
        label: document.label || "",
        hasDocument: Boolean(document.hasDocument),
        answered: document.answered !== false,
        identifier: document.identifier || "",
        identifier2: "",
        supportType:
          document.supportType === DOCUMENT_SUPPORT_TYPES.CORRECTION ||
          document.supportType === DOCUMENT_SUPPORT_TYPES.CREATION
            ? document.supportType
            : null,
        policies: [],
      });
      continue;
    }

    if (!state[document.type]) continue;
    state[document.type] = stateFromRegistryDocument(document);
  }

  for (const document of BENEFICIARY_DOCUMENTS) {
    if (!document.legacyField) continue;
    const legacyValue = beneficiary?.[document.legacyField];
    const entry = state[document.type];
    if (!isBlank(legacyValue) && !entry.answered) {
      state[document.type] = {
        ...entry,
        hasDocument: true,
        answered: true,
        identifier: String(legacyValue),
      };
    }
  }

  const hasBankDetails =
    !isBlank(beneficiary?.bankName) ||
    !isBlank(beneficiary?.bankAccountNo) ||
    !isBlank(beneficiary?.bankIfsc);
  const bankEntry = state.BANK_ACCOUNT;
  if (hasBankDetails && !bankEntry.answered) {
    state.BANK_ACCOUNT = {
      ...bankEntry,
      hasDocument: true,
      answered: true,
    };
  }

  return state;
}

export function getDocumentAlerts(beneficiary) {
  const state = buildDocumentsState(beneficiary?.documents, beneficiary);
  const missing = [];
  const support = [];

  for (const document of BENEFICIARY_DOCUMENTS) {
    if (document.isCustomList) continue;

    const entry = state[document.type] || createEmptyDocumentEntry();
    const hasIdentifierValue =
      document.hasIdentifier === false ||
      !isBlank(entry.identifier) ||
      !isBlank(entry.identifier2) ||
      getDocumentPolicies(entry).length > 0;
    const recorded = Boolean(entry.hasDocument) && hasIdentifierValue;

    if (!recorded) {
      missing.push({ label: document.label, section: document.section, type: document.type });
    }
    if (entry.supportType) {
      support.push({
        label: document.label,
        supportType: entry.supportType,
        type: document.type,
      });
    }
  }

  for (const item of state.OTHER?.items || []) {
    if (!item.label) continue;
    if (!item.hasDocument) {
      missing.push({
        label: item.label,
        section: "registrations",
        type: customDocumentType(item.id),
      });
    }
    if (item.supportType) {
      support.push({
        label: item.label,
        supportType: item.supportType,
        type: customDocumentType(item.id),
      });
    }
  }

  return { missing, support };
}

export function getMissingDocuments(beneficiary) {
  return getDocumentAlerts(beneficiary).missing.map((document) => document.label);
}

export function getSupportLabel(document, hasDocument) {
  if (hasDocument) {
    return document.hasIdentifier === false
      ? "Needs help/support with this document"
      : "Needs help/support correcting this document";
  }
  return "Needs help/support obtaining this document";
}

// Converts an incoming API `documents` array into normalised registry rows.
// Returns `{ rows }` on success or `{ error }` when a document is invalid.
export function buildDocumentRows(documents) {
  if (documents === undefined) return { rows: null };
  if (!Array.isArray(documents)) {
    return { error: "Documents must be provided as a list." };
  }

  const rows = [];
  const seenTypes = new Set();
  for (const raw of documents) {
    const isCustom = raw?.type === "OTHER" || isCustomDocumentType(raw?.type);
    const document = getDocumentConfig(isCustom ? "OTHER" : raw?.type);
    if (!document) {
      return { error: `Unknown document type: ${raw?.type || "unknown"}.` };
    }
    if (seenTypes.has(raw?.type)) {
      return { error: `Duplicate document type: ${raw?.type}.` };
    }
    seenTypes.add(raw?.type);

    if (isCustom) {
      const typeId = raw.type.slice(CUSTOM_DOCUMENT_TYPE_PREFIX.length);
      if (!typeId) {
        return { error: "Other document type is invalid." };
      }

      const normalized = normalizeCustomDocument({ ...raw, id: typeId });
      if (!customDocumentTouched(raw)) continue;
      if (!normalized.label) {
        return { error: "Other document: Document name is required." };
      }
      if (normalized.label.length < 2) {
        return { error: "Other document: Enter a valid document name." };
      }
      if (normalized.label.length > 60) {
        return { error: "Other document name is too long." };
      }

      rows.push(normalized);
      continue;
    }

    const normalized = normalizeDocumentEntry(document, raw);
    if (!isDocumentEntryTouched(normalized)) continue;

    const documentErrors = validateDocumentEntry(document, normalized);
    const firstMessage = Object.values(documentErrors)[0];
    if (firstMessage) {
      return { error: `${document.label}: ${firstMessage}` };
    }

    rows.push(normalized);
  }

  return { rows };
}

export function getLegacyDocumentValue(rows, type) {
  const row = (rows || []).find((document) => document.type === type);
  return row?.hasDocument ? row.identifier || null : null;
}

export function documentsToCreateData(rows) {
  return (rows || []).map((document) => ({
    type: document.type,
    label: document.label ?? null,
    hasDocument: document.hasDocument,
    answered: document.answered,
    identifier: document.identifier,
    identifier2: document.identifier2,
    supportType: document.supportType,
    details: document.details ?? undefined,
  }));
}

// Bank details live in their own Beneficiary columns, so the BANK_ACCOUNT
// registry row only carries the support request. Presence is derived from the
// bank fields at save time.
export function applyBankAccountState(documents, hasBankDetails) {
  const bank = documents?.BANK_ACCOUNT || createEmptyDocumentEntry();
  if (!hasBankDetails && !bank.answered && !bank.supportType) return documents;

  return {
    ...documents,
    BANK_ACCOUNT: {
      ...bank,
      hasDocument: Boolean(hasBankDetails),
      answered: true,
      supportType: bank.supportType
        ? hasBankDetails
          ? DOCUMENT_SUPPORT_TYPES.CORRECTION
          : DOCUMENT_SUPPORT_TYPES.CREATION
        : null,
    },
  };
}
