/**
 * Demo fetch interceptor.
 *
 * Installs a global fetch override that catches JobWrap API calls and returns
 * canned responses. Nothing ever reaches the real backend.
 *
 * Call installDemoInterceptor() once on mount; call the returned cleanup
 * function on unmount.
 */

const MOCK_REPORT = {
  customerSummary:
    "Annual maintenance completed on your Daikin heat pump split system. The system is in excellent condition and operating efficiently. All components were inspected and cleaned, and no faults were found.",
  findings:
    "• Filters heavily loaded with approximately 12 months of dust accumulation\n• Evaporator coil in good condition with minor surface dust\n• Condenser coil had grass clippings and debris packed into fins\n• Refrigerant pressures within manufacturer specifications\n• Capacitors testing within tolerance\n• Condensate drain clear and flowing freely",
  workPerformed:
    "• Removed, washed and reinstalled both indoor filters\n• Cleaned evaporator coil\n• Cleaned condenser coil and cleared fin debris\n• Checked and recorded refrigerant pressures\n• Tested heating and cooling operation — both confirmed working correctly\n• Checked run capacitors\n• Cleared and flushed condensate drain",
  recommendations:
    "• Continue annual servicing to maintain efficiency and system life\n• Next service due May 2027 — we will be in touch closer to the time",
};

const originalFetch = typeof window !== "undefined" ? window.fetch.bind(window) : null;

export function installDemoInterceptor(): () => void {
  if (typeof window === "undefined") return () => {};

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

    // Mock: AI report generation
    if (url.includes("/api/generate-report")) {
      await delay(1400); // realistic feel
      return jsonResponse({ report: MOCK_REPORT });
    }

    // Mock: share report link creation
    if (url.includes("/api/share-report")) {
      await delay(600);
      return jsonResponse({ url: "https://jobwrap.app/r/demo-preview" });
    }

    // All other requests pass through (fonts, images, etc.)
    return originalFetch!(input, init);
  };

  return () => {
    if (originalFetch) window.fetch = originalFetch;
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
