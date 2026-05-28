// sampleData.ts
// Three realistic HVAC service reports used to seed the app on first launch.
// IDs are prefixed "sample_" so the Dashboard can recognise them.

import type { ServiceReport, Customer } from "@/types/report";

export const SAMPLE_BUSINESS = {
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

export const SAMPLE_REPORTS: ServiceReport[] = [
  // ── 1. Routine maintenance — no findings, all good ─────────────────────────
  {
    id: "sample_001",
    status: "complete",
    createdAt: "2026-05-15T09:00:00.000Z",
    updatedAt: "2026-05-15T10:12:00.000Z",
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Rachel Kim",
      serviceAddress: "14 Ferndale Ave, Mount Waverley",
      serviceType: "hvac-maintenance",
      jobDate: "2026-05-15",
      equipment: "Daikin FTXM50W/RXM50W split system, 6kW, installed 2021",
      nextServiceDate: "2027-05-15",
      voiceNotes: { jobNotes: "", recommendations: "" },
    },
    report: {
      customerSummary:
        "We completed your annual preventative maintenance on your Daikin 6kW split system today. The unit is operating well within normal parameters and no issues were found. We recommend scheduling your next service in twelve months to keep the system running at peak efficiency.",
      findings: "",
      workPerformed: [
        "• Cleaned and washed indoor unit filters",
        "• Cleaned indoor evaporator coil",
        "• Inspected and cleaned outdoor condenser coil",
        "• Checked refrigerant pressures — within manufacturer specification",
        "• Tested heating and cooling operation",
        "• Inspected electrical connections and capacitor",
        "• Cleared and tested condensate drain",
      ].join("\n"),
      recommendations:
        "• Schedule your next annual service in May 2027 to maintain warranty and system efficiency",
    },
  },

  // ── 2. Gas heater repair — failed thermocouple, blocked burner ─────────────
  {
    id: "sample_002",
    status: "complete",
    createdAt: "2026-04-22T08:30:00.000Z",
    updatedAt: "2026-04-22T11:45:00.000Z",
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Marcus Webb",
      serviceAddress: "7 Cloverdale St, Ringwood",
      serviceType: "hvac-repair",
      jobDate: "2026-04-22",
      equipment: "Brivis Buffalo 18kW ducted gas heater, installed 2012",
      voiceNotes: { jobNotes: "", recommendations: "" },
    },
    report: {
      customerSummary:
        "We attended your property today to diagnose your ducted gas heater that had stopped igniting. We found a failed thermocouple and partially blocked burner manifold ports, both of which were resolved during this visit. Your heating system is now fully operational.",
      findings: [
        "• Failed thermocouple — unit unable to hold pilot ignition",
        "• Partially blocked burner manifold ports — reduced combustion efficiency",
      ].join("\n"),
      workPerformed: [
        "• Confirmed no ignition on call for heat",
        "• Inspected gas valve, ignitor, and thermocouple",
        "• Replaced failed thermocouple",
        "• Removed and cleaned burner manifold",
        "• Tested ignition sequence — unit lighting and holding flame correctly",
        "• Verified heat output at multiple registers",
      ].join("\n"),
      recommendations:
        "• Your heater is 14 years old — consider budgeting for a replacement system within the next 2–3 years as parts availability may become limited",
    },
  },

  // ── 3. Pre-season inspection — refrigerant low, draft ─────────────────────
  {
    id: "sample_003",
    status: "draft",
    createdAt: "2026-05-28T13:00:00.000Z",
    updatedAt: "2026-05-28T14:30:00.000Z",
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Sarah O'Brien",
      serviceAddress: "31 Kingsway Blvd, Glen Waverley",
      serviceType: "hvac-seasonal",
      jobDate: "2026-05-28",
      equipment: "Mitsubishi MXZ-3E54VA multi-split, 3x indoor heads (living, master, office), installed 2018",
      voiceNotes: { jobNotes: "", recommendations: "" },
    },
    report: {
      customerSummary:
        "We carried out your pre-season service on your Mitsubishi multi-split system today. All three zones are operational, however we identified a low refrigerant condition in the master bedroom circuit which we corrected during this visit. There are a couple of items below we recommend keeping an eye on.",
      findings: [
        "• Zone 2 (master bedroom) suction pressure low — refrigerant undercharge confirmed",
        "• Condensate tray on zone 1 (living area) partially obstructed",
      ].join("\n"),
      workPerformed: [
        "• Cleaned filters on all three indoor units",
        "• Cleaned evaporator coils on all three units",
        "• Checked refrigerant pressures on all circuits",
        "• Recharged zone 2 circuit with 150g R32",
        "• Cleared obstruction in zone 1 condensate tray",
        "• Tested all three zones in cooling and heating mode",
      ].join("\n"),
      recommendations: [
        "• Your zone 2 refrigerant loss suggests a slow leak — a leak detection service within the next 6 months is recommended before the next cooling season",
        "• Schedule your next annual service for October 2026",
      ].join("\n"),
    },
  },
];

export const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: "sample_cust_001",
    name: "Rachel Kim",
    address: "14 Ferndale Ave, Mount Waverley",
    siteNotes: "",
    equipment: "Daikin FTXM50W/RXM50W split system, 6kW, installed 2021",
    createdAt: "2026-05-15T09:00:00.000Z",
    updatedAt: "2026-05-15T10:12:00.000Z",
  },
  {
    id: "sample_cust_002",
    name: "Marcus Webb",
    address: "7 Cloverdale St, Ringwood",
    siteNotes: "",
    equipment: "Brivis Buffalo 18kW ducted gas heater, installed 2012",
    createdAt: "2026-04-22T08:30:00.000Z",
    updatedAt: "2026-04-22T11:45:00.000Z",
  },
  {
    id: "sample_cust_003",
    name: "Sarah O'Brien",
    address: "31 Kingsway Blvd, Glen Waverley",
    siteNotes: "",
    equipment: "Mitsubishi MXZ-3E54VA multi-split, 3x indoor heads (living, master, office), installed 2018",
    createdAt: "2026-05-28T13:00:00.000Z",
    updatedAt: "2026-05-28T14:30:00.000Z",
  },
];
