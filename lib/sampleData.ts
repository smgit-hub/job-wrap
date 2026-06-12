// sampleData.ts
// Five realistic HVAC service reports seeded on first launch.
// All dates are computed relative to today so nothing ever shows as overdue.

import type { ServiceReport, Customer } from "@/types/report";
import { EMPTY_REPORT } from "@/types/report";

// ── Date helpers ──────────────────────────────────────────────────────────────

/** ISO datetime string N days ago (with optional hour offset for realism) */
function isoAgo(daysAgo: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/** YYYY-MM-DD string N days ago */
function dateAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/** YYYY-MM-DD string N months from today */
function dateInMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** "Month YYYY" label N months from today — used in report text */
function labelInMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** "Month YYYY" label N days ago — used in report text */
function labelAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ── Business profile ──────────────────────────────────────────────────────────

export const SAMPLE_BUSINESS = {
  businessName: "Arctic Air HVAC",
  technicianName: "Jake Simmons",
  phone: "+1 (555) 012 0100",
  email: "service@arcticairhvac.com",
  licence1Label: "HVAC Licence",
  licence1Number: "L148632",
  licence2Label: "",
  licence2Number: "",
  brandColor: "#0f172a",
  tagline: "Comfort you can count on",
  website: "arcticairhvac.com",
};

// ── Reports ───────────────────────────────────────────────────────────────────

export const SAMPLE_REPORTS: ServiceReport[] = [

  // ── 1. Annual maintenance — COMPLETE ─────────────────────────────────────
  {
    id: "sample_001",
    status: "complete",
    createdAt: isoAgo(23, 9),
    updatedAt: isoAgo(23, 10),
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Rachel Kim",
      serviceAddress: "14 Ferndale Ave, Westfield",
      serviceType: "hvac-maintenance",
      jobDate: dateAgo(23),
      equipment: "Daikin FTXM50W/RXM50W heat pump split system, 6kW, installed 2021",
      nextServiceDate: dateInMonths(11),
      voiceNotes: {
        jobNotes: "Annual maintenance on Rachel Kim's Daikin 6kW split system in Westfield. Cleaned the filters, they were about a year's worth of dust — gave them a good wash. Cleaned the evaporator coil, not too bad. Went outside and cleaned the condenser coil, had some grass clippings and debris packed into the fins. Checked the refrigerant pressures, all within spec. Tested heating and cooling, both operating correctly, temperatures good. Checked the capacitors, all fine. Cleared the condensate drain, flowing freely. Overall the system is in good shape.",
      },
    },
    report: {
      customerSummary: "Annual maintenance completed on your Daikin heat pump split system. The system is in excellent condition and operating efficiently. All components were inspected and cleaned, and no faults were found.",
      findings: "• Filters heavily loaded with approximately 12 months of dust accumulation\n• Evaporator coil in good condition with minor surface dust\n• Condenser coil had grass clippings and debris packed into fins\n• Refrigerant pressures within manufacturer specifications\n• Capacitors testing within tolerance\n• Condensate drain clear and flowing freely",
      workPerformed: "• Removed, washed and reinstalled both indoor filters\n• Cleaned evaporator coil\n• Cleaned condenser coil and cleared fin debris\n• Checked and recorded refrigerant pressures\n• Tested heating and cooling operation — both confirmed working correctly\n• Checked run capacitors\n• Cleared and flushed condensate drain",
      recommendations: `• Continue annual servicing to maintain efficiency and system life\n• Next service due ${labelInMonths(11)} — we will be in touch closer to the time`,
    },
    verified: {
      customerSummary: true,
      findings: true,
      workPerformed: true,
      recommendations: true,
    },
  },

  // ── 2. Emergency repair — COMPLETE ───────────────────────────────────────
  {
    id: "sample_004",
    status: "complete",
    createdAt: isoAgo(33, 10),
    updatedAt: isoAgo(33, 12),
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Tom Nguyen",
      serviceAddress: "88 Commerce St, Downtown",
      serviceType: "hvac-emergency",
      jobDate: dateAgo(33),
      equipment: "Carrier 10-ton rooftop package unit, serving ground floor retail, installed 2019",
      nextServiceDate: dateInMonths(1),
      voiceNotes: {
        jobNotes: "Emergency call for Tom Nguyen at Commerce Street — Carrier 10 ton rooftop unit not cooling at all. On arrival the unit was running but warm air only inside. Went up to the roof. Compressor running but both refrigerant pressures were very low, basically nothing on the high side. Found the leak — Schrader valve on the high side service port, the valve core was cracked and leaking. Replaced the Schrader valve core. Pressure tested the whole circuit to 400 psi, held for 30 minutes, no drop. Vacuumed the system down. Recharged with R410A, brought the system back to full operating pressures. System is fully back online.",
      },
    },
    report: {
      customerSummary: "Emergency repair completed on your Carrier rooftop package unit. A refrigerant leak was identified and repaired, the system was recharged, and full cooling operation has been restored.",
      findings: "• System running but producing warm air only — no cooling\n• Refrigerant pressures critically low on both high and low side\n• Cracked Schrader valve core identified on high side service port — confirmed source of refrigerant loss\n• Service ports on roof appear exposed and show signs of possible tampering",
      workPerformed: "• Identified refrigerant leak at high side Schrader valve core\n• Replaced Schrader valve core\n• Pressure tested entire refrigerant circuit to 400 psi — held for 30 minutes with no drop\n• Vacuumed system down\n• Recharged with R410A to manufacturer specifications\n• Confirmed system cooling correctly — supply air temperature 12°C, good airflow at all diffusers",
      recommendations: `• Install a locked protective cage or cover over rooftop service ports to prevent unauthorised access\n• Notify building security of possible tampering\n• Follow-up inspection scheduled for ${labelInMonths(1)} to confirm refrigerant levels are stable`,
    },
    verified: {
      customerSummary: true,
      findings: true,
      workPerformed: true,
      recommendations: true,
    },
  },

  // ── 3. New installation — COMPLETE ───────────────────────────────────────
  {
    id: "sample_005",
    status: "complete",
    createdAt: isoAgo(38, 7),
    updatedAt: isoAgo(38, 13),
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Linda Chen",
      serviceAddress: "45 Maple Dr, Riverside",
      serviceType: "hvac-install",
      jobDate: dateAgo(38),
      equipment: "Daikin FTXM71W/RXM71W heat pump split system, 7.1kW",
      nextServiceDate: dateInMonths(10),
      voiceNotes: {
        jobNotes: "Just finished installing a new Daikin 7.1 kilowatt heat pump split system at Linda Chen's place in Riverside. Mounted the indoor unit on the feature wall in the main living area. Ran the lineset through the wall cavity down to the outdoor unit sitting on a concrete pad on the north side of the house. Pressure tested to 600 psi — held for 30 minutes, no drop. Vacuumed the system down, held vacuum. Commissioned and powered up. System cooling normally. Showed Linda how to use the remote and walked her through the timer and sleep mode functions.",
      },
    },
    report: {
      customerSummary: "Installation of your new Daikin 7.1kW heat pump split system has been completed successfully. The system has been commissioned, tested, and is operating correctly. You can begin using it immediately.",
      findings: "",
      workPerformed: "• Mounted indoor unit on feature wall in main living area\n• Ran lineset through wall cavity to outdoor unit\n• Installed outdoor unit on concrete pad on north side of property\n• Pressure tested refrigerant circuit to 600 psi — held for 30 minutes with no drop\n• Vacuumed system down to target vacuum\n• Connected outdoor unit to consumer mains via dedicated 20 amp isolator\n• Wired indoor unit to outdoor unit\n• Commissioned and powered up system\n• Confirmed cooling operation — supply air at 14°C with good airflow\n• Demonstrated operation of remote control, timer, and sleep mode functions to customer",
      recommendations: `• Register warranty with Daikin within 30 days of installation\n• First filter clean due in approximately 3 months\n• Annual servicing recommended from ${labelInMonths(10)} to maintain warranty and efficiency`,
    },
    verified: {
      customerSummary: true,
      findings: true,
      workPerformed: true,
      recommendations: true,
    },
  },

  // ── 4. Pre-season service — DRAFT ────────────────────────────────────────
  {
    id: "sample_003",
    status: "draft",
    createdAt: isoAgo(15, 13),
    updatedAt: isoAgo(15, 13),
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Sarah O'Brien",
      serviceAddress: "31 Kingsway Blvd, Lakewood",
      serviceType: "hvac-seasonal",
      jobDate: dateAgo(15),
      equipment: "Mitsubishi MXZ-3E54VA multi-split with 3x indoor heads — living room, master bedroom, home office — installed 2018",
      nextServiceDate: dateInMonths(4),
      voiceNotes: {
        jobNotes: "Pre-season service on Sarah O'Brien's Mitsubishi multi-split in Lakewood, three indoor heads. Cleaned all three filters, they were all pretty dirty. Cleaned the evaporator coils on all three units. Checked refrigerant pressures — living room and home office fine, master bedroom circuit was low. Confirmed refrigerant undercharge on the master bedroom, recharged with about 150 grams of R32. Cleared condensate tray blockage on the living room unit. Tested all three zones in heating and cooling, all operating correctly now. Recommend leak detection within the next six months before summer cooling season.",
      },
    },
    report: { ...EMPTY_REPORT },
  },

  // ── 5. Gas furnace repair — DRAFT ────────────────────────────────────────
  {
    id: "sample_002",
    status: "draft",
    createdAt: isoAgo(29, 8),
    updatedAt: isoAgo(29, 8),
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Marcus Webb",
      serviceAddress: "7 Cloverdale St, Millbrook",
      serviceType: "hvac-repair",
      jobDate: dateAgo(29),
      equipment: "Carrier 18kW ducted gas furnace, installed 2012",
      voiceNotes: {
        jobNotes: "At Marcus Webb's in Millbrook, called out because the Carrier ducted gas furnace wasn't lighting. On arrival confirmed no ignition on a call for heat. Checked the ignition sequence — ignitor was sparking fine but the thermocouple wasn't holding the flame. Pulled the thermocouple out, it was definitely faulty. Also pulled the burner manifold while I was in there — the ports were partially blocked. Replaced the thermocouple with a compatible unit. Cleaned up the burner ports. Unit lighting and holding flame fine now. Furnace is 14 years old — recommend customer starts budgeting for a replacement in the next couple of years.",
      },
    },
    report: { ...EMPTY_REPORT },
  },

];

// ── Customers ─────────────────────────────────────────────────────────────────

export const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: "sample_cust_001",
    name: "Rachel Kim",
    address: "14 Ferndale Ave, Westfield",
    siteNotes: "",
    equipment: "Daikin FTXM50W/RXM50W heat pump split system, 6kW, installed 2021",
    createdAt: isoAgo(23, 9),
    updatedAt: isoAgo(23, 10),
  },
  {
    id: "sample_cust_002",
    name: "Marcus Webb",
    address: "7 Cloverdale St, Millbrook",
    siteNotes: "",
    equipment: "Carrier 18kW ducted gas furnace, installed 2012",
    createdAt: isoAgo(29, 8),
    updatedAt: isoAgo(29, 11),
  },
  {
    id: "sample_cust_003",
    name: "Sarah O'Brien",
    address: "31 Kingsway Blvd, Lakewood",
    siteNotes: "",
    equipment: "Mitsubishi MXZ-3E54VA multi-split with 3x indoor heads — living room, master bedroom, home office — installed 2018",
    createdAt: isoAgo(15, 13),
    updatedAt: isoAgo(15, 14),
  },
  {
    id: "sample_cust_004",
    name: "Tom Nguyen",
    address: "88 Commerce St, Downtown",
    siteNotes: "Rooftop access via internal roof hatch — key held at reception",
    equipment: "Carrier 10-ton rooftop package unit, serving ground floor retail, installed 2019",
    createdAt: isoAgo(33, 10),
    updatedAt: isoAgo(33, 12),
  },
  {
    id: "sample_cust_005",
    name: "Linda Chen",
    address: "45 Maple Dr, Riverside",
    siteNotes: "",
    equipment: "Daikin FTXM71W/RXM71W heat pump split system, 7.1kW",
    createdAt: isoAgo(38, 7),
    updatedAt: isoAgo(38, 13),
  },
];
