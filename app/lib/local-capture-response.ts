import type { CaptureAnalysis, CaptureMessage, CaptureType } from "./capture-types";

/**
 * WebLLM 0.2.87 can throw in the WASM grammar matcher for unschematized
 * response_format: { type: "json_object" }. Use ordinary text completion
 * with a JSON-only instruction and validate the response on-device.
 */
export function createLocalCompletionRequest(
  prompt: string,
  transcript: CaptureMessage[],
) {
  return {
    messages: [{ role: "system" as const, content: prompt }, ...transcript],
    temperature: 0.1,
    max_tokens: 1400,
  };
}

const numberLimits = {
  water_amount_ml: 5000,
  treadmill_distance_km: 100,
  treadmill_duration_minutes: 1440,
  sleep_hours: 24,
  duration_minutes: 1440,
  mood_score: 10,
  energy_score: 10,
  intensity_score: 10,
} as const;

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function shortString(value: unknown, length: number): string {
  return typeof value === "string" ? value.slice(0, length).trim() : "";
}

function validDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const d = new Date(value + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value ? value : "";
}

function metric(key: keyof typeof numberLimits, raw: unknown): number | null {
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0 || raw > numberLimits[key])
    return null;
  if (["mood_score", "energy_score", "intensity_score"].includes(key) &&
      (!Number.isInteger(raw) || raw < 1)) return null;
  return raw;
}

function readJson(raw: string): unknown {
  if (raw.length > 20000) throw new Error("Local AI response was unexpectedly long.");
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  try { return JSON.parse(text); }
  catch {
    // Small local models sometimes preface JSON with prose. Accept an object
    // only when it can be parsed completely after trimming surrounding text.
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1) throw new Error("Local model did not return JSON.");
    if (end <= start) throw new Error("Local model returned incomplete JSON.");
    try { return JSON.parse(text.slice(start, end + 1)); }
    catch { throw new Error("Local model returned incomplete JSON."); }
  }
}

export function parseLocalCaptureResponse(
  raw: string,
  allowedTypes: readonly string[],
): CaptureAnalysis {
  const root = object(readJson(raw));
  if (!root) throw new Error("Local model response was not a JSON object.");
  const proposals = root.proposed_records;
  if (!Array.isArray(proposals)) throw new Error("Local model omitted its proposed records.");
  const allowed = new Set(allowedTypes);

  const records: CaptureAnalysis["proposed_records"] = [];
  for (const candidate of proposals.slice(0, 6)) {
    const item = object(candidate);
    if (!item || typeof item.log_type !== "string" || !allowed.has(item.log_type)) continue;
    const title = shortString(item.title, 160);
    if (!title) continue;

    const normalized: CaptureAnalysis["proposed_records"][number] = {
      log_type: item.log_type as CaptureType,
      title,
      notes: shortString(item.notes, 1500),
      action_date: validDate(item.action_date),
      action_time: typeof item.action_time === "string" &&
        /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(item.action_time) ? item.action_time : "",
      evidence: shortString(item.evidence, 350),
      uncertainty: shortString(item.uncertainty, 300),
      water_amount_ml: metric("water_amount_ml", item.water_amount_ml),
      treadmill_distance_km: metric("treadmill_distance_km", item.treadmill_distance_km),
      treadmill_duration_minutes: metric("treadmill_duration_minutes", item.treadmill_duration_minutes),
      sleep_hours: metric("sleep_hours", item.sleep_hours),
      duration_minutes: metric("duration_minutes", item.duration_minutes),
      mood_score: metric("mood_score", item.mood_score),
      energy_score: metric("energy_score", item.energy_score),
      intensity_score: metric("intensity_score", item.intensity_score),
    };
    records.push(normalized);
  }
  return {
    reply: shortString(root.reply, 600) ||
      (records.length ? "Review these suggested records." : "No confirmed activities detected."),
    follow_up_question: shortString(root.follow_up_question, 300) || null,
    proposed_records: records,
  };
}
