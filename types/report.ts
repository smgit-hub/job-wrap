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
  siteNotes: string;  // gate codes, access instructions, dogs, etc.
  phone?: string;     // added manually via customer screen, not captured from job notes
  email?: string;     // added manually via customer screen, not captured from job notes
  createdAt: string;
  updatedAt: string;
}

// ── Structured voice capture ─────────────────────────────────────────────────
// Two focused recordings — job notes (what happened) + recommendations (what's next).
// jobNotes feeds both Findings and Work Performed via AI extraction.
// recommendations is optional — code returns fallback if empty, AI never decides.
export interface VoiceNotes {
  jobNotes: string;         // "What happened today?" — findings + work in one narrative
  recommendations: string;  // "Anything they need next?" — optional, separate recording
}

export const EMPTY_VOICE_NOTES: VoiceNotes = {
  jobNotes: "",
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
  /** Equipment / system serviced on this visit — captured per job, not per customer */
  equipmentDetails?: string;
  voiceNotes: VoiceNotes;
}

export interface GeneratedReport {
  customerSummary: string;
  findings: string;      // extracted from jobNotes — empty string if nothing found
  workPerformed: string; // extracted from jobNotes
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
