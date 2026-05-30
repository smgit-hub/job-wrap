export type ServiceType =
  | "hvac-maintenance"
  | "hvac-emergency"
  | "hvac-repair"
  | "hvac-install"
  | "hvac-seasonal"
  | "hvac-inspection"
  | "hvac-duct-cleaning"
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
  equipment?: string; // last-known equipment — pre-fills the per-job equipment field
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
  licence1Label: string;   // e.g. "ARCtick", "Gas Safe", "EPA 608"
  licence1Number: string;  // e.g. "AU12345"
  licence2Label: string;
  licence2Number: string;
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
  /** Free-text equipment description — brand, model, capacity, install year, etc. e.g. "Daikin FTXM50W 6kW, installed 2018" */
  equipment?: string;
  /** Next recommended service date — shown in the PDF info grid if set */
  nextServiceDate?: string;
  voiceNotes: VoiceNotes;
}

export interface GeneratedReport {
  customerSummary: string;
  findings: string;      // extracted from jobNotes — empty string if nothing found
  workPerformed: string; // extracted from jobNotes
  recommendations: string;
}

/** Per-section sign-off — true once the tech has read/edited the section */
export interface SectionVerified {
  customerSummary?: boolean;
  findings?: boolean;
  workPerformed?: boolean;
  recommendations?: boolean;
}

export interface ServiceReport {
  id: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;   // set on soft-delete; unset on restore; purged after 7 days
  business: BusinessProfile;
  job: JobDetails;
  report: GeneratedReport;
  verified?: SectionVerified;
}

export const EMPTY_REPORT: GeneratedReport = {
  customerSummary: "",
  findings: "",
  workPerformed: "",
  recommendations: "",
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  "hvac-maintenance": "Preventative Maintenance",
  "hvac-emergency": "Emergency Service",
  "hvac-repair": "Repair & Diagnostics",
  "hvac-install": "System Installation",
  "hvac-seasonal": "Pre-Season Service",
  "hvac-inspection": "System Inspection",
  "hvac-duct-cleaning": "Duct Cleaning",
  other: "Other",
};
