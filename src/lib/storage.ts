import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Saves an uploaded property photo and returns its public URL, or null if
 * no file was provided. Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set
 * (production), otherwise writes to public/uploads for local dev — Vercel's
 * filesystem is ephemeral/read-only, so local writes only work locally.
 */
export async function savePhoto(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const ext = path.extname(file.name) || ".jpg";
  const filename = `${randomUUID()}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(filename, file, { access: "public" });
    return blob.url;
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
}
