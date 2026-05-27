import type { ServiceReport, BusinessProfile } from "@/types/report";

export const SAMPLE_BUSINESS: BusinessProfile = {
  businessName: "ProClimate HVAC",
  technicianName: "Sean Miller",
  phone: "0412 555 100",
  email: "info@proclimate.com.au",
  licenseNumber: "HVA-04821",
  brandColor: "#0f172a",
  tagline: "Heating & Cooling You Can Count On",
  website: "www.proclimate.com.au",
};

export const SAMPLE_REPORTS: ServiceReport[] = [
  // ── 1. Ducted Gas Heating Service ─────────────────────────────────────────
  {
    id: "sample_001",
    status: "complete",
    createdAt: "2026-05-20T09:15:00.000Z",
    updatedAt: "2026-05-20T10:05:00.000Z",
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Sandra Kowalski",
      serviceAddress: "14 Ridgeway Crescent, Thornbury",
      serviceType: "hvac-maintenance",
      jobDate: "2026-05-20",
      equipmentDetails: "Brivis ducted gas heating, 4-zone, 23kW",
      voiceNotes: {
        jobNotes: "Annual service on Brivis ducted gas, 4-zone system, about 6 years old. Pulled the return air filter — heavily clogged, replaced it. Cleaned the burner assembly, bit of oxidation on the ports but nothing serious. Checked the heat exchanger visually, no cracks. Flue draw was good. Tested all four zones — zones 1, 2 and 4 all fine. Zone 3 wasn't calling properly, traced it to the zone controller wiring — one of the terminals had worked loose. Tightened and retested, zone 3 back online. Cycled the whole system, all good. Gas pressure at the manifold was within spec.",
        recommendations: "Filter was extremely blocked — customer mentioned they hadn't changed it in two years. Recommend changing every 6 months. Next annual service due May 2027.",
      },
    },
    report: {
      customerSummary:
        "We completed the annual service on your ducted gas heating system today. The system is in good condition overall — we cleaned the burner, replaced the filter, and resolved a loose wiring connection on Zone 3 that was preventing it from calling for heat. All four zones are now operating correctly.",
      findings:
        "• Return air filter heavily blocked — replaced during service.\n• Zone 3 not responding to thermostat calls — traced to loose terminal connection at zone controller.\n• Burner assembly showing minor oxidation on ports — cleaned during service.",
      workPerformed:
        "• Replaced return air filter — original filter heavily clogged.\n• Cleaned burner assembly — oxidation residue removed from burner ports.\n• Inspected heat exchanger — no cracks or stress marks detected.\n• Verified flue draw — confirmed operating within normal parameters.\n• Diagnosed Zone 3 fault — identified loose terminal at zone controller wiring.\n• Re-terminated Zone 3 wiring connection — zone confirmed operational on retest.\n• Tested all four zone dampers — confirmed correct response to thermostat calls.\n• Verified gas supply pressure at manifold — within rated specification.\n• Cycled full system through all zones — confirmed even heat distribution.",
      recommendations:
        "• Return air filter should be replaced every 6 months — the current blockage level suggests it has not been changed in approximately 2 years.\n• Schedule next annual service in May 2027 before the onset of the cold season.",
    },
  },

  // ── 2. Emergency Repair — No Cooling ──────────────────────────────────────
  {
    id: "sample_002",
    status: "complete",
    createdAt: "2026-05-23T13:00:00.000Z",
    updatedAt: "2026-05-23T13:50:00.000Z",
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Marcus Webb",
      serviceAddress: "3 Settlers Court, Keilor",
      serviceType: "hvac-emergency",
      jobDate: "2026-05-23",
      equipmentDetails: "Daikin 6kW reverse-cycle split system",
      voiceNotes: {
        jobNotes: "Daikin 6kW split, customer says no cooling since yesterday, unit running but warm air only. Got there, outdoor unit running but compressor not kicking in. Checked the capacitor — dead, reading was basically zero. Replaced the dual run capacitor with a compatible unit from the van. Reset and restarted — compressor started cleanly. Measured outlet temp, dropping to around 14 degrees, back to normal. Checked the contactor while I had the panel open — pitting on the contacts but still within usable range.",
        recommendations: "Contactor is getting tired, should be replaced at next service to avoid a similar callout. System is about 8 years old, worth factoring in replacement planning over the next few years.",
      },
    },
    report: {
      customerSummary:
        "We attended your property today and identified the cause of the no-cooling fault — a failed run capacitor was preventing the compressor from starting. We replaced the part on the spot and the Daikin split system is back to full cooling operation. We've noted one item below that's worth addressing at the next service.",
      findings:
        "• Compressor not starting on arrival — outdoor unit running but no cooling output.\n• Dual run capacitor tested at near-zero capacitance — confirmed failed.\n• Contactor showing pitting on contact faces — still functional but approaching end of serviceable life.",
      workPerformed:
        "• Diagnosed compressor hard-start failure caused by failed dual run capacitor.\n• Removed and replaced dual run capacitor with a compatible rated replacement.\n• Restarted system — compressor started cleanly, cooling operation restored.\n• Measured supply air outlet temperature — confirmed return to normal cooling range.\n• Inspected contactor at outdoor unit during service.",
      recommendations:
        "• Contactor should be replaced at the next scheduled service to avoid a potential future failure.\n• The system is approximately 8 years old — begin factoring replacement into planning over the next 2–3 years.",
    },
  },

  // ── 3. Draft — Pre-Season Cooling Startup ─────────────────────────────────
  {
    id: "sample_003",
    status: "draft",
    createdAt: "2026-05-26T08:30:00.000Z",
    updatedAt: "2026-05-26T08:30:00.000Z",
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Claire Nguyen",
      serviceAddress: "88 Banksia Drive, Templestowe",
      serviceType: "hvac-seasonal",
      jobDate: "2026-05-26",
      equipmentDetails: "LG 3-zone ducted reverse-cycle, 10kW",
      voiceNotes: {
        jobNotes: "Pre-season cooling startup on LG ducted, 3-zone system. Replaced the filter — was due. Cleaned the evaporator coil, reasonable amount of dust and lint, used coil cleaner and flushed through. Checked the condensate drain — clear. Refrigerant charge looked fine, no signs of leakage. Tested all three zones in cooling mode, all dampers responding correctly. Supply temps coming down nicely across all zones. Outdoor unit coil was dirty, cleaned it down.",
        recommendations: "Book a heating startup in March before switching over for winter. Remind customer to check the filter every 3 months.",
      },
    },
    report: {
      customerSummary: "",
      findings: "",
      workPerformed: "",
      recommendations: "",
    },
  },
];
