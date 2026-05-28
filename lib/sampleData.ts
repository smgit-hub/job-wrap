// sampleData.ts
// Five realistic HVAC service reports seeded on first launch.
// Reports are pre-loaded with job notes only — no generated content.
// Demo flow: pick a report → Generate Report → review and export.

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

  // ── 1. Annual maintenance — all good, no findings ─────────────────────────
  {
    id: "sample_001",
    status: "draft",
    createdAt: "2026-05-20T09:00:00.000Z",
    updatedAt: "2026-05-20T09:00:00.000Z",
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Rachel Kim",
      serviceAddress: "14 Ferndale Ave, Mount Waverley",
      serviceType: "hvac-maintenance",
      jobDate: "2026-05-20",
      equipment: "Daikin FTXM50W/RXM50W reverse-cycle split, 6kW, installed 2021",
      nextServiceDate: "2027-05-20",
      voiceNotes: {
        jobNotes: "Annual maintenance on Rachel Kim's Daikin 6kW split in Mount Waverley. Cleaned the filters, they were about a year's worth of dust — gave them a good wash. Cleaned the evaporator coil, not too bad. Went outside and cleaned the condenser coil, had some grass clippings and debris packed into the fins. Checked the refrigerant pressures, all within spec. Tested heating and cooling, both operating correctly, temperatures good. Checked the capacitors, all fine. Cleared the condensate drain, flowing freely. Overall the system is in good shape. I'd recommend keeping up the annual service. Next service due around May 2027.",
        recommendations: "",
      },
    },
    report: {
      customerSummary: "",
      findings: "",
      workPerformed: "",
      recommendations: "",
    },
  },

  // ── 2. Gas heater repair — failed thermocouple, blocked burner ─────────────
  {
    id: "sample_002",
    status: "draft",
    createdAt: "2026-05-14T08:30:00.000Z",
    updatedAt: "2026-05-14T08:30:00.000Z",
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Marcus Webb",
      serviceAddress: "7 Cloverdale St, Ringwood",
      serviceType: "hvac-repair",
      jobDate: "2026-05-14",
      equipment: "Brivis Buffalo 18kW ducted gas heater, installed 2012",
      voiceNotes: {
        jobNotes: "At Marcus Webb's in Ringwood, called out because the Brivis ducted gas heater wasn't lighting. On arrival confirmed no ignition on a call for heat. Checked the ignition sequence — ignitor was sparking fine but the thermocouple wasn't holding the flame. Pulled the thermocouple out, it was definitely faulty. Also pulled the burner manifold while I was in there — the ports were partially blocked, had some oxidation and carbon buildup. Replaced the thermocouple with a compatible unit. Cleaned up the burner ports. Put it all back together, tested — unit lighting and holding flame no problem. Ran it through a full heating cycle, heat output at all registers was good. The heater is 14 years old now, I'd recommend the customer starts budgeting for a replacement in the next couple of years — parts are getting harder to find for these older Brivis units.",
        recommendations: "",
      },
    },
    report: {
      customerSummary: "",
      findings: "",
      workPerformed: "",
      recommendations: "",
    },
  },

  // ── 3. Pre-season service — low refrigerant on one zone, draft ─────────────
  {
    id: "sample_003",
    status: "draft",
    createdAt: "2026-05-28T13:00:00.000Z",
    updatedAt: "2026-05-28T13:00:00.000Z",
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Sarah O'Brien",
      serviceAddress: "31 Kingsway Blvd, Glen Waverley",
      serviceType: "hvac-seasonal",
      jobDate: "2026-05-28",
      equipment: "Mitsubishi MXZ-3E54VA multi-split with 3x indoor heads — living room, master bedroom, home office — installed 2018",
      voiceNotes: {
        jobNotes: "Pre-season service on Sarah O'Brien's Mitsubishi multi-split in Glen Waverley, three indoor heads — living room, master bedroom, and home office. Cleaned all three filters, they were all pretty dirty, gave them a good wash. Cleaned the evaporator coils on all three units. Checked refrigerant pressures on all circuits — living room and home office both fine, but the master bedroom circuit was low. Suction pressure was definitely down on that one. Confirmed refrigerant undercharge on the master bedroom, recharged with about 150 grams of R32. While I was at the living room unit I noticed the condensate tray had some debris in it causing a partial blockage — cleared that out. Tested all three zones in heating and cooling, all operating correctly now. Because the master bedroom had a refrigerant loss I'd recommend a leak detection within the next six months before the summer cooling season to find the source. Next annual service should be around October 2026.",
        recommendations: "",
      },
    },
    report: {
      customerSummary: "",
      findings: "",
      workPerformed: "",
      recommendations: "",
    },
  },

  // ── 4. Emergency repair — refrigerant leak, Schrader valve ─────────────────
  {
    id: "sample_004",
    status: "draft",
    createdAt: "2026-05-10T10:00:00.000Z",
    updatedAt: "2026-05-10T10:00:00.000Z",
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Tom Nguyen",
      serviceAddress: "88 Collins St, Melbourne CBD",
      serviceType: "hvac-emergency",
      jobDate: "2026-05-10",
      equipment: "Carrier 10-ton rooftop package unit, serving ground floor retail, installed 2019",
      voiceNotes: {
        jobNotes: "Emergency call for Tom Nguyen at Collins Street — Carrier 10 ton rooftop unit not cooling at all. On arrival the unit was running but warm air only inside. Went up to the roof. Compressor running but both refrigerant pressures were very low, basically nothing on the high side. Found the leak — Schrader valve on the high side service port, the valve core was cracked and leaking. Replaced the Schrader valve core. Pressure tested the whole circuit to 400 psi, held for 30 minutes, no drop. Vacuumed the system down. Recharged with R410A, brought the system back to full operating pressures. Tested — unit now cooling correctly, supply temps down to about 12 degrees, confirmed good airflow at the diffusers inside. System is fully back online. The service ports on the roof are pretty exposed, I'd recommend putting a locked cage or cover over that service point — it looks like someone may have been tampering with the valve. Worth having a word with building security.",
        recommendations: "",
      },
    },
    report: {
      customerSummary: "",
      findings: "",
      workPerformed: "",
      recommendations: "",
    },
  },

  // ── 5. New installation — Daikin split, living area ────────────────────────
  {
    id: "sample_005",
    status: "draft",
    createdAt: "2026-05-05T07:30:00.000Z",
    updatedAt: "2026-05-05T07:30:00.000Z",
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Linda Chen",
      serviceAddress: "45 Maple Dr, Doncaster",
      serviceType: "hvac-install",
      jobDate: "2026-05-05",
      equipment: "Daikin FTXM71W/RXM71W reverse-cycle split, 7.1kW",
      voiceNotes: {
        jobNotes: "Just finished installing a new Daikin 7.1 kilowatt reverse-cycle split at Linda Chen's place in Doncaster. Mounted the indoor unit on the feature wall in the main living area. Ran the lineset through the wall cavity down to the outdoor unit sitting on a concrete pad on the north side of the house. Pressure tested to 600 psi — held for 30 minutes, no drop. Vacuumed the system down, held vacuum. Electrical — connected the outdoor unit to the consumer mains via a dedicated 20 amp isolator. Wired the indoor unit back to the outdoor. Commissioned and powered up. System cooling normally, temps dropping to around 14 degrees out the supply grille. Showed Linda how to use the remote and walked her through the timer and sleep mode functions. Reminded her to register the warranty with Daikin within 30 days. First filter clean is due in about 3 months. Annual service from next year.",
        recommendations: "",
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

export const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: "sample_cust_001",
    name: "Rachel Kim",
    address: "14 Ferndale Ave, Mount Waverley",
    siteNotes: "",
    equipment: "Daikin FTXM50W/RXM50W reverse-cycle split, 6kW, installed 2021",
    createdAt: "2026-05-20T09:00:00.000Z",
    updatedAt: "2026-05-20T10:15:00.000Z",
  },
  {
    id: "sample_cust_002",
    name: "Marcus Webb",
    address: "7 Cloverdale St, Ringwood",
    siteNotes: "",
    equipment: "Brivis Buffalo 18kW ducted gas heater, installed 2012",
    createdAt: "2026-05-14T08:30:00.000Z",
    updatedAt: "2026-05-14T11:00:00.000Z",
  },
  {
    id: "sample_cust_003",
    name: "Sarah O'Brien",
    address: "31 Kingsway Blvd, Glen Waverley",
    siteNotes: "",
    equipment: "Mitsubishi MXZ-3E54VA multi-split with 3x indoor heads — living room, master bedroom, home office — installed 2018",
    createdAt: "2026-05-28T13:00:00.000Z",
    updatedAt: "2026-05-28T14:30:00.000Z",
  },
  {
    id: "sample_cust_004",
    name: "Tom Nguyen",
    address: "88 Collins St, Melbourne CBD",
    siteNotes: "Rooftop access via internal roof hatch — key held at reception",
    equipment: "Carrier 10-ton rooftop package unit, serving ground floor retail, installed 2019",
    createdAt: "2026-05-10T10:00:00.000Z",
    updatedAt: "2026-05-10T12:30:00.000Z",
  },
  {
    id: "sample_cust_005",
    name: "Linda Chen",
    address: "45 Maple Dr, Doncaster",
    siteNotes: "",
    equipment: "Daikin FTXM71W/RXM71W reverse-cycle split, 7.1kW",
    createdAt: "2026-05-05T07:30:00.000Z",
    updatedAt: "2026-05-05T13:00:00.000Z",
  },
];
