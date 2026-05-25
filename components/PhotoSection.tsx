"use client";

import { useRef } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import type { JobPhoto } from "@/types/report";
import { compressImage } from "@/lib/photoStorage";

const MAX_PHOTOS = 6;

interface PhotoSectionProps {
  photos: JobPhoto[];
  onChange: (photos: JobPhoto[]) => void;
}

export default function PhotoSection({ photos, onChange }: PhotoSectionProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const slots = MAX_PHOTOS - photos.length;
    if (slots <= 0) return;
    const toProcess = Array.from(files).slice(0, slots);

    const newPhotos: JobPhoto[] = [];
    for (const file of toProcess) {
      try {
        const dataUrl = await compressImage(file);
        // First photo added to an empty report defaults to "before",
        // everything else defaults to "after"
        const label: JobPhoto["label"] =
          photos.length === 0 && newPhotos.length === 0 ? "before" : "after";
        newPhotos.push({
          id: `ph_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          label,
          dataUrl,
          capturedAt: new Date().toISOString(),
        });
      } catch {
        // Skip images that fail to compress
      }
    }

    if (newPhotos.length > 0) {
      onChange([...photos, ...newPhotos]);
    }
  }

  function toggleLabel(id: string) {
    onChange(
      photos.map((p) =>
        p.id === id ? { ...p, label: p.label === "before" ? "after" : "before" } : p
      )
    );
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

              {/* Before / After label toggle */}
              <button
                onClick={() => toggleLabel(photo.id)}
                className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-black/55 active:bg-black/75 transition-colors"
              >
                {photo.label === "before" ? "Before" : "After"}
              </button>

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

      {/* Add buttons */}
      {canAdd && (
        <div className="flex gap-2">
          <button
            onClick={() => cameraRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 text-orange-500 text-sm font-semibold active:bg-orange-100 transition-colors"
          >
            <Camera className="w-4 h-4" />
            Camera
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 text-orange-500 text-sm font-semibold active:bg-orange-100 transition-colors"
          >
            <ImagePlus className="w-4 h-4" />
            Gallery
          </button>
        </div>
      )}

      {photos.length > 0 && photos.length < MAX_PHOTOS && (
        <p className="text-xs text-slate-400 text-center">
          {MAX_PHOTOS - photos.length} slot{MAX_PHOTOS - photos.length !== 1 ? "s" : ""} remaining · tap a label to toggle Before / After
        </p>
      )}
      {photos.length === MAX_PHOTOS && (
        <p className="text-xs text-slate-400 text-center">Maximum {MAX_PHOTOS} photos per report</p>
      )}
      {photos.length === 0 && (
        <p className="text-xs text-slate-400 text-center">
          Attach photos from your camera roll or take new ones · up to {MAX_PHOTOS}
        </p>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
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
