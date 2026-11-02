const IMAGE_EXTENSION = /\.(?:avif|bmp|gif|jpe?g|jfif|png|svg|webp)$/i;
const PDF_EXTENSION = /\.pdf$/i;

const PREVIEWABLE_ROOTS = ["/uploads/", "/api/uploads/", "/docs/"];

function resolveUrl(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const base =
      typeof window !== "undefined" ? window.location.origin : "http://localhost";
    return new URL(url, base);
  } catch (error) {
    return null;
  }
}

export function isSameOriginUrl(url) {
  const parsed = resolveUrl(url);
  if (!parsed) return false;
  if (typeof window === "undefined") return true;
  return parsed.origin === window.location.origin;
}

export function fileNameFromUrl(url) {
  const parsed = resolveUrl(url);
  if (!parsed) return "Document";
  const last = parsed.pathname.split("/").filter(Boolean).pop();
  if (!last) return "Document";
  try {
    return decodeURIComponent(last);
  } catch (error) {
    return last;
  }
}

/**
 * Returns "image", "pdf" or null. Only same-origin uploaded/docs files are
 * previewed; external links keep their normal new-tab behaviour.
 */
export function getPreviewKind(url) {
  const parsed = resolveUrl(url);
  if (!parsed) return null;
  if (typeof window !== "undefined" && parsed.origin !== window.location.origin) {
    return null;
  }
  if (!PREVIEWABLE_ROOTS.some((root) => parsed.pathname.startsWith(root))) {
    return null;
  }
  if (PDF_EXTENSION.test(parsed.pathname)) return "pdf";
  if (IMAGE_EXTENSION.test(parsed.pathname)) return "image";
  return null;
}

export function canPreviewFile(url) {
  return getPreviewKind(url) !== null;
}
