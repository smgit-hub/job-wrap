// seed-demo.mjs
// One-time script to seed the demo@jobwrap.app Supabase account
// with realistic HVAC service reports and customers.
//
// Usage:
//   node scripts/seed-demo.mjs
//
// Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
// to be set in .env.local (loaded automatically via dotenv).

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => l.split("=").map((p) => p.trim()))
    .filter(([k]) => k)
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DEMO_EMAIL = "demo@jobwrap.app";
const DEMO_PASSWORD = "demo1234";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Business profile ──────────────────────────────────────────────────────────

const BUSINESS = {
  businessName: "Arctic Air HVAC",
  technicianName: "Jake Simmons",
  phone: "(03) 9555 0100",
  email: "service@arcticairhvac.com.au",
  licence1Label: "ARCtick",
  licence1Number: "L148632",
  licence2Label: "",
  licence2Number: "",
  brandColor: "#0f172a",
  tagline: "Comfort you can count on",
  website: "arcticairhvac.com.au",
};

// ── Customers ─────────────────────────────────────────────────────────────────

const CUSTOMERS = [
  {
    local_id: "sample_cust_001",
    name: "Rachel Kim",
    address: "14 Ferndale Ave, Mount Waverley",
    site_notes: "",
    equipment: "Daikin FTXM50W/RXM50W reverse-cycle split, 6kW, installed 2021",
  },
  {
    local_id: "sample_cust_002",
    name: "Marcus Webb",
    address: "7 Cloverdale St, Ringwood",
    site_notes: "",
    equipment: "Brivis Buffalo 18kW ducted gas heater, installed 2012",
  },
  {
    local_id: "sample_cust_003",
    name: "Sarah O'Brien",
    address: "31 Kingsway Blvd, Glen Waverley",
    site_notes: "",
    equipment: "Mitsubishi MXZ-3E54VA multi-split, 3x heads, installed 2018",
  },
  {
    local_id: "sample_cust_004",
    name: "Tom Nguyen",
    address: "88 Collins St, Melbourne CBD",
    site_notes: "Rooftop access via internal roof hatch — key held at reception",
    equipment: "Carrier 10-ton rooftop package unit, installed 2019",
  },
  {
    local_id: "sample_cust_005",
    name: "Linda Chen",
    address: "45 Maple Dr, Doncaster",
    site_notes: "",
    equipment: "Daikin FTXM71W/RXM71W reverse-cycle split, 7.1kW",
  },
  {
    local_id: "sample_cust_006",
    name: "David Park",
    address: "22 Birchwood Cl, Templestowe",
    site_notes: "",
    equipment: "LG Multi V S 8HP VRF system, office fit-out 2023",
  },
  {
    local_id: "sample_cust_007",
    name: "Fiona Walsh",
    address: "9 Sundew Ct, Croydon",
    site_notes: "",
    equipment: "Panasonic CS-Z50VKR 5kW reverse-cycle split, installed 2020",
  },
];

// ── Reports ───────────────────────────────────────────────────────────────────

const REPORTS = [
  {
    local_id: "sample_001",
    status: "complete",
    customer_name: "Rachel Kim",
    service_address: "14 Ferndale Ave, Mount Waverley",
    service_type: "hvac-maintenance",
    equipment_type: "Daikin FTXM50W/RXM50W reverse-cycle split, 6kW, installed 2021",
    job_date: "2026-05-20",
    next_service_date: "2027-05-20",
    rough_notes: "Annual maintenance on Rachel Kim's Daikin 6kW split in Mount Waverley.",
    deleted_at: null,
    report_data: {
      job: {
        customerName: "Rachel Kim",
        serviceAddress: "14 Ferndale Ave, Mount Waverley",
        serviceType: "hvac-maintenance",
        jobDate: "2026-05-20",
        nextServiceDate: "2027-05-20",
        equipment: "Daikin FTXM50W/RXM50W reverse-cycle split, 6kW, installed 2021",
        voiceNotes: { jobNotes: "Annual maintenance on Rachel Kim's Daikin 6kW split in Mount Waverley. Filters were heavily loaded — about 12 months of dust. Washed and dried the filters, cleaned the evaporator coil, light dust only no biological growth. Cleaned the condenser coil, cleared some grass clippings and garden debris from the fins. Checked refrigerant pressures on suction and discharge — all within spec. Tested run capacitors, all good. Flushed the condensate drain. Tested heating and cooling, correct temps confirmed. Next annual service due May 2027." },
      },
      business: BUSINESS,
      report: {
        customerSummary:
          "We completed your annual maintenance service on your Daikin 6kW reverse-cycle split system. The system is in excellent condition — filters, coils, and drain were all serviced, and refrigerant pressures are within spec. Everything is running as it should. Your next service is due May 2027.",
        findings:
          "• Filters heavily loaded with approximately 12 months of dust accumulation\n• Condenser coil fins partially blocked with grass clippings and garden debris\n• All refrigerant pressures within manufacturer specification\n• Capacitors tested within tolerance\n• Condensate drain flowing freely",
        workPerformed:
          "• Removed, washed and dried both return air filters\n• Cleaned evaporator coil — light dust, no biological growth\n• Cleaned condenser coil and cleared debris from fins\n• Checked and recorded refrigerant pressures (suction and discharge)\n• Tested heating and cooling operation — correct temperatures confirmed\n• Checked run capacitors\n• Cleared and flushed condensate drain line\n• Tested remote control functions",
        recommendations:
          "• Next annual service due May 2027\n• Consider a split system clean/sanitise treatment next service if used in a dusty or high-traffic environment",
      },
      storedPhotos: [],
    },
  },
  {
    local_id: "sample_002",
    status: "complete",
    customer_name: "Marcus Webb",
    service_address: "7 Cloverdale St, Ringwood",
    service_type: "hvac-repair",
    equipment_type: "Brivis Buffalo 18kW ducted gas heater, installed 2012",
    job_date: "2026-05-14",
    next_service_date: null,
    rough_notes: "Brivis ducted gas heater not lighting — thermocouple failure and blocked burner.",
    deleted_at: null,
    report_data: {
      job: {
        customerName: "Marcus Webb",
        serviceAddress: "7 Cloverdale St, Ringwood",
        serviceType: "hvac-repair",
        jobDate: "2026-05-14",
        equipment: "Brivis Buffalo 18kW ducted gas heater, installed 2012",
        voiceNotes: { jobNotes: "Marcus Webb — Brivis Buffalo 18kW ducted gas heater not lighting. System going into lockout on every call for heat. Ignitor sparking fine so isolated it to the thermocouple — failed to hold flame after ignition. Also found the burner manifold ports partially blocked with carbon and oxidation deposits. Replaced the thermocouple, removed and cleaned all burner ports, reinstalled everything. Unit lighting and holding flame correctly now. Ran a full heating cycle, heat confirmed at all registers. Worth noting the heater is 14 years old — parts are getting harder to source, recommend they start budgeting for a replacement in the next couple of years." },
      },
      business: BUSINESS,
      report: {
        customerSummary:
          "Your Brivis ducted gas heater was not igniting on arrival. We found and replaced a faulty thermocouple, and cleaned carbon buildup from the burner ports. The heater is fully operational again. Given the age of the unit (14 years), we recommend budgeting for a replacement in the next few years.",
        findings:
          "• No ignition on call for heat — system entering lockout sequence\n• Ignitor sparking normally — fault isolated to thermocouple\n• Thermocouple failed to hold flame after ignition\n• Burner manifold ports partially blocked with carbon and oxidation deposits\n• Heater is 14 years old — replacement parts becoming limited",
        workPerformed:
          "• Diagnosed no-heat fault — confirmed thermocouple failure\n• Removed and replaced thermocouple with compatible unit\n• Removed burner manifold and cleaned all ports\n• Reinstalled manifold and thermocouple\n• Tested ignition sequence — unit lighting and holding flame correctly\n• Ran full heating cycle — confirmed heat at all registers",
        recommendations:
          "• Heater is 14 years old — begin budgeting for replacement within the next 2–3 years\n• Spare parts availability for Brivis Buffalo units is declining\n• Annual service recommended to maximise remaining lifespan\n• Consider upgrading to a ducted reverse-cycle system for improved efficiency",
      },
      storedPhotos: [],
    },
  },
  {
    local_id: "sample_003",
    status: "complete",
    customer_name: "Sarah O'Brien",
    service_address: "31 Kingsway Blvd, Glen Waverley",
    service_type: "hvac-seasonal",
    equipment_type: "Mitsubishi MXZ-3E54VA multi-split, 3x indoor heads, installed 2018",
    job_date: "2026-05-28",
    next_service_date: "2026-10-01",
    rough_notes: "Pre-season service on Mitsubishi multi-split — low refrigerant on master bedroom circuit.",
    deleted_at: null,
    report_data: {
      job: {
        customerName: "Sarah O'Brien",
        serviceAddress: "31 Kingsway Blvd, Glen Waverley",
        serviceType: "hvac-seasonal",
        jobDate: "2026-05-28",
        nextServiceDate: "2026-10-01",
        equipment: "Mitsubishi MXZ-3E54VA multi-split, 3x indoor heads — living room, master bedroom, home office — installed 2018",
        voiceNotes: { jobNotes: "Pre-season service on Sarah O'Brien's Mitsubishi multi-split — three zones, living room, master bedroom, home office. All three filters heavily loaded, about 12 months of use, washed and dried all of them. Cleaned the evaporator coils on all three heads, light dust only. Checked refrigerant pressures on all three circuits — living room and home office fine, but master bedroom circuit was undercharged, suction pressure below spec. Recharged master bedroom with approximately 150g R32. Found a partial blockage in the living room condensate tray, cleared that out. Tested all three zones heating and cooling, all operating correctly. Recommend leak detection within 6 months to find the source of that R32 loss. Next service due October 2026 before summer." },
      },
      business: BUSINESS,
      report: {
        customerSummary:
          "We completed your pre-season service on all three zones of your Mitsubishi multi-split system. All units are operating correctly. The master bedroom circuit was low on refrigerant and has been recharged. We also cleared a partial blockage in the living room condensate tray. A follow-up leak detection is recommended before summer to find the source of the refrigerant loss.",
        findings:
          "• All three filters heavily loaded — approximately 12 months of use\n• Master bedroom refrigerant circuit undercharged — suction pressure below specification\n• Living room condensate tray partially blocked with debris\n• Living room and home office circuits at correct refrigerant pressures\n• All three evaporator coils clean overall — light dust only",
        workPerformed:
          "• Removed, washed and dried all three sets of return air filters\n• Cleaned evaporator coils on all three indoor heads\n• Checked refrigerant pressures on all three circuits\n• Recharged master bedroom circuit with approximately 150g R32\n• Cleared debris blockage from living room condensate tray\n• Tested all three zones in heating and cooling — all operating correctly",
        recommendations:
          "• Leak detection recommended within 6 months to locate source of R32 loss on master bedroom circuit\n• Next annual service due October 2026 before summer cooling season\n• Monitor master bedroom cooling performance — if underperforming again, leak detection is urgent",
      },
      storedPhotos: [],
    },
  },
  {
    local_id: "sample_004",
    status: "complete",
    customer_name: "Tom Nguyen",
    service_address: "88 Collins St, Melbourne CBD",
    service_type: "hvac-emergency",
    equipment_type: "Carrier 10-ton rooftop package unit, serving ground floor retail, installed 2019",
    job_date: "2026-05-10",
    next_service_date: null,
    rough_notes: "Emergency call — Carrier rooftop unit not cooling. Found cracked Schrader valve core leaking refrigerant.",
    deleted_at: null,
    report_data: {
      job: {
        customerName: "Tom Nguyen",
        serviceAddress: "88 Collins St, Melbourne CBD",
        serviceType: "hvac-emergency",
        jobDate: "2026-05-10",
        equipment: "Carrier 10-ton rooftop package unit, serving ground floor retail, installed 2019",
        voiceNotes: { jobNotes: "Emergency call for Tom Nguyen at 88 Collins St — Carrier 10-ton rooftop unit running but no cooling. Gauged up and both pressures were critically low, confirmed refrigerant loss. Found a cracked Schrader valve core on the high-side service port — that was the leak. Also noticed the valve cover was missing and there are signs of possible tampering. Replaced the Schrader valve core with a compatible unit. Pressure tested to 400 psi, held 30 minutes no drop. Deep vacuum, held vacuum confirmed. Recharged with R410A to correct operating pressures. Supply air coming out at 12 degrees, airflow confirmed at all diffusers. Unit fully operational on departure. Recommend they get a locked cage or security cover over the rooftop service ports and notify building security." },
      },
      business: BUSINESS,
      report: {
        customerSummary:
          "Your Carrier rooftop unit was not cooling on our arrival. We found a cracked Schrader valve core on the high-side service port causing a full refrigerant loss. The valve was replaced, the system pressure tested, vacuumed and fully recharged. Cooling is restored and supply temperatures are confirmed normal. We recommend securing the rooftop service ports as there are signs of possible tampering.",
        findings:
          "• Unit running but no cooling — both refrigerant pressures critically low\n• Cracked Schrader valve core on high-side service port — confirmed leak source\n• Signs of possible interference with service port — valve cover missing\n• All other system components operating normally once recharged",
        workPerformed:
          "• Diagnosed no-cooling fault — confirmed refrigerant loss via gauge readings\n• Located leak at high-side Schrader valve core — confirmed with electronic leak detector\n• Replaced Schrader valve core with OEM-compatible unit\n• Pressure tested refrigerant circuit to 400 psi — held 30 minutes, no drop\n• Deep vacuum on system — held vacuum confirmed\n• Recharged with R410A to correct operating pressures\n• Tested cooling — supply air temperature 12°C, confirmed adequate airflow at all diffusers\n• System fully operational on departure",
        recommendations:
          "• Install a locked cage or security cover over rooftop service ports to prevent tampering\n• Notify building security of possible interference with HVAC equipment\n• Schedule next routine service — system is due for annual inspection\n• Consider CCTV coverage of rooftop plant area",
      },
      storedPhotos: [],
    },
  },
  {
    local_id: "sample_005",
    status: "complete",
    customer_name: "Linda Chen",
    service_address: "45 Maple Dr, Doncaster",
    service_type: "hvac-install",
    equipment_type: "Daikin FTXM71W/RXM71W reverse-cycle split, 7.1kW",
    job_date: "2026-05-05",
    next_service_date: "2027-05-05",
    rough_notes: "New Daikin 7.1kW split installation at Linda Chen's property in Doncaster.",
    deleted_at: null,
    report_data: {
      job: {
        customerName: "Linda Chen",
        serviceAddress: "45 Maple Dr, Doncaster",
        serviceType: "hvac-install",
        jobDate: "2026-05-05",
        nextServiceDate: "2027-05-05",
        equipment: "Daikin FTXM71W/RXM71W reverse-cycle split, 7.1kW",
        voiceNotes: { jobNotes: "New installation for Linda Chen in Doncaster — Daikin 7.1kW reverse-cycle split, indoor unit on the feature wall in the main living area, outdoor unit on a new concrete pad on the north side. Ran and insulated the lineset through the wall cavity, sealed the penetration. Wired the outdoor unit to a dedicated 20A isolator, ran the interconnecting cable. Pressure tested to 600 psi for 30 minutes — passed. Deep vacuum — passed. Commissioned the system, cooling confirmed at 14 degrees supply air. Walked Linda through the remote, timer and sleep mode. She's happy with it. Remind her to register the warranty with Daikin within 30 days and first filter clean is due in about 3 months. Annual service from May 2027." },
      },
      business: BUSINESS,
      report: {
        customerSummary:
          "Your new Daikin 7.1kW reverse-cycle split system has been installed and commissioned in your main living area. The system is fully operational and both heating and cooling have been tested and confirmed. Your warranty should be registered with Daikin within 30 days — your first filter clean is due in 3 months, and we recommend an annual service from next year.",
        findings:
          "• No prior system — new installation to main living area\n• Lineset routed through wall cavity — clean penetration, sealed\n• Concrete pad installed on north side for outdoor unit\n• Dedicated 20A isolator installed at outdoor unit\n• Pressure test held at 600 psi for 30 minutes — no drop\n• Vacuum held — system clean and dry prior to refrigerant charge",
        workPerformed:
          "• Mounted indoor unit on feature wall in main living area\n• Installed outdoor unit on new concrete pad, north elevation\n• Ran and insulated refrigerant lineset through wall cavity\n• Pressure tested to 600 psi — passed\n• Deep vacuum on refrigerant circuit — passed\n• Wired outdoor unit to dedicated 20A isolator at consumer mains\n• Wired indoor-to-outdoor interconnecting cable\n• Commissioned system — cooling confirmed, supply air 14°C\n• Demonstrated remote control operation to owner\n• Walked owner through timer and sleep mode functions",
        recommendations:
          "• Register warranty with Daikin within 30 days of installation\n• First filter clean due in approximately 3 months\n• Annual service recommended from May 2027\n• Keep outdoor unit area clear of vegetation and debris",
      },
      storedPhotos: [],
    },
  },
  // ── Draft reports (voice notes only — for demo of the generate flow) ─────────
  {
    local_id: "sample_006",
    status: "draft",
    customer_name: "David Park",
    service_address: "22 Birchwood Cl, Templestowe",
    service_type: "hvac-repair",
    equipment_type: "LG Multi V S 8HP VRF system, office fit-out 2023",
    job_date: "2026-05-30",
    next_service_date: null,
    rough_notes:
      "LG VRF unit fault code CH38 showing on two indoor heads in the open-plan area. Found low refrigerant charge on the A-circuit — slow leak at a flare fitting behind the ceiling. Re-flared the joint, pressure tested, held vacuum, topped up with R410A. Both heads back online and running at correct temps. Checked B-circuit pressures while on site — all good.",
    deleted_at: null,
    report_data: {
      job: {
        customerName: "David Park",
        serviceAddress: "22 Birchwood Cl, Templestowe",
        serviceType: "hvac-repair",
        jobDate: "2026-05-30",
        nextServiceDate: null,
        equipment: "LG Multi V S 8HP VRF system, office fit-out 2023",
        voiceNotes: {
          jobNotes:
            "LG VRF unit fault code CH38 showing on two indoor heads in the open-plan area. Found low refrigerant charge on the A-circuit — slow leak at a flare fitting behind the ceiling. Re-flared the joint, pressure tested, held vacuum, topped up with R410A. Both heads back online and running at correct temps. Checked B-circuit pressures while on site — all good. Recommend a follow-up check in 3 months to confirm no further refrigerant loss from the A-circuit.",
        },
      },
      business: BUSINESS,
      report: {
        customerSummary: "",
        findings: "",
        workPerformed: "",
        recommendations: "",
      },
      storedPhotos: [],
    },
  },
  {
    local_id: "sample_007",
    status: "draft",
    customer_name: "Fiona Walsh",
    service_address: "9 Sundew Ct, Croydon",
    service_type: "hvac-maintenance",
    equipment_type: "Panasonic CS-Z50VKR 5kW reverse-cycle split, installed 2020",
    job_date: "2026-05-28",
    next_service_date: null,
    rough_notes:
      "Annual service on Fiona's Panasonic 5kW split. Filters were really dirty — hadn't been cleaned since install. Washed filters, cleaned evaporator coil, had some light mould on the coil so hit it with coil cleaner. Condensate drain was starting to block up, flushed it out. Refrigerant pressures looked good. Unit running well after service.",
    deleted_at: null,
    report_data: {
      job: {
        customerName: "Fiona Walsh",
        serviceAddress: "9 Sundew Ct, Croydon",
        serviceType: "hvac-maintenance",
        jobDate: "2026-05-28",
        nextServiceDate: null,
        equipment: "Panasonic CS-Z50VKR 5kW reverse-cycle split, installed 2020",
        voiceNotes: {
          jobNotes:
            "Annual service on Fiona's Panasonic 5kW split. Filters were really dirty — hadn't been cleaned since install. Washed filters, cleaned evaporator coil, had some light mould on the coil so hit it with coil cleaner. Condensate drain was starting to block up, flushed it out. Refrigerant pressures looked good. Unit running well after service. Recommend customer cleans filters every 6 weeks going forward. Book next annual service May 2027.",
        },
      },
      business: BUSINESS,
      report: {
        customerSummary: "",
        findings: "",
        workPerformed: "",
        recommendations: "",
      },
      storedPhotos: [],
    },
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Signing in as demo account…");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  if (authError || !authData.user) {
    console.error("Sign-in failed:", authError?.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`Signed in as ${DEMO_EMAIL} (${userId})`);

  // ── Business settings ──────────────────────────────────────────────────────
  console.log("Seeding business settings…");
  // Delete existing row first so we can re-insert cleanly
  await supabase.from("business_settings").delete().eq("user_id", userId);
  const { error: bizError } = await supabase.from("business_settings").insert({
    user_id: userId,
    business_name: BUSINESS.businessName,
    technician_name: BUSINESS.technicianName,
    phone: BUSINESS.phone,
    email: BUSINESS.email,
    license_number: "",
    licence1_label: BUSINESS.licence1Label,
    licence1_number: BUSINESS.licence1Number,
    licence2_label: "",
    licence2_number: "",
    brand_color: BUSINESS.brandColor,
    logo_url: null,
    tagline: BUSINESS.tagline,
    website: BUSINESS.website,
  });
  if (bizError) console.error("Business settings error:", bizError.message);
  else console.log("  ✓ Business settings");

  // ── Customers ──────────────────────────────────────────────────────────────
  console.log("Seeding customers…");
  // Delete existing demo customers then re-insert
  for (const customer of CUSTOMERS) {
    await supabase.from("customers").delete().eq("local_id", customer.local_id);
    const { error } = await supabase.from("customers").insert({ ...customer, user_id: userId });
    if (error) console.error(`  ✗ ${customer.name}:`, error.message);
    else console.log(`  ✓ ${customer.name}`);
  }

  // ── Reports ────────────────────────────────────────────────────────────────
  console.log("Seeding reports…");
  // Delete existing demo reports then re-insert
  for (const report of REPORTS) {
    await supabase.from("reports").delete().eq("local_id", report.local_id);
    const { error } = await supabase.from("reports").insert({ ...report, user_id: userId });
    if (error) console.error(`  ✗ ${report.customer_name}:`, error.message);
    else console.log(`  ✓ ${report.customer_name} — ${report.service_type}`);
  }

  console.log("\nDemo account seeded successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
