// ---------------------------------------------------------------------------
// Supabase database schema — TypeScript types
//
// These types mirror the SQL tables in supabase/migrations/.
// They are safe to import anywhere in the codebase; they have no runtime
// dependencies and work with or without a live Supabase connection.
//
// TODO (live setup): run `npx supabase gen types typescript --linked` to
// regenerate these from the actual database schema after running migrations.
// Replace this file with the generated output.
// ---------------------------------------------------------------------------

// ── Table row types ──────────────────────────────────────────────────────────
// Using `type` (not `interface`) so these satisfy `Record<string, unknown>`
// in TypeScript conditional type checks — required for the Supabase SDK's
// GenericTable constraint to resolve correctly.

export type ProfileRow = {
  id: string;           // UUID, matches auth.users(id)
  email: string;
  created_at: string;   // ISO timestamp
};

export type BusinessSettingsRow = {
  id: string;           // UUID
  user_id: string;      // FK → profiles(id)
  business_name: string;
  technician_name: string;
  phone: string;
  email: string;
  license_number: string;
  brand_color: string;  // hex, e.g. "#0ea5e9"
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

// report_data contains the full GeneratedReport JSON plus JobDetails.
// Keeping it as JSONB gives flexibility for future schema evolution across
// service verticals without requiring a migration for every new field.
export type ReportRow = {
  id: string;           // UUID
  user_id: string;      // FK → profiles(id)
  status: "draft" | "complete";
  customer_name: string;
  service_address: string;
  service_type: string; // ServiceType — kept as string for future vertical expansion
  equipment_type: string;
  job_date: string;     // ISO date (YYYY-MM-DD)
  rough_notes: string;
  report_data: Record<string, unknown>; // GeneratedReport JSON
  created_at: string;
  updated_at: string;
};

// ── Insert / Update types (omit server-generated fields) ─────────────────────

export type ProfileInsert = Omit<ProfileRow, "created_at">;
export type ProfileUpdate = Partial<Omit<ProfileRow, "id" | "created_at">>;

export type BusinessSettingsInsert = Omit<
  BusinessSettingsRow,
  "id" | "created_at" | "updated_at"
>;
export type BusinessSettingsUpdate = Partial<
  Omit<BusinessSettingsRow, "id" | "user_id" | "created_at">
>;

export type ReportInsert = Omit<ReportRow, "id" | "created_at" | "updated_at">;
export type ReportUpdate = Partial<Omit<ReportRow, "id" | "user_id" | "created_at">>;

// Stored by the share-report API route. Token is the URL slug — no auth needed.
export type SharedReportRow = {
  id: string;
  token: string;
  report_data: Record<string, unknown>; // ServiceReport JSON
  photos: unknown[];                    // JobPhoto[]
  created_at: string;
};

export type SharedReportInsert = Omit<SharedReportRow, "id" | "created_at">;

// ── Full database schema type (for typed Supabase client) ─────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      business_settings: {
        Row: BusinessSettingsRow;
        Insert: BusinessSettingsInsert;
        Update: BusinessSettingsUpdate;
        Relationships: [];
      };
      reports: {
        Row: ReportRow;
        Insert: ReportInsert;
        Update: ReportUpdate;
        Relationships: [];
      };
      shared_reports: {
        Row: SharedReportRow;
        Insert: SharedReportInsert;
        Update: Partial<SharedReportInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, { Row: Record<string, unknown>; Relationships: [] }>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, unknown>;
  };
}
