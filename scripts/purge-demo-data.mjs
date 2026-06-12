/**
 * One-time script: purge all demo user data from Supabase.
 * Run with: node scripts/purge-demo-data.mjs
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// Parse .env.local manually (no dotenv dependency needed)
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_EMAIL = "demo@jobwrap.app";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  // 1. Find the demo user's ID
  const { data: { users }, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) { console.error("Failed to list users:", userErr.message); process.exit(1); }

  const demoUser = users.find((u) => u.email === DEMO_EMAIL);
  if (!demoUser) {
    console.log("No demo user found in Supabase — nothing to purge.");
    process.exit(0);
  }

  const uid = demoUser.id;
  console.log(`Found demo user: ${uid}`);

  // 2. Delete reports
  const { error: reportsErr, count: reportsCount } = await supabase
    .from("reports")
    .delete({ count: "exact" })
    .eq("user_id", uid);
  if (reportsErr) console.error("Reports delete error:", reportsErr.message);
  else console.log(`Deleted ${reportsCount ?? "?"} reports`);

  // 3. Delete customers
  const { error: customersErr, count: customersCount } = await supabase
    .from("customers")
    .delete({ count: "exact" })
    .eq("user_id", uid);
  if (customersErr) console.error("Customers delete error:", customersErr.message);
  else console.log(`Deleted ${customersCount ?? "?"} customers`);

  // 4. Delete business settings
  const { error: bizErr } = await supabase
    .from("business_settings")
    .delete()
    .eq("user_id", uid);
  if (bizErr) console.error("Business settings delete error:", bizErr.message);
  else console.log("Deleted business settings");

  // 5. Delete shared reports
  const { error: sharedErr, count: sharedCount } = await supabase
    .from("shared_reports")
    .delete({ count: "exact" })
    .eq("user_id", uid);
  if (sharedErr) console.error("Shared reports delete error:", sharedErr.message);
  else console.log(`Deleted ${sharedCount ?? "?"} shared reports`);

  // 6. Delete storage photos (if any)
  const { data: files } = await supabase.storage.from("report-photos").list(uid);
  if (files && files.length > 0) {
    const paths = files.map((f) => `${uid}/${f.name}`);
    const { error: storageErr } = await supabase.storage.from("report-photos").remove(paths);
    if (storageErr) console.error("Storage delete error:", storageErr.message);
    else console.log(`Deleted ${paths.length} photos from storage`);
  } else {
    console.log("No photos to delete");
  }

  console.log("\nDone. Demo user auth account preserved (needed for login).");
  console.log("Demo data will now only ever live in the browser's localStorage.");
}

run();
