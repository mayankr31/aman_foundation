import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { join, resolve, extname, sep } from "path";
import { Readable } from "stream";

// Uploaded files are written to public/uploads at runtime. Next.js only serves
// files that existed in `public` when the production server started, so those
// files 404 in production. A rewrite (see next.config.mjs) sends /uploads/* here
// and we stream the file straight from disk instead.
const UPLOAD_ROOT = resolve(join(process.cwd(), "public", "uploads"));

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CONTENT_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jfif: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  heic: "image/heic",
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function contentTypeFor(filePath) {
  const ext = extname(filePath).slice(1).toLowerCase();
  return CONTENT_TYPES[ext] || "application/octet-stream";
}

export async function GET(req, context) {
  const { path: segments } = await context.params;
  const parts = Array.isArray(segments) ? segments : [segments].filter(Boolean);

  const filePath = resolve(join(UPLOAD_ROOT, ...parts));
  // Guard against path traversal (e.g. ../../etc/passwd).
  if (filePath !== UPLOAD_ROOT && !filePath.startsWith(UPLOAD_ROOT + sep)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      return new Response("Not found", { status: 404 });
    }

    const stream = Readable.toWeb(createReadStream(filePath));
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": contentTypeFor(filePath),
        "Content-Length": String(info.size),
        // Filenames are UUIDs, so contents never change for a given URL.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
