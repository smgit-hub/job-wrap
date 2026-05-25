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
  } catch {
    // localStorage full — photos won't save silently
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
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height / width) * MAX_DIMENSION);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width / height) * MAX_DIMENSION);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image failed to load"));
    };

    img.src = objectUrl;
  });
}
