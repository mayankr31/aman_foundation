import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "reimbursements");
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "webp", "heic", "heif"]);

function extensionFor(file) {
  const fromName = (file.name || "").split(".").pop()?.toLowerCase();
  if (fromName && ALLOWED_EXTENSIONS.has(fromName)) return fromName === "jpeg" ? "jpg" : fromName;
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/heic") return "heic";
  if (file.type === "image/heif") return "heif";
  return "jpg";
}

export function validateReceiptFile(file) {
  if (!file || typeof file === "string" || !file.size) {
    return { ok: false, error: "Empty or invalid receipt file." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: `Receipt "${file.name}" is larger than 10 MB.` };
  }

  const extension = (file.name || "").split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_MIME_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(extension)) {
    return {
      ok: false,
      error: `Receipt "${file.name}" must be a PDF or an image (JPG, PNG, WEBP, HEIC).`,
    };
  }

  return { ok: true };
}

export async function saveReceiptFile(file) {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${crypto.randomUUID()}.${extensionFor(file)}`;
  await writeFile(join(UPLOAD_DIR, filename), buffer);
  return `/uploads/reimbursements/${filename}`;
}

export function isReimbursementReceiptUrl(value) {
  return typeof value === "string" && value.startsWith("/uploads/reimbursements/");
}
