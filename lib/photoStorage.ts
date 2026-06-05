// TODO(performance): photos are stored as base64 JPEG in localStorage.
// A 900px JPEG at 0.75 quality averages ~100–200 KB per photo; 6 photos per
// report × many reports can exhaust the 5 MB localStorage quota quickly.
// For production, migrate photo storage to IndexedDB (no practical quota) or
// to Supabase Storage (see lib/supabase/queries/storage.ts — "report-images" bucket TODO).

import type { JobPhoto } from "@/types/report";

const PHOTOS_KEY = "jobwrap_photos";
const MAX_DIMENSION = 900; // px — good balance of quality vs. storage
const JPEG_QUALITY = 0.75;

function getAll(): Record<string, JobPhoto[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PHOTOS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, JobPhoto[]>) : {};
  } catch {
    return {};
  }
}

function setAll(data: Record<string, JobPhoto[]>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PHOTOS_KEY, JSON.stringify(data));
  } catch (err) {
    // QuotaExceededError is very common here because base64 photos are large.
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      console.warn(
        "[photoStorage] localStorage quota exceeded — photos could not be saved. " +
        "This is expected once many photo-rich reports are stored. " +
        "Migrate to IndexedDB or Supabase Storage to resolve."
      );
    } else {
      console.warn("[photoStorage] localStorage.setItem failed:", err);
    }
  }
}

export function getPhotosForReport(reportId: string): JobPhoto[] {
  return getAll()[reportId] ?? [];
}

export function savePhotosForReport(reportId: string, photos: JobPhoto[]): void {
  const all = getAll();
  if (photos.length === 0) {
    delete all[reportId];
  } else {
    all[reportId] = photos;
  }
  setAll(all);
}

export function deletePhotosForReport(reportId: string): void {
  const all = getAll();
  delete all[reportId];
  setAll(all);
}

// Compress a File to a base64 data URL.
// Resizes to MAX_DIMENSION on the longest edge, then encodes as JPEG.
// Falls back to raw FileReader data URL if canvas decode fails (e.g. HEIC on some browsers).
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Crop to 4:3 landscape — centre crop so photos fit the PDF grid cleanly
      const TARGET_RATIO = 4 / 3;
      let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;
      const imgRatio = img.width / img.height;
      if (imgRatio > TARGET_RATIO) {
        // Too wide — crop sides
        srcW = Math.round(img.height * TARGET_RATIO);
        srcX = Math.round((img.width - srcW) / 2);
      } else if (imgRatio < TARGET_RATIO) {
        // Too tall — crop top/bottom
        srcH = Math.round(img.width / TARGET_RATIO);
        srcY = Math.round((img.height - srcH) / 2);
      }

      // Scale to MAX_DIMENSION on the longest edge
      let outW = srcW, outH = srcH;
      if (outW > MAX_DIMENSION) {
        outH = Math.round((outH / outW) * MAX_DIMENSION);
        outW = MAX_DIMENSION;
      }

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        readAsDataUrl(file, resolve, reject);
        return;
      }
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };

    img.onerror = () => {
      // Canvas/Image can't decode this format (e.g. HEIC) — fall back to raw data URL
      URL.revokeObjectURL(objectUrl);
      console.warn("[compressImage] Image decode failed, using raw FileReader fallback for:", file.name);
      readAsDataUrl(file, resolve, reject);
    };

    img.src = objectUrl;
  });
}

function readAsDataUrl(
  file: File,
  resolve: (v: string) => void,
  reject: (e: Error) => void,
): void {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") {
      resolve(reader.result);
    } else {
      reject(new Error("FileReader did not return a string"));
    }
  };
  reader.onerror = () => reject(new Error("FileReader failed"));
  reader.readAsDataURL(file);
}
