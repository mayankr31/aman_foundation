export function extractMapEmbedUrl(input) {
  if (!input) return "";
  const value = String(input).trim();
  if (!value) return "";

  if (value.includes("<iframe")) {
    const match = value.match(/<iframe[^>]*\ssrc\s*=\s*["']([^"']+)["']/i);
    if (match && match[1]) return match[1].trim();
  }

  return value;
}

const GOOGLE_MAP_HOSTS = new Set([
  "google.com",
  "www.google.com",
  "maps.google.com",
  "www.google.co.in",
  "maps.google.co.in",
]);

/**
 * Returns true only for real Google Maps embed URLs. Ordinary Google Maps
 * place/share links and arbitrary external URLs are rejected so they can never
 * be rendered inside the page iframe.
 */
export function isValidMapEmbedUrl(input) {
  const value = extractMapEmbedUrl(input);
  if (!value) return false;

  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== "https:") return false;
  if (!GOOGLE_MAP_HOSTS.has(url.hostname.toLowerCase())) return false;

  const path = url.pathname.toLowerCase();
  if (path.includes("/maps/embed") || path.includes("/maps/d/embed")) return true;
  if (path.startsWith("/maps") && url.searchParams.get("output") === "embed") return true;

  return false;
}

/** Extracts the URL and returns it only when it is a valid embed URL. */
export function getSafeMapEmbedUrl(input) {
  return isValidMapEmbedUrl(input) ? extractMapEmbedUrl(input) : "";
}
