// ---------------------------------------------------------------------------
// PDF Export Utility — client-side only (browser)
//
// Uses html2canvas to rasterize the PrintableReport component, then
// embeds the canvas as a JPEG image in a jsPDF document.
//
// The output is an A4 portrait PDF. Long reports span multiple pages via
// the repeated-image-with-offset technique (industry standard for canvas PDFs).
//
// TODO (Stage 5): replace with a server-side rendering approach (Puppeteer /
// headless Chrome) for pixel-perfect vector output and smaller file sizes.
// POST /api/pdf would accept the report JSON and return a binary PDF stream.
//
// TODO (future): support multiple page templates (landscape for photo reports,
// compact for short maintenance jobs, branded for premium customers).
//
// TODO (future): attach photos (before/after images) on subsequent pages.
// ---------------------------------------------------------------------------

export interface ExportOptions {
  filename: string;
  /** html2canvas scale factor — 2 gives crisp rendering at 2× pixel density */
  scale?: number;
  /** JPEG quality 0–1 — 0.92 is a good balance of size vs. quality */
  quality?: number;
}

export function generateFilename(customerName: string, jobDate: string): string {
  const slug = (customerName || "report")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const date = jobDate || new Date().toISOString().split("T")[0];
  return `${slug}_service-report_${date}.pdf`;
}

export async function exportReportPdf(
  element: HTMLElement,
  options: ExportOptions
): Promise<void> {
  const { filename, scale = 2, quality = 0.92 } = options;

  // Dynamic imports keep jspdf + html2canvas out of the initial JS bundle.
  // They only load when the user taps "Export PDF".
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  // Rasterize the element at 2× for sharp rendering on retina/high-DPI screens
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    // Explicitly set the capture size to the element's layout dimensions
    width: element.offsetWidth,
    height: element.offsetHeight,
    // Scroll the element into view coordinates so off-screen elements render correctly
    scrollX: 0,
    scrollY: -window.scrollY,
    windowWidth: document.documentElement.offsetWidth,
    windowHeight: document.documentElement.offsetHeight,
    // Strip all external stylesheets from the clone before rendering.
    // Tailwind v4 uses lab()/oklch() color functions that html2canvas can't parse.
    // PrintableReport uses only inline styles so removing stylesheets has no effect
    // on the output — it just prevents the color-parsing crash.
    onclone: (_doc, el) => {
      const root = el.ownerDocument;
      root.querySelectorAll("link[rel='stylesheet'], style").forEach((s) => s.remove());
    },
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm

  // Scale the canvas proportionally to fit the A4 page width
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height / canvas.width) * imgWidth;

  const imgData = canvas.toDataURL("image/jpeg", quality);

  // --- Multi-page handling -------------------------------------------------
  // The full canvas image is larger than one A4 page in height.
  // We draw it at an increasing negative Y offset on successive pages so the
  // PDF "window" reveals successive slices of the same image.
  let heightRemaining = imgHeight;
  let pageTop = 0; // Y position of the top of the current slice within the image

  pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
  heightRemaining -= pageHeight;

  while (heightRemaining > 0) {
    pageTop -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, pageTop, imgWidth, imgHeight);
    heightRemaining -= pageHeight;
  }
  // -------------------------------------------------------------------------

  // Open in a new tab so the browser / device shows its native PDF viewer
  // (print dialog on desktop, share sheet on iOS, save prompt on Android).
  // Auto-download is bypassed entirely.
  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  // Release the object URL after a short delay — the tab has had time to load it
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
