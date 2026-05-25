// ---------------------------------------------------------------------------
// extractJobInfo
// Client-side extraction of job metadata from a freeform voice transcript.
// Best-effort only — missing fields stay undefined and the user fills them in.
// ---------------------------------------------------------------------------

import type { ServiceType } from "@/types/report";

export interface ExtractedJobInfo {
  customerName?: string;
  serviceAddress?: string;
  serviceType?: ServiceType;
  equipmentDetails?: string;
}

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function extractJobInfo(transcript: string): ExtractedJobInfo {
  const result: ExtractedJobInfo = {};
  const t = transcript;
  const lower = t.toLowerCase();

  // ── Equipment ──────────────────────────────────────────────────────────────
  const brandPattern =
    /\b(carrier|lennox|trane|daikin|goodman|bryant|rheem|york|mitsubishi|fujitsu|bosch|amana|ruud|heil|napoleon|comfortmaker|keeprite|ducane|armstrong|maytag|frigidaire)\b/gi;
  const typePattern =
    /\b(\d+(?:\.\d+)?\s*[-–]?\s*ton|heat pump|gas furnace|electric furnace|furnace|air handler|condenser|split system|mini[\s-]?split|rooftop unit|rtu|boiler|central air|package unit)\b/gi;
  const modelPattern = /\b([A-Z]{2,4}\d{3,}[A-Z0-9\-]*)\b/g;

  const seen = new Set<string>();
  const parts: string[] = [];
  for (const m of [
    ...(t.match(brandPattern) ?? []),
    ...(t.match(typePattern) ?? []),
    ...(t.match(modelPattern) ?? []),
  ]) {
    const key = m.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      parts.push(toTitleCase(m));
    }
  }
  if (parts.length > 0) result.equipmentDetails = parts.join(", ");

  // ── Service type ───────────────────────────────────────────────────────────
  if (/no cooling|not cooling|won.t cool|no cold air|warm air|no ac\b|unit not cooling|not cold/i.test(lower)) {
    result.serviceType = "hvac-repair";
  } else if (/no heat|not heating|won.t heat|no hot air|not warm|furnace not/i.test(lower)) {
    result.serviceType = "hvac-repair";
  } else if (/install|installation|new system|brand new|replacing the whole|new unit/i.test(lower)) {
    result.serviceType = "hvac-install";
  } else if (/start[\s-]?up|seasonal|spring start|fall start|cooling season|heating season|end of season/i.test(lower)) {
    result.serviceType = "hvac-seasonal";
  } else if (/warranty/i.test(lower)) {
    result.serviceType = "hvac-warranty";
  } else if (/emergency|urgent|flooded|no power/i.test(lower)) {
    result.serviceType = "hvac-emergency";
  } else if (/inspection|annual inspect/i.test(lower)) {
    result.serviceType = "hvac-inspection";
  } else if (/maintenance|tune[\s-]?up|preventative|annual service|pm\b|service call/i.test(lower)) {
    result.serviceType = "hvac-maintenance";
  }

  // ── Customer name ─────────────────────────────────────────────────────────
  // Speech-to-text is usually lowercase so match case-insensitively, then title-case the result
  const namePatterns = [
    /\bfor\s+([a-z]+(?:\s+[a-z]+){1,2})\b(?:\s+at|\s+on|\s+in|,|\.)/i,
    /\bcustomer(?:'?s)?\s+(?:name\s+is\s+|is\s+)?([a-z]+\s+[a-z]+)\b/i,
    /\bhomeowner(?:'?s)?\s+(?:name\s+is\s+|is\s+)?([a-z]+\s+[a-z]+)\b/i,
    /\b([a-z]+\s+[a-z]+)'s\s+(?:place|home|house|unit|system|property|address)\b/i,
    /\bowner\s+(?:is\s+)?([a-z]+\s+[a-z]+)\b/i,
  ];
  for (const pattern of namePatterns) {
    const match = t.match(pattern);
    if (match?.[1]) {
      const name = toTitleCase(match[1].trim());
      // Filter out common false positives
      const STOP_WORDS = new Set(["the system", "the unit", "this unit", "split system", "heat pump"]);
      if (!STOP_WORDS.has(name.toLowerCase())) {
        result.customerName = name;
        break;
      }
    }
  }

  // ── Service address ────────────────────────────────────────────────────────
  // Match "at/on [number] [street name] [type]"
  const addrPattern =
    /\b(?:at|on)\s+(\d+\s+(?:[a-z']+\s+){1,4}(?:street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|court|ct|lane|ln|way|place|pl|crescent|cres|close|grove|terrace|parade|highway|hwy))\b/i;
  const addrMatch = t.match(addrPattern);
  if (addrMatch?.[1]) result.serviceAddress = toTitleCase(addrMatch[1].trim());

  return result;
}
