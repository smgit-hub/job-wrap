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
  license_number: string;   // legacy single licence field — kept for backwards compat
  licence1_label: string;
  licence1_number: string;
  licence2_label: string;
  licence2_number: string;
  brand_color: string;      // hex, e.g. "#0ea5e9"
  logo_url: string | null;
  tagline: string;
  website: string;
  created_at: string;
  updated_at: string;
};

// report_data stores the full ServiceReport JSON as a self-contained snapshot.
// Indexed columns (customer_name, service_type, job_date, etc.) allow fast
// filtering/search without parsing JSONB on every query.
export type ReportRow = {
  id: string;                    // UUID (Supabase-generated)
  local_id: string | null;       // app-side rpt_xxx ID — set during migration
  user_id: string;               // FK → profiles(id)
  status: "draft" | "complete";
  customer_name: string;
  service_address: string;
  service_type: string;          // ServiceType — string for future verticals
  equipment_type: string;
  job_date: string;              // ISO date (YYYY-MM-DD)
  next_service_date: string | null;
  rough_notes: string;
  report_data: Record<string, unknown>; // full ServiceReport JSON
  deleted_at: string | null;     // set on soft-delete, null = active
  created_at: string;
  updated_at: string;
};

export type CustomerRow = {
  id: string;           // UUID
  local_id: string | null; // app-side cust_xxx ID — set during migration
  user_id: string;      // FK → profiles(id)
  name: string;
  address: string;
  site_notes: string;
  phone: string | null;
  email: string | null;
  equipment: string | null;
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

export type CustomerInsert = Omit<CustomerRow, "id" | "created_at" | "updated_at">;
export type CustomerUpdate = Partial<Omit<CustomerRow, "id" | "user_id" | "created_at">>;

// Stored by the share-report API route. Token is the URL slug — no auth needed.
export type SharedReportRow = {
  id: string;
  token: string;
  report_data: Record<string, unknown>; // ServiceReport JSON
  photos: unknown[];                    // JobPhoto[]
  user_id: string | null;              // who created the link
  expires_at: string | null;           // ISO timestamp — null = never expires
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
      customers: {
        Row: CustomerRow;
        Insert: CustomerInsert;
        Update: CustomerUpdate;
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
