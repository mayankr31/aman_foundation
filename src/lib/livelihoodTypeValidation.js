const FIELD_TYPES = ["number", "select", "textarea", "text"];
const COLUMN_TYPES = ["text", "number", "currency", "badge"];
const AGGREGATES = ["sum", "avg"];

function asArray(value, fallback = []) {
  if (Array.isArray(value)) return value;
  return fallback;
}

export function normalizeFields(input) {
  const fields = [];
  const seen = new Set();
  for (const raw of asArray(input)) {
    if (!raw) continue;
    const name = String(raw.name || "").trim();
    const label = String(raw.label || "").trim();
    const type = String(raw.type || "text").trim();
    if (!name || !label) {
      return { error: "Every field needs a name and a label" };
    }
    if (!FIELD_TYPES.includes(type)) {
      return { error: `Unsupported field type "${type}" for field "${label}"` };
    }
    if (seen.has(name)) {
      return { error: `Duplicate field name "${name}"` };
    }
    seen.add(name);

    const field = { name, label, type };
    if (raw.step !== undefined && raw.step !== null && raw.step !== "") {
      field.step = String(raw.step);
    }
    if (raw.unit) field.unit = String(raw.unit);
    if (type === "select") {
      const options = asArray(raw.options).map((o) => String(o).trim()).filter(Boolean);
      if (options.length === 0) {
        return { error: `Field "${label}" needs at least one option` };
      }
      field.options = options;
    }
    fields.push(field);
  }
  return { fields };
}

export function normalizeEventTypes(input) {
  const eventTypes = asArray(input)
    .map((t) => String(t).trim())
    .filter(Boolean);
  return { eventTypes };
}

export function normalizeTableColumns(input) {
  const tableColumns = [];
  const seen = new Set();
  for (const raw of asArray(input)) {
    if (!raw) continue;
    const key = String(raw.key || "").trim();
    const label = String(raw.label || "").trim();
    const type = String(raw.type || "text").trim();
    if (!key || !label) {
      return { error: "Every column needs a key and a label" };
    }
    if (!COLUMN_TYPES.includes(type)) {
      return { error: `Unsupported column type "${type}" for column "${label}"` };
    }
    if (seen.has(key)) {
      return { error: `Duplicate column key "${key}"` };
    }
    seen.add(key);
    const column = { key, label, type };
    if (raw.unit) column.unit = String(raw.unit);
    tableColumns.push(column);
  }
  return { tableColumns };
}

export function normalizeKpiCards(input) {
  const kpiCards = [];
  const seen = new Set();
  for (const raw of asArray(input)) {
    if (!raw) continue;
    const key = String(raw.key || "").trim();
    const label = String(raw.label || "").trim();
    const aggregate = String(raw.aggregate || "sum").trim();
    if (!key || !label) {
      return { error: "Every KPI card needs a key and a label" };
    }
    if (!AGGREGATES.includes(aggregate)) {
      return { error: `Unsupported aggregate "${aggregate}" for KPI "${label}"` };
    }
    if (seen.has(key)) {
      return { error: `Duplicate KPI key "${key}"` };
    }
    seen.add(key);
    const kpi = { key, label, aggregate };
    if (raw.format) kpi.format = String(raw.format);
    if (raw.unit) kpi.unit = String(raw.unit);
    if (raw.icon) kpi.icon = String(raw.icon);
    kpiCards.push(kpi);
  }
  return { kpiCards };
}

// Validates and normalizes the configurable sections of a livelihood type.
export function normalizeTypeConfig(body = {}) {
  const fields = normalizeFields(body.fields);
  if (fields.error) return fields;
  const eventTypes = normalizeEventTypes(body.eventTypes);
  const tableColumns = normalizeTableColumns(body.tableColumns);
  if (tableColumns.error) return tableColumns;
  const kpiCards = normalizeKpiCards(body.kpiCards);
  if (kpiCards.error) return kpiCards;

  return {
    fields: fields.fields,
    eventTypes: eventTypes.eventTypes,
    tableColumns: tableColumns.tableColumns,
    kpiCards: kpiCards.kpiCards,
  };
}
