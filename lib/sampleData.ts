// sampleData.ts
// Five realistic HVAC service reports seeded on first launch.
// 3 completed with generated content, 2 drafts ready to generate.

import type { ServiceReport, Customer } from "@/types/report";
import { EMPTY_REPORT } from "@/types/report";

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

export const SAMPLE_REPORTS: ServiceReport[] = [

  // ── 1. Annual maintenance — COMPLETE ─────────────────────────────────────
  {
    id: "sample_001",
    status: "complete",
    createdAt: "2026-05-20T09:00:00.000Z",
    updatedAt: "2026-05-20T10:15:00.000Z",
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Rachel Kim",
      serviceAddress: "14 Ferndale Ave, Westfield",
      serviceType: "hvac-maintenance",
      jobDate: "2026-05-20",
      equipment: "Daikin FTXM50W/RXM50W heat pump split system, 6kW, installed 2021",
      nextServiceDate: "2027-05-20",
      voiceNotes: {
        jobNotes: "Annual maintenance on Rachel Kim's Daikin 6kW split system. Cleaned filters, evaporator and condenser coils. Refrigerant pressures within spec. Heating and cooling tested, operating correctly. Capacitors fine. Condensate drain clear. System in good shape.",
      },
    },
    report: {
      customerSummary: "Annual maintenance completed on your Daikin heat pump split system. The system is in excellent condition and operating efficiently. All components were inspected and cleaned, and no faults were found.",
      findings: "• Filters heavily loaded with approximately 12 months of dust accumulation\n• Evaporator coil in good condition with minor surface dust\n• Condenser coil had grass clippings and debris packed into fins\n• Refrigerant pressures within manufacturer specifications\n• Capacitors testing within tolerance\n• Condensate drain clear and flowing freely",
      workPerformed: "• Removed, washed and reinstalled both indoor filters\n• Cleaned evaporator coil\n• Cleaned condenser coil and cleared fin debris\n• Checked and recorded refrigerant pressures\n• Tested heating and cooling operation — both confirmed working correctly\n• Checked run capacitors\n• Cleared and flushed condensate drain",
      recommendations: "• Continue annual servicing to maintain efficiency and system life\n• Next service due May 2027 — we will be in touch closer to the time",
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
    createdAt: "2026-05-10T10:00:00.000Z",
    updatedAt: "2026-05-10T12:30:00.000Z",
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Tom Nguyen",
      serviceAddress: "88 Commerce St, Downtown",
      serviceType: "hvac-emergency",
      jobDate: "2026-05-10",
      equipment: "Carrier 10-ton rooftop package unit, serving ground floor retail, installed 2019",
      nextServiceDate: "2026-06-10",
      voiceNotes: {
        jobNotes: "Emergency call — Carrier 10 ton rooftop unit not cooling. Found cracked Schrader valve core on high side service port. Replaced valve core, pressure tested, vacuumed, recharged with R410A. System back online and cooling correctly.",
      },
    },
    report: {
      customerSummary: "Emergency repair completed on your Carrier rooftop package unit. A refrigerant leak was identified and repaired, the system was recharged, and full cooling operation has been restored.",
      findings: "• System running but producing warm air only — no cooling\n• Refrigerant pressures critically low on both high and low side\n• Cracked Schrader valve core identified on high side service port — confirmed source of refrigerant loss\n• Service ports on roof appear exposed and show signs of possible tampering",
      workPerformed: "• Identified refrigerant leak at high side Schrader valve core\n• Replaced Schrader valve core\n• Pressure tested entire refrigerant circuit to 400 psi — held for 30 minutes with no drop\n• Vacuumed system down\n• Recharged with R410A to manufacturer specifications\n• Confirmed system cooling correctly — supply air temperature 12°C, good airflow at all diffusers",
      recommendations: "• Install a locked protective cage or cover over rooftop service ports to prevent unauthorised access\n• Notify building security of possible tampering\n• Follow-up inspection scheduled for 10 June 2026 to confirm refrigerant levels are stable",
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
    createdAt: "2026-05-05T07:30:00.000Z",
    updatedAt: "2026-05-05T13:00:00.000Z",
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Linda Chen",
      serviceAddress: "45 Maple Dr, Riverside",
      serviceType: "hvac-install",
      jobDate: "2026-05-05",
      equipment: "Daikin FTXM71W/RXM71W heat pump split system, 7.1kW",
      voiceNotes: {
        jobNotes: "Installed new Daikin 7.1kW heat pump split system at Linda Chen's. Indoor unit on feature wall, lineset through wall cavity, outdoor unit on concrete pad. Pressure tested, vacuumed, commissioned. System cooling normally at 14°C. Customer briefed on operation and warranty registration.",
      },
    },
    report: {
      customerSummary: "Installation of your new Daikin 7.1kW heat pump split system has been completed successfully. The system has been commissioned, tested, and is operating correctly. You can begin using it immediately.",
      findings: "• New installation — no pre-existing faults\n• Wall structure suitable for indoor unit mounting\n• Outdoor unit location on north-facing concrete pad is appropriate for airflow and access",
      workPerformed: "• Mounted indoor unit on feature wall in main living area\n• Ran lineset through wall cavity to outdoor unit\n• Installed outdoor unit on concrete pad on north side of property\n• Pressure tested refrigerant circuit to 600 psi — held for 30 minutes with no drop\n• Vacuumed system down to target vacuum\n• Connected outdoor unit to consumer mains via dedicated 20 amp isolator\n• Wired indoor unit to outdoor unit\n• Commissioned and powered up system\n• Confirmed cooling operation — supply air at 14°C with good airflow\n• Demonstrated operation of remote control, timer, and sleep mode functions to customer",
      recommendations: "• Register warranty with Daikin within 30 days of installation\n• First filter clean due in approximately 3 months\n• Annual servicing recommended from next year to maintain warranty and efficiency",
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
    createdAt: "2026-05-28T13:00:00.000Z",
    updatedAt: "2026-05-28T13:00:00.000Z",
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Sarah O'Brien",
      serviceAddress: "31 Kingsway Blvd, Lakewood",
      serviceType: "hvac-seasonal",
      jobDate: "2026-05-28",
      equipment: "Mitsubishi MXZ-3E54VA multi-split with 3x indoor heads — living room, master bedroom, home office — installed 2018",
      voiceNotes: {
        jobNotes: "Pre-season service on Sarah O'Brien's Mitsubishi multi-split in Lakewood, three indoor heads — living room, master bedroom, and home office. Cleaned all three filters, they were all pretty dirty, gave them a good wash. Cleaned the evaporator coils on all three units. Checked refrigerant pressures on all circuits — living room and home office both fine, but the master bedroom circuit was low. Suction pressure was definitely down on that one. Confirmed refrigerant undercharge on the master bedroom, recharged with about 150 grams of R32. While I was at the living room unit I noticed the condensate tray had some debris in it causing a partial blockage — cleared that out. Tested all three zones in heating and cooling, all operating correctly now. Because the master bedroom had a refrigerant loss I'd recommend a leak detection within the next six months before the summer cooling season to find the source. Next annual service should be around October 2026.",
      },
    },
    report: { ...EMPTY_REPORT },
  },

  // ── 5. Gas furnace repair — DRAFT ────────────────────────────────────────
  {
    id: "sample_002",
    status: "draft",
    createdAt: "2026-05-14T08:30:00.000Z",
    updatedAt: "2026-05-14T08:30:00.000Z",
    business: SAMPLE_BUSINESS,
    job: {
      customerName: "Marcus Webb",
      serviceAddress: "7 Cloverdale St, Millbrook",
      serviceType: "hvac-repair",
      jobDate: "2026-05-14",
      equipment: "Carrier 18kW ducted gas furnace, installed 2012",
      voiceNotes: {
        jobNotes: "At Marcus Webb's in Millbrook, called out because the Carrier ducted gas furnace wasn't lighting. On arrival confirmed no ignition on a call for heat. Checked the ignition sequence — ignitor was sparking fine but the thermocouple wasn't holding the flame. Pulled the thermocouple out, it was definitely faulty. Also pulled the burner manifold while I was in there — the ports were partially blocked, had some oxidation and carbon buildup. Replaced the thermocouple with a compatible unit. Cleaned up the burner ports. Put it all back together, tested — unit lighting and holding flame no problem. Ran it through a full heating cycle, heat output at all registers was good. The furnace is 14 years old now, I'd recommend the customer starts budgeting for a replacement in the next couple of years — parts are getting harder to find for these older units.",
      },
    },
    report: { ...EMPTY_REPORT },
  },

];

export const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: "sample_cust_001",
    name: "Rachel Kim",
    address: "14 Ferndale Ave, Westfield",
    siteNotes: "",
    equipment: "Daikin FTXM50W/RXM50W heat pump split system, 6kW, installed 2021",
    createdAt: "2026-05-20T09:00:00.000Z",
    updatedAt: "2026-05-20T10:15:00.000Z",
  },
  {
    id: "sample_cust_002",
    name: "Marcus Webb",
    address: "7 Cloverdale St, Millbrook",
    siteNotes: "",
    equipment: "Carrier 18kW ducted gas furnace, installed 2012",
    createdAt: "2026-05-14T08:30:00.000Z",
    updatedAt: "2026-05-14T11:00:00.000Z",
  },
  {
    id: "sample_cust_003",
    name: "Sarah O'Brien",
    address: "31 Kingsway Blvd, Lakewood",
    siteNotes: "",
    equipment: "Mitsubishi MXZ-3E54VA multi-split with 3x indoor heads — living room, master bedroom, home office — installed 2018",
    createdAt: "2026-05-28T13:00:00.000Z",
    updatedAt: "2026-05-28T14:30:00.000Z",
  },
  {
    id: "sample_cust_004",
    name: "Tom Nguyen",
    address: "88 Commerce St, Downtown",
    siteNotes: "Rooftop access via internal roof hatch — key held at reception",
    equipment: "Carrier 10-ton rooftop package unit, serving ground floor retail, installed 2019",
    createdAt: "2026-05-10T10:00:00.000Z",
    updatedAt: "2026-05-10T12:30:00.000Z",
  },
  {
    id: "sample_cust_005",
    name: "Linda Chen",
    address: "45 Maple Dr, Riverside",
    siteNotes: "",
    equipment: "Daikin FTXM71W/RXM71W heat pump split system, 7.1kW",
    createdAt: "2026-05-05T07:30:00.000Z",
    updatedAt: "2026-05-05T13:00:00.000Z",
  },
];
