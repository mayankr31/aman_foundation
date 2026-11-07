import { writeFile, mkdir, access } from "fs/promises";
import { constants } from "fs";
import { join } from "path";
import crypto from "crypto";

export const UPLOAD_ROOT = join(process.cwd(), "public", "uploads");

export const DEFAULT_MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export const DOCUMENT_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "txt",
  "csv",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
]);

export const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function extensionFor(file) {
  const fromName = String(file?.name || "").split(".").pop()?.toLowerCase();
  if (fromName && DOCUMENT_EXTENSIONS.has(fromName)) return fromName === "jpeg" ? "jpg" : fromName;
  if (file?.type === "application/pdf") return "pdf";
  if (file?.type === "text/plain") return "txt";
  if (file?.type === "text/csv") return "csv";
  if (file?.type === "image/jpeg") return "jpg";
  if (file?.type === "image/png") return "png";
  if (file?.type === "image/webp") return "webp";
  if (file?.type === "image/heic") return "heic";
  if (file?.type === "image/heif") return "heif";
  return "bin";
}

export function validateUploadFile(file, { maxSize = DEFAULT_MAX_UPLOAD_BYTES } = {}) {
  if (!file || typeof file === "string" || !file.size) {
    return { ok: false, error: "The selected file is empty or invalid." };
  }
  if (file.size > maxSize) {
    return {
      ok: false,
      error: `"${file.name || "File"}" is larger than ${Math.round(maxSize / (1024 * 1024))} MB.`,
    };
  }

  const extension = String(file.name || "").split(".").pop()?.toLowerCase() || "";
  if (!DOCUMENT_MIME_TYPES.has(file.type) && !DOCUMENT_EXTENSIONS.has(extension)) {
    return {
      ok: false,
      error: `"${file.name || "File"}" must be a document (PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, CSV) or an image.`,
    };
  }

  return { ok: true };
}

async function ensureWritableDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
    await access(dir, constants.W_OK);
  } catch (error) {
    const wrapped = new Error(
      `Upload directory is not writable: ${dir}${error?.code ? ` (${error.code})` : ""}`
    );
    wrapped.code = error?.code || "EACCES";
    throw wrapped;
  }
}

/**
 * Saves one uploaded file under public/uploads/<folder> and returns a URL that
 * is served by the /api/uploads route (works in production standalone builds).
 */
export async function saveUploadedFile(file, { folder, maxSize = DEFAULT_MAX_UPLOAD_BYTES } = {}) {
  const validation = validateUploadFile(file, { maxSize });
  if (!validation.ok) {
    const error = new Error(validation.error);
    error.status = 400;
    throw error;
  }

  const safeFolder = String(folder || "files").replace(/[^a-zA-Z0-9/_-]/g, "");
  const dir = join(UPLOAD_ROOT, safeFolder);
  await ensureWritableDir(dir);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const extension = extensionFor(file);
  const filename = `${crypto.randomUUID()}.${extension}`;
  await writeFile(join(dir, filename), buffer);
  return `/api/uploads/${safeFolder}/${filename}`;
}
