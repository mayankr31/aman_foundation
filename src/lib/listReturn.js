"use client";

const STORAGE_KEY = "aman:list-return";
const MAX_AGE_MS = 60 * 60 * 1000;

function normalizePage(value) {
  const page = Math.floor(Number(value));
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function readPageParam(paramKey) {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get(paramKey);
  if (value == null || value === "") return null;
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : null;
}

export function writePageParam(paramKey, page) {
  if (typeof window === "undefined") return;
  const safePage = normalizePage(page);
  const url = new URL(window.location.href);
  if (safePage <= 1) {
    url.searchParams.delete(paramKey);
  } else {
    url.searchParams.set(paramKey, String(safePage));
  }
  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) {
    window.history.replaceState(window.history.state, "", next);
  }
}

export function withPageParam(href, paramKey, page) {
  if (typeof window === "undefined") return href;
  const url = new URL(href, window.location.origin);
  const safePage = normalizePage(page);
  if (safePage <= 1) {
    url.searchParams.delete(paramKey);
  } else {
    url.searchParams.set(paramKey, String(safePage));
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function saveListReturn(marker) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(marker));
  } catch {
    // Session storage can be unavailable in strict privacy modes.
  }
}

export function readListReturn() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const marker = JSON.parse(raw);
    if (!marker || typeof marker !== "object" || !marker.listPath || !marker.itemKey) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (!Number.isFinite(marker.savedAt) || Date.now() - marker.savedAt > MAX_AGE_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return marker;
  } catch {
    return null;
  }
}

export function clearListReturn() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function isListReturnStale(marker, pathname) {
  if (!marker) return true;
  if (marker.listPath === pathname) return false;

  if (marker.detailPath) {
    const detailPath = marker.detailPath.endsWith("/") ? marker.detailPath.slice(0, -1) : marker.detailPath;
    return pathname !== detailPath && !pathname.startsWith(`${detailPath}/`);
  }

  const prefixes = String(marker.detailPrefixes || "")
    .split(",")
    .map((prefix) => prefix.trim())
    .filter(Boolean);

  if (prefixes.length > 0) {
    return !prefixes.some((prefix) => pathname.startsWith(prefix));
  }

  return false;
}
