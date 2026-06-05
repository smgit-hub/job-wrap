// Safely reads the request body into a string with a hard size cap.
// Bypasses the Content-Length header spoofing vulnerability — reads actual bytes.
export async function readBodyWithLimit(
  request: Request,
  maxBytes: number,
): Promise<{ text: string } | { error: string; status: number }> {
  const reader = request.body?.getReader();
  if (!reader) return { text: "" };

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      reader.cancel();
      return { error: "Request body too large", status: 413 };
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { text: new TextDecoder().decode(merged) };
}
