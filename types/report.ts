export type ServiceType =
  | "hvac-maintenance"
  | "hvac-emergency"
  | "hvac-repair"
  | "hvac-install"
  | "hvac-seasonal"
  | "hvac-inspection"
  | "hvac-warranty"
  | "other";

export type ReportStatus = "draft" | "complete";

// ── Job photos ───────────────────────────────────────────────────────────────
// Attached to a report after generation. Stored separately in photoStorage.
export interface JobPhoto {
  id: string;
  label: "before" | "after";
  dataUrl: string; // compressed base64 JPEG
  capturedAt: string;
}

// ── Customer profile ─────────────────────────────────────────────────────────
// Persisted across jobs so returning customers pre-fill the new job flow.
export interface Customer {
  id: string;
  name: string;
  address: string;
  equipmentDetails: string; // single text field — multi-unit list is a future enhancement
  siteNotes: string;        // gate codes, access instructions, dogs, etc.
  phone?: string;           // added manually via customer screen, not captured from job notes
  email?: string;           // added manually via customer screen, not captured from job notes
  createdAt: string;
  updatedAt: string;
}

// ── Structured voice capture ─────────────────────────────────────────────────
// Five focused sections, each maps 1-to-1 to a guided recording step.
// Future: add per-ServiceType variants (commercial, refrigeration, etc.) here.
export interface VoiceNotes {
  equipmentDetails: string; // "What equipment are you working on?"
  workCompleted: string;    // "What tasks did you complete?"
  diagnostics: string;      // "Diagnostics & findings — readings, test results, condition"
  recommendations: string;  // "Recommendations and next steps"
}

export const EMPTY_VOICE_NOTES: VoiceNotes = {
  equipmentDetails: "",
  workCompleted: "",
  diagnostics: "",
  recommendations: "",
};

export interface BusinessProfile {
  businessName: string;
  technicianName: string;
  phone: string;
  email: string;
  licenseNumber: string;
  brandColor: string;
  logoUrl?: string;
  tagline?: string;
  website?: string;
}

export interface JobDetails {
  customerName: string;
  serviceAddress: string;
  serviceType: ServiceType;
  /** Free-text label used when serviceType === "other" */
  customServiceType?: string;
  jobDate: string;
  voiceNotes: VoiceNotes;
}

export interface GeneratedReport {
  customerSummary?: string; // Plain-English summary for the customer — optional for backward compat
  workCompleted: string;
  diagnostics: string;
  recommendations: string;
}

export interface ServiceReport {
  id: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  business: BusinessProfile;
  job: JobDetails;
  report: GeneratedReport;
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  "hvac-maintenance": "Preventative Maintenance",
  "hvac-emergency": "Emergency Service",
  "hvac-repair": "Repair & Diagnostics",
  "hvac-install": "System Installation",
  "hvac-seasonal": "Pre-Season Service",
  "hvac-inspection": "System Inspection",
  "hvac-warranty": "Warranty Service",
  other: "Other / Custom",
};
