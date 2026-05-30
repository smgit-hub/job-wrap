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
/**
 * Convert stored ISO date (YYYY-MM-DD) to display format (DD/MM/YYYY).
 * Returns empty string if input is empty or unparseable.
 */
export function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/**
 * Convert display input (DD/MM/YYYY, tolerant of partial entry) back to
 * ISO format (YYYY-MM-DD) for storage. Returns the raw string while the
 * user is still typing (fewer than 8 digits entered).
 */
export function displayToIso(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (digits.length < 8) return "";
  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const y = digits.slice(4, 8);
  return `${y}-${m}-${d}`;
}

export function safeBrandColor(value: string | undefined, fallback = "#0f172a"): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  // Allow 3- or 6-digit hex colours only
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) return trimmed;
  return fallback;
}
