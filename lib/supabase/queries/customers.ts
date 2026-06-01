// ---------------------------------------------------------------------------
// Supabase customer queries
// ---------------------------------------------------------------------------

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CustomerRow, CustomerInsert } from "@/types/database";
import type { Customer } from "@/types/report";

// ── Converters ───────────────────────────────────────────────────────────────

export function customerToInsert(customer: Customer, userId: string): CustomerInsert {
  return {
    user_id: userId,
    local_id: customer.id,
    name: customer.name,
    address: customer.address ?? "",
    site_notes: customer.siteNotes ?? "",
    phone: customer.phone ?? null,
    email: customer.email ?? null,
    equipment: customer.equipment ?? null,
  };
}

export function rowToCustomer(row: CustomerRow): Customer {
  return {
    id: row.local_id ?? row.id,  // prefer local_id for app-side consistency
    name: row.name,
    address: row.address,
    siteNotes: row.site_notes,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    equipment: row.equipment ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getCustomersFromDb(userId: string): Promise<Customer[] | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const { data, error } = await client
    .from("customers")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[customers] getCustomersFromDb:", error.message);
    return null;
  }

  return data.map(rowToCustomer);
}

export async function saveCustomerToDb(
  customer: Customer,
  userId: string,
): Promise<CustomerRow | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const insert = customerToInsert(customer, userId);

  // Upsert on local_id so re-saving an edited customer updates rather than duplicates
  const { data, error } = await client
    .from("customers")
    .upsert(insert, { onConflict: "local_id" })
    .select()
    .single();

  if (error) {
    console.error("[customers] saveCustomerToDb:", error.message);
    return null;
  }

  return data;
}

export async function deleteCustomerFromDb(
  localId: string,
  userId: string,
): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client) return false;

  const { error } = await client
    .from("customers")
    .delete()
    .eq("local_id", localId)
    .eq("user_id", userId);

  if (error) {
    console.error("[customers] deleteCustomerFromDb:", error.message);
    return false;
  }

  return true;
}

/**
 * Bulk upsert — used for the one-time localStorage → Supabase migration.
 */
export async function migrateCustomersToDb(
  customers: Customer[],
  userId: string,
): Promise<void> {
  const client = getSupabaseBrowserClient();
  if (!client || customers.length === 0) return;

  const rows = customers.map((c) => customerToInsert(c, userId));

  const { error } = await client
    .from("customers")
    .upsert(rows, { onConflict: "local_id" });

  if (error) {
    console.error("[customers] migrateCustomersToDb:", error.message);
  }
}
