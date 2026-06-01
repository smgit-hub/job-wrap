"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import type { JobPhoto } from "@/types/report";
import { compressImage } from "@/lib/photoStorage";

const MAX_PHOTOS = 6;

interface PhotoSectionProps {
  photos: JobPhoto[];
  onChange: (photos: JobPhoto[]) => void;
}

export default function PhotoSection({ photos, onChange }: PhotoSectionProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // 20 MB raw limit — compressImage will downscale anyway, but we refuse
  // clearly oversized files early to avoid hanging the UI on a 100 MB HEIC.
  const MAX_RAW_BYTES = 20 * 1024 * 1024;
  const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPhotoError(null);
    const slots = MAX_PHOTOS - photos.length;
    if (slots <= 0) return;
    const toProcess = Array.from(files).slice(0, slots);

    const newPhotos: JobPhoto[] = [];
    let skipped = 0;
    for (const file of toProcess) {
      // Validate file type and size before attempting compression.
      // Allow empty MIME type (iOS sometimes returns "" for library photos) — let compressImage handle it.
      const mimeOk = file.type === "" || ALLOWED_TYPES.has(file.type) || file.type.startsWith("image/");
      const extOk = file.name.match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i);
      if (!mimeOk && !extOk) {
        console.warn(`[PhotoSection] Skipping unsupported file type: ${file.type} / ${file.name}`);
        skipped++;
        continue;
      }
      if (file.size > MAX_RAW_BYTES) {
        console.warn(`[PhotoSection] Skipping file over 20 MB: ${file.name} (${file.size} bytes)`);
        skipped++;
        continue;
      }
      try {
        const dataUrl = await compressImage(file);
        newPhotos.push({
          id: `ph_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          dataUrl,
          capturedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("[PhotoSection] Failed to process photo:", file.name, err);
        skipped++;
      }
    }

    if (newPhotos.length > 0) {
      onChange([...photos, ...newPhotos]);
    }
    if (skipped > 0 && newPhotos.length === 0) {
      setPhotoError("Couldn't add the photo. Try a different image or format.");
    }
  }

  function removePhoto(id: string) {
    onChange(photos.filter((p) => p.id !== id));
  }

  const canAdd = photos.length < MAX_PHOTOS;

  return (
    <div className="space-y-3">
      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-xl overflow-hidden bg-slate-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.dataUrl}
                alt=""
                className="w-full h-full object-cover"
              />

              {/* Remove */}
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/55 flex items-center justify-center active:bg-black/75 transition-colors"
                aria-label="Remove photo"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      {canAdd && (
        <button
          onClick={() => galleryRef.current?.click()}
          aria-label="Add photos"
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 text-orange-500 text-sm font-semibold active:bg-orange-100 transition-colors"
        >
          <ImagePlus className="w-4 h-4" />
          Add Photos
        </button>
      )}

      {photos.length > 0 && photos.length < MAX_PHOTOS && (
        <p className="text-xs text-slate-500 text-center">
          {MAX_PHOTOS - photos.length} slot{MAX_PHOTOS - photos.length !== 1 ? "s" : ""} remaining
        </p>
      )}
      {photos.length === MAX_PHOTOS && (
        <p className="text-xs text-slate-500 text-center">Maximum {MAX_PHOTOS} photos per report</p>
      )}
      {photos.length === 0 && (
        <p className="text-xs text-slate-500 text-center">
          Attach photos from your camera roll or take new ones · up to {MAX_PHOTOS}
        </p>
      )}

      {/* Error feedback */}
      {photoError && (
        <p className="text-xs text-red-500 text-center">{photoError}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
