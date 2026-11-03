import { actionTypes } from "./log-types";
import { insightAreas } from "./insight-categories";

export type CaptureType = (typeof actionTypes)[number];
export type AreaId = (typeof insightAreas)[number]["id"];

export type CaptureDraft = {
  id: string;
  log_type: CaptureType;
  title: string;
  notes: string;
  action_date: string;
  action_time: string;
  water_amount_ml: number | null;
  treadmill_distance_km: number | null;
  treadmill_duration_minutes: number | null;
  sleep_hours: number | null;
  duration_minutes: number | null;
  mood_score: number | null;
  energy_score: number | null;
  intensity_score: number | null;
  evidence: string;
  uncertainty: string;
  approved: boolean;
};

export type CaptureMessage = {
  role: "user" | "assistant";
  content: string;
};

export type CaptureAnalysis = {
  reply: string;
  follow_up_question: string | null;
  proposed_records: Omit<CaptureDraft, "id" | "approved">[];
};

const validTypes = new Set<string>(actionTypes);
const typeToArea = new Map<string, AreaId>();
insightAreas.forEach((area) => {
  area.types.forEach((name) => typeToArea.set(name, area.id));
});

export function areaForType(type: string): AreaId {
  return typeToArea.get(type) ?? "life";
}

export function captureTypeIsValid(value: unknown): value is CaptureType {
  return typeof value === "string" && validTypes.has(value);
}

export function validCaptureDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value &&
    date.getUTCFullYear() >= 2000 && date.getTime() <= Date.now() + 86400000;
}

export function validCaptureTime(value: string) {
  return value === "" || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export const optionalFields = [
  "water_amount_ml", "treadmill_distance_km", "treadmill_duration_minutes",
  "sleep_hours", "duration_minutes", "mood_score", "energy_score", "intensity_score",
] as const;
export type OptionalCaptureField = (typeof optionalFields)[number];

export const limits: Record<OptionalCaptureField, number> = {
  water_amount_ml: 5000,
  treadmill_distance_km: 100,
  treadmill_duration_minutes: 1440,
  sleep_hours: 24,
  duration_minutes: 1440,
  mood_score: 10,
  energy_score: 10,
  intensity_score: 10,
};

export function captureNumberValid(key: OptionalCaptureField, number: unknown): number is number | null {
  if (number === null) return true;
  if (typeof number !== "number" || !Number.isFinite(number)) return false;
  if (number < (["mood_score", "energy_score", "intensity_score"].includes(key) ? 1 : 0) ||
      number > limits[key]) return false;
  if (["mood_score", "energy_score", "intensity_score"].includes(key) && !Number.isInteger(number))
    return false;
  return true;
}

export function validCaptureDraft(draft: CaptureDraft): string | null {
  if (!captureTypeIsValid(draft.log_type)) return "Invalid activity type.";
  if (typeof draft.title !== "string" || !draft.title.trim() || draft.title.length > 160)
    return "Title must be 1–160 characters.";
  if (typeof draft.notes !== "string" || draft.notes.length > 1500)
    return "Notes must be no more than 1500 characters.";
  if (!validCaptureDate(draft.action_date)) return "Confirm the actual event date.";
  if (!validCaptureTime(draft.action_time)) return "Time must be HH:MM or blank.";
  for (const key of optionalFields) {
    if (!captureNumberValid(key, draft[key])) return "Invalid number for " + key + ".";
  }
  return null;
}
