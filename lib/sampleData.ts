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
        equipmentDetails: "Ducted gas heating system, 5-zone, approximately 8 years old, 20kW rated output",
        workCompleted: "Annual service. Cleaned the burner assembly, checked the heat exchanger — no cracking visible. Flue draw was good. Tested all 5 zone dampers, all responding. Replaced the filter. Gas pressure at the manifold spot on. Cycled through all zones to confirm even heat distribution.",
        diagnostics: "Zone 3 damper was a bit slow to open — cleaned the actuator linkage and it freed right up. Everything else within spec. No CO detected. Gas pressure normal throughout.",
        recommendations: "Zone 3 actuator is the original unit — worth budgeting for a replacement in the next 12–18 months. Annual service next May.",
      },
    },
    report: {
      customerSummary:
        "Your ducted heating system was serviced today and is in great shape. We cleaned and inspected all the key components, tested every zone, and confirmed everything is heating evenly throughout the home. We did notice the Zone 3 damper actuator is showing its age — it's working fine now but we've flagged it below as something to keep an eye on.",
      workCompleted:
        "• Cleaned burner assembly. Oxidation residue removed from burner ports and heat exchanger access area.\n• Inspected heat exchanger — no visible cracks, distortion, or discolouration detected.\n• Verified flue draw and combustion — operating within normal parameters.\n• Tested all five zone dampers for correct operation and response.\n• Cleaned actuator linkage on Zone 3 damper — resolved slow opening response.\n• Replaced return-air filter. Previous filter was due for replacement.\n• Verified gas supply pressure at manifold — confirmed within rated specification.\n• Cycled system through all zones to confirm even heat distribution.",
      diagnostics:
        "• System operational on arrival. All five zones tested and confirmed responding to thermostat calls.\n• Zone 3 damper actuator was sluggish on opening — cleaned linkage resolved the issue. Component is original to installation.\n• No carbon monoxide detected at flue outlet or inside the unit during operation.\n• Gas pressure at manifold confirmed within manufacturer specification throughout testing.\n• Heat exchanger visually inspected — no cracks or stress marks identified.\n• System operating within normal parameters following annual maintenance service.",
      recommendations:
        "• Zone 3 damper actuator is the original unit and showing early signs of wear — budget for replacement within the next 12–18 months to avoid a heating failure.\n• Schedule next annual service in May 2027 before the onset of the cold season.",
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
        equipmentDetails: "Carrier 3-ton split system, approximately 7 years old",
        workCompleted: "Customer called, no cooling at all. Unit was just humming and tripping the breaker. Got there, checked the capacitor — reading was way below tolerance, basically dead. Classic hard-start failure. Replaced the dual-run capacitor with a compatible unit I had on the van. Reset the breaker, unit started straight up.",
        diagnostics: "Compressor was trying to start but couldn't due to the dead capacitor. No other issues found. Refrigerant pressures good once running. Checked contactor while I was in there — it's worn but still okay for now.",
        recommendations: "Contactor is worn and should be replaced at next service. Unit is 7 years old — start planning for replacement in the next 2–3 years.",
      },
    },
    report: {
      customerSummary:
        "We attended your property today and found the cause of the no-cooling fault — a failed run capacitor was preventing the compressor from starting. We replaced the part on the spot and your system is back up and running normally. Everything else checked out fine, and we've noted one item below to keep an eye on at the next service.",
      workCompleted:
        "• Attended emergency no-cooling call. Diagnosed hard-start failure caused by a failed dual-run capacitor.\n• Removed and replaced dual-run capacitor with a compatible rated replacement unit.\n• Reset circuit breaker following capacitor replacement.\n• Verified system start-up — compressor started cleanly with no abnormal sounds.\n• Confirmed correct refrigerant operating pressures following restoration of normal operation.\n• Inspected contactor at outdoor unit during service.",
      diagnostics:
        "• System was tripping the circuit breaker on start-up attempts on arrival — consistent with compressor locked out due to capacitor failure.\n• Dual-run capacitor tested well below rated tolerance — confirmed failed.\n• No other fault points identified. Refrigerant pressures confirmed within normal operating range once running.\n• Contactor showing wear on contact faces — still functional but past prime condition.\n• Fault resolved — system restored to normal cooling operation.",
      recommendations:
        "• Contactor should be replaced at the next scheduled service to avoid a potential future failure.\n• The system is 7 years old — begin planning for replacement within the next 2–3 years as components approach the end of their typical service life.",
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
        equipmentDetails: "Mitsubishi 5kW reverse-cycle split system, MSZ-AP50VGD indoor, MXZ-AP50VGD outdoor",
        workCompleted: "Full installation. Mounted the indoor head on the north wall of the main living room, ran refrigerant lines and drain through the wall to the outdoor unit on the eastern fence side. Flared and pressure tested the lines — held 600psi no problem. Pulled vacuum, held leak free. Released refrigerant from the outdoor unit. Commissioned the unit. Paired the remote.",
        diagnostics: "Pressure test passed, vacuum held at 500 microns. First start was clean, both heating and cooling modes tested and confirmed. Remote programming done. Showed the customer how to use it.",
        recommendations: "Register the warranty with Mitsubishi within 30 days. First service at 12 months.",
      },
    },
    report: {
      customerSummary:
        "Your new Mitsubishi split system has been fully installed and is ready to use. We mounted the indoor unit, ran all the pipework, pressure tested the system, and commissioned it in both heating and cooling modes — everything is working as expected. We've walked you through the remote and noted a couple of things below to make the most of your new system.",
      workCompleted:
        "• Mounted Mitsubishi MSZ-AP50VGD indoor wall unit on north wall of main living area at agreed height.\n• Installed refrigerant line set and condensate drain through penetration in external wall. Penetration sealed and weather-proofed.\n• Installed Mitsubishi MXZ-AP50VGD outdoor unit on bracket at eastern fence line.\n• Flared refrigerant line connections and pressure tested to 600 psi — held with no pressure loss.\n• Evacuated refrigerant circuit to 500 microns. Vacuum confirmed stable before release.\n• Released factory-charged refrigerant from outdoor unit.\n• Commissioned system in both heating and cooling modes. Confirmed correct operation across all settings.\n• Paired wireless remote and demonstrated operation to customer.",
      diagnostics:
        "• Pressure test at 600 psi — no pressure loss detected. Line set and connections confirmed leak-free.\n• Vacuum held at 500 microns prior to refrigerant release — confirming system integrity.\n• First start in cooling and heating modes confirmed clean compressor operation and correct airflow from indoor head.\n• Indoor unit drain confirmed flowing freely to external termination point.\n• System installed and commissioned — operating within normal parameters.",
      recommendations:
        "• Register the new equipment with Mitsubishi within 30 days to activate the manufacturer warranty.\n• Schedule a first-year service check at 10–12 months to verify refrigerant charge, clean filters, and confirm all connections remain secure.",
    },
  },
];
