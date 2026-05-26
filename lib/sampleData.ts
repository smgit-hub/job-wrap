import type { ServiceReport } from "@/types/report";
import { DEFAULT_BUSINESS } from "./storage";

export const SAMPLE_REPORTS: ServiceReport[] = [
  // ── 1. Annual Gas Heating Service ──────────────────────────────────────────
  {
    id: "sample_001",
    status: "complete",
    createdAt: "2026-05-20T09:15:00.000Z",
    updatedAt: "2026-05-20T10:05:00.000Z",
    business: DEFAULT_BUSINESS,
    job: {
      customerName: "Tom Ashworth",
      serviceAddress: "47 Fernwood Lane, Ashton",
      serviceType: "hvac-maintenance",
      jobDate: "2026-05-20",
      voiceNotes: {
        jobNotes: "Annual service on ducted gas heating, 5-zone, about 8 years old, 20kW output. Cleaned the burner assembly, checked the heat exchanger — no cracking visible. Flue draw was good. Tested all 5 zone dampers, all responding. Replaced the filter. Gas pressure at the manifold spot on. Cycled through all zones to confirm even heat distribution. Zone 3 damper was a bit slow to open — cleaned the actuator linkage and it freed right up. No CO detected.",
        recommendations: "Zone 3 actuator is the original unit — worth budgeting for a replacement in the next 12–18 months. Annual service next May.",
      },
    },
    report: {
      customerSummary:
        "Your ducted heating system was serviced today and is in great shape. We cleaned and inspected all the key components, tested every zone, and confirmed everything is heating evenly throughout the home. The Zone 3 damper actuator is showing its age — it's working fine now but we've flagged it below as something to budget for.",
      findings:
        "• Zone 3 damper actuator sluggish on opening — cleaned actuator linkage, resolved immediately. Component is original to installation.\n• No carbon monoxide detected at flue outlet or inside the unit during operation.\n• Heat exchanger visually inspected — no cracks or stress marks identified.\n• All five zones tested and confirmed responding correctly to thermostat calls.",
      workPerformed:
        "• Cleaned burner assembly — oxidation residue removed from burner ports and heat exchanger access area.\n• Inspected heat exchanger — no visible cracks, distortion, or discolouration detected.\n• Verified flue draw and combustion — operating within normal parameters.\n• Tested all five zone dampers for correct operation and response.\n• Cleaned actuator linkage on Zone 3 damper — resolved slow opening response.\n• Replaced return-air filter.\n• Verified gas supply pressure at manifold — confirmed within rated specification.\n• Cycled system through all zones to confirm even heat distribution.",
      recommendations:
        "• Zone 3 damper actuator is the original unit and showing early signs of wear — budget for replacement within the next 12–18 months.\n• Schedule next annual service in May 2027 before the onset of the cold season.",
    },
  },

  // ── 2. Emergency Call — Failed Start Capacitor ─────────────────────────────
  {
    id: "sample_002",
    status: "complete",
    createdAt: "2026-05-23T13:00:00.000Z",
    updatedAt: "2026-05-23T13:50:00.000Z",
    business: DEFAULT_BUSINESS,
    job: {
      customerName: "Priya Sharma",
      serviceAddress: "8 Clifton Gardens, Bramley",
      serviceType: "hvac-emergency",
      jobDate: "2026-05-23",
      voiceNotes: {
        jobNotes: "Carrier 3-ton split system, approximately 7 years old. Customer called, no cooling at all. Unit was just humming and tripping the breaker. Got there, checked the capacitor — reading was way below tolerance, basically dead. Classic hard-start failure. Replaced the dual-run capacitor with a compatible unit I had on the van. Reset the breaker, unit started straight up. Checked contactor while I was in there — it's worn but still okay for now.",
        recommendations: "Contactor is worn and should be replaced at next service. Unit is 7 years old — start planning for replacement in the next 2–3 years.",
      },
    },
    report: {
      customerSummary:
        "We attended your property today and found the cause of the no-cooling fault — a failed run capacitor was preventing the compressor from starting. We replaced the part on the spot and your system is back up and running normally. We've noted one item below to keep an eye on at the next service.",
      findings:
        "• System tripping circuit breaker on start-up — consistent with compressor locked out due to capacitor failure.\n• Dual-run capacitor tested well below rated tolerance — confirmed failed.\n• Contactor showing wear on contact faces — still functional but past prime condition.",
      workPerformed:
        "• Diagnosed hard-start failure caused by failed dual-run capacitor.\n• Removed and replaced dual-run capacitor with a compatible rated replacement unit.\n• Reset circuit breaker following capacitor replacement.\n• Confirmed system start-up — compressor started cleanly, cooling operation restored.\n• Inspected contactor at outdoor unit during service.",
      recommendations:
        "• Contactor should be replaced at the next scheduled service to avoid a potential future failure.\n• The system is 7 years old — begin planning for replacement within the next 2–3 years.",
    },
  },

  // ── 3. New Ductless Mini-Split Installation ────────────────────────────────
  {
    id: "sample_003",

    status: "complete",
    createdAt: "2026-05-24T08:00:00.000Z",
    updatedAt: "2026-05-24T11:30:00.000Z",
    business: DEFAULT_BUSINESS,
    job: {
      customerName: "James & Rachel Torres",
      serviceAddress: "12 Meadow View Close, Whitfield",
      serviceType: "hvac-install",
      jobDate: "2026-05-24",
      voiceNotes: {
        jobNotes: "New installation of Mitsubishi 5kW reverse-cycle split system, MSZ-AP50VGD indoor, MXZ-AP50VGD outdoor. Mounted the indoor head on the north wall of the main living room, ran refrigerant lines and drain through the wall to the outdoor unit on the eastern fence side. Flared and pressure tested the lines — held 600 PSI no problem. Pulled vacuum, held leak free. Released refrigerant from the outdoor unit. Commissioned the unit. Paired the remote. First start was clean, both heating and cooling modes tested and confirmed. Showed the customer how to use it.",
        recommendations: "",
      },
    },
    report: {
      customerSummary:
        "Your new Mitsubishi split system has been fully installed and is ready to use. We mounted the indoor unit, ran all the pipework, pressure tested the system, and commissioned it in both heating and cooling modes — everything is working as expected. We've walked you through the remote control.",
      findings: "",
      workPerformed:
        "• Mounted Mitsubishi MSZ-AP50VGD indoor wall unit on north wall of main living area.\n• Installed refrigerant line set and condensate drain through penetration in external wall.\n• Installed Mitsubishi MXZ-AP50VGD outdoor unit on eastern fence line.\n• Flared refrigerant line connections and pressure tested to 600 PSI — held with no pressure loss.\n• Evacuated refrigerant circuit — vacuum held leak-free before release.\n• Released factory-charged refrigerant from outdoor unit.\n• Commissioned system in both heating and cooling modes — confirmed correct operation.\n• Paired wireless remote and demonstrated operation to customer.",
      recommendations: "• Schedule next routine service when due",
    },
  },

  // ── 4. Pre-season Cooling Startup ─────────────────────────────────────────
  {
    id: "sample_004",
    status: "complete",
    createdAt: "2026-05-21T08:30:00.000Z",
    updatedAt: "2026-05-21T09:20:00.000Z",
    business: DEFAULT_BUSINESS,
    job: {
      customerName: "Kevin Flanagan",
      serviceAddress: "33 Copperfield Street, Moorgate",
      serviceType: "hvac-seasonal",
      jobDate: "2026-05-21",
      voiceNotes: {
        jobNotes: "Pre-season cooling startup on a 4-zone ducted reverse-cycle, Daikin, about 5 years old. Pulled the return air filter — pretty dirty, replaced it. Cleaned the evaporator coil — had a fair bit of lint build-up, gave it a thorough clean with coil cleaner. Checked the condensate drain — had a partial blockage, flushed it clear. Refrigerant charge is sitting fine. Tested all 4 zones in cooling mode — all responding correctly. System came up clean, cooling well.",
        recommendations: "Book the end-of-season service in March before switching back to heating. Customer mentioned the outdoor unit could do with a clean next visit.",
      },
    },
    report: {
      customerSummary:
        "Your ducted system has been prepared for the cooling season and is operating well. We cleaned the evaporator coil, replaced the filter, and cleared a partial blockage in the condensate drain — the system is now ready for summer. We've noted a couple of items for the next visit below.",
      findings:
        "• Return air filter heavily soiled — replaced during service.\n• Evaporator coil had significant lint accumulation — cleaned with coil cleaner.\n• Condensate drain partially blocked — flushed clear during service.",
      workPerformed:
        "• Replaced return air filter.\n• Cleaned evaporator coil using coil cleaner — lint build-up removed.\n• Flushed condensate drain — partial blockage cleared.\n• Verified refrigerant charge — confirmed within specification.\n• Tested all four zones in cooling mode — confirmed correct operation.",
      recommendations:
        "• Book end-of-season service in March before switching back to heating mode.\n• Outdoor unit to be cleaned at next scheduled visit per customer request.",
    },
  },

  // ── 5. Refrigerant Leak — Wall Split ──────────────────────────────────────
  {
    id: "sample_005",
    status: "complete",
    createdAt: "2026-05-22T10:00:00.000Z",
    updatedAt: "2026-05-22T11:15:00.000Z",
    business: DEFAULT_BUSINESS,
    job: {
      customerName: "Amy Chen",
      serviceAddress: "7 Larch Grove, Thornfield",
      serviceType: "hvac-repair",
      jobDate: "2026-05-22",
      voiceNotes: {
        jobNotes: "Daikin 2.5kW wall split, about 4 years old, customer reporting no cooling. Got there, system running but barely moving any cold air. Nitrogen tested the system and found a leak at the flare connection on the indoor unit. Re-flared the connection. Pressure tested again — held with no loss. Pulled vacuum, held leak free. Recharged with R32 to manufacturer spec. Tested operation — cooling confirmed, outlet temperature back to normal.",
        recommendations: "",
      },
    },
    report: {
      customerSummary:
        "We identified and repaired the cause of the no-cooling fault — a refrigerant leak at the indoor unit connection. The joint was re-flared, pressure tested, and the system recharged to specification. Your system is cooling normally again.",
      findings:
        "• System operating with significantly reduced cooling output on arrival.\n• Refrigerant leak identified at flare connection on indoor unit.",
      workPerformed:
        "• Nitrogen pressure tested system — leak confirmed at indoor unit flare connection.\n• Re-flared indoor unit refrigerant connection.\n• Pressure tested repaired joint — held with no pressure loss.\n• Evacuated refrigerant circuit — vacuum held leak-free.\n• Recharged system with R32 to manufacturer specification.\n• Tested cooling operation — outlet temperature confirmed within normal range.",
      recommendations: "• Schedule next routine service when due",
    },
  },

  // ── 6. Draft — System Inspection (ungenerated) ────────────────────────────
  {
    id: "sample_006",
    status: "draft",
    createdAt: "2026-05-25T14:00:00.000Z",
    updatedAt: "2026-05-25T14:00:00.000Z",
    business: DEFAULT_BUSINESS,
    job: {
      customerName: "Robert Gallagher",
      serviceAddress: "Unit 4 / 18 Birchwood Road, Ferndale",
      serviceType: "hvac-inspection",
      jobDate: "2026-05-25",
      voiceNotes: {
        jobNotes: "Rental property inspection, ducted system, single phase, about 12 years old. Wall controller not displaying properly — screen's faded, think it needs replacing. Checked the heat exchanger — no cracking but visible surface oxidation. Filter was way overdue — replaced it. Fan belt on the air handler is showing wear, flagged it. Condensate drain pan has mould growth. Outdoor unit looked okay structurally, no obvious damage, coil a bit dirty.",
        recommendations: "Wall controller needs replacing — display is failing. Fan belt should be replaced within 3 months before it snaps. Drain pan needs a chemical clean. Given the age and condition, recommend a full service within 6 months.",
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
