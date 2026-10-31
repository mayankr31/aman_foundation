"use client";

import DatePicker from "react-datepicker";
import { toISODateOnly } from "@/lib/date";

function pad(value) {
  return String(value).padStart(2, "0");
}

function isoToDate(value) {
  const iso = toISODateOnly(value);
  if (!iso) return null;

  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function dateToIso(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDisplayDate(value) {
  const match = String(value || "").match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return "";

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12) return "";

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "";
  }

  return `${year}-${pad(month)}-${pad(day)}`;
}

function isWithinRange(iso, min, max) {
  const minIso = toISODateOnly(min);
  const maxIso = toISODateOnly(max);
  if (minIso && iso < minIso) return false;
  if (maxIso && iso > maxIso) return false;
  return true;
}

/**
 * Date input that always displays DD-MM-YYYY while keeping the form value in
 * ISO format (YYYY-MM-DD) for APIs. Uses react-datepicker so the calendar
 * popup, icon, focus handling, and positioning are handled by the library.
 */
export default function DateInput({
  value = "",
  onChange,
  name,
  id,
  className = "",
  required = false,
  disabled = false,
  min,
  max,
  placeholder = "dd-mm-yyyy",
  onBlur,
  onFocus,
  ...rest
}) {
  const selected = isoToDate(value);
  const minDate = isoToDate(min);
  const maxDate = isoToDate(max);

  // Inputs that explicitly ask for full width should stretch their wrapper.
  // Everything else stays content-sized so the calendar icon always sits
  // inside the input border instead of at the edge of a stretched wrapper.
  const fullWidth = /(^|\s)(w-full|flex-1)(\s|$)/.test(className);

  const emit = (date) => {
    onChange?.({
      target: {
        name,
        value: date ? dateToIso(date) : "",
      },
    });
  };

  const handleRawChange = (event, selectionMeta) => {
    // Calendar clicks also call onChangeRaw with selection metadata. Let the
    // library's normal onChange handle those.
    if (selectionMeta) return;

    const target = event?.target;
    if (!(target instanceof HTMLInputElement)) return;

    const raw = target.value ?? "";
    if (!raw) {
      emit(null);
      return;
    }

    const iso = parseDisplayDate(raw);
    if (!iso || !isWithinRange(iso, min, max)) {
      emit(null);
    }
  };

  return (
    <DatePicker
      selected={selected}
      onChange={emit}
      onChangeRaw={handleRawChange}
      dateFormat="dd-MM-yyyy"
      placeholderText={placeholder}
      minDate={minDate}
      maxDate={maxDate}
      wrapperClassName={`aman-datepicker-wrapper${fullWidth ? " aman-datepicker-full" : ""}`}
      calendarClassName="aman-datepicker-calendar"
      popperClassName="aman-datepicker-popper"
      portalId="aman-datepicker-portal"
      popperPlacement="bottom-start"
      showPopperArrow={false}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      scrollableYearDropdown
      yearDropdownItemNumber={100}
      todayButton="Today"
      autoComplete="off"
      name={name}
      id={id}
      className={className}
      required={required}
      disabled={disabled}
      onBlur={onBlur}
      onFocus={onFocus}
      title="Select a date (DD-MM-YYYY)"
      {...rest}
    />
  );
}
