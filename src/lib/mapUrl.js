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
