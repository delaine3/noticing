import type { CaptureAnalysis } from "./capture-types";

/**
 * A very small local model can return "1", malformed JSON or an empty result
 * even when the input states a concrete action. Never display that output as
 * an assistant response, and never silently discard user's useful records.
 */
export function resolveLocalCapture(
  raw: string,
  userMessage: string,
  localDate: string,
  allowedTypes: readonly string[],
  parse: (raw: string, types: readonly string[]) => CaptureAnalysis,
  extract: (message: string, date: string) => CaptureAnalysis,
): { analysis: CaptureAnalysis; usedBasic: boolean } {
  const basic = extract(userMessage, localDate);
  const fallBack = (reason: string) => ({
    analysis: {
      ...basic,
      reply: reason + " " + basic.reply,
    },
    usedBasic: true,
  });
  try {
    const parsed = parse(raw, allowedTypes);
    if (parsed.proposed_records.length === 0 && basic.proposed_records.length > 0) {
      return fallBack("Local AI missed activities you reported, so basic extraction was used.");
    }
    if (!parsed.proposed_records.length && !parsed.reply.trim()) {
      return fallBack("Local AI did not return a useful response.");
    }
    if (parsed.reply.length < 4 || !/[a-z]/i.test(parsed.reply)) {
      parsed.reply = parsed.proposed_records.length
        ? "Found " + parsed.proposed_records.length + " possible records for review."
        : "No confirmed activities detected. Add details or try basic extraction.";
    }
    return { analysis: parsed, usedBasic: false };
  } catch {
    return fallBack("Local AI returned an unreadable response. Basic extraction was used.");
  }
}
