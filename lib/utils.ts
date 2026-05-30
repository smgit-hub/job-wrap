import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitise a brand colour value before using it in CSS or PDF styles.
 * Accepts any valid CSS hex colour (#rgb, #rrggbb) or a small set of named
 * colours. Falls back to the safe default when the value is unrecognised.
 *
 * This prevents garbage or injection strings from reaching inline styles or
 * the @react-pdf/renderer backgroundColor prop.
 */
export function safeBrandColor(value: string | undefined, fallback = "#0f172a"): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  // Allow 3- or 6-digit hex colours only
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) return trimmed;
  return fallback;
}
