"use server";

import { createSupabaseServerClient } from "../../lib/supabase-server";
import { IMPORT_TYPES, type ImportType } from "../../lib/chat-import";

type ApprovedItem = {
  fingerprint: string;
  logType: ImportType;
  title: string;
  notes: string;
  eventDate: string;
  waterMl?: number;
  distanceKm?: number;
  durationMinutes?: number;
  sleepHours?: number;
};

export type ImportResult = {
  saved: number;
  duplicates: number;
  errors: string[];
};

function validDate(v: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const date = new Date(v + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === v &&
    date.getUTCFullYear() >= 2000 && date.getTime() <= Date.now() + 86400000;
}

function bounded(v: number | undefined, max: number) {
  return v === undefined || (typeof v === "number" && Number.isFinite(v) && v > 0 && v <= max);
}

const allowedTypes = new Set<string>(IMPORT_TYPES.map((item) => item.value));

export async function saveApprovedConversationItems(items: ApprovedItem[]): Promise<ImportResult> {
  if (!Array.isArray(items) || items.length === 0 || items.length > 25) {
    return { saved: 0, duplicates: 0, errors: ["Select 1–25 approved entries per batch."] };
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { saved: 0, duplicates: 0, errors: ["Sign in to import entries."] };
  }

  let saved = 0;
  let duplicates = 0;
  const errors: string[] = [];
  const batchIds = new Set<string>();

  for (const [index, item] of items.entries()) {
    if (!item || !allowedTypes.has(item.logType) ||
        typeof item.fingerprint !== "string" || !/^[a-f0-9]{64}$/.test(item.fingerprint) ||
        typeof item.title !== "string" || !item.title.trim() || item.title.length > 120 ||
        typeof item.notes !== "string" || item.notes.length > 1500 ||
        typeof item.eventDate !== "string" || !validDate(item.eventDate) ||
        !bounded(item.waterMl, 5000) || !bounded(item.distanceKm, 100) ||
        !bounded(item.durationMinutes, 1440) || !bounded(item.sleepHours, 24)) {
      errors.push("Entry " + (index + 1) + ": invalid or incomplete fields. Check date and measurements.");
      continue;
    }
    if (batchIds.has(item.fingerprint)) { duplicates++; continue; }
    batchIds.add(item.fingerprint);

    const marker = "[noticing-import:" + item.fingerprint + "]";
    const { data: prior, error: lookupError } = await supabase.from("logs")
      .select("id").eq("user_id", user.id).like("notes", "%" + marker + "%").limit(1);
    if (lookupError) {
      errors.push("Entry " + (index + 1) + ": could not check for a previous import.");
      continue;
    }
    if (prior?.length) { duplicates++; continue; }

    const metrics = [
      item.sleepHours !== undefined && item.logType === "Sleep"
        ? "Hours slept: " + item.sleepHours : null,
      item.durationMinutes !== undefined && item.logType !== "Treadmill walk"
        ? "Duration minutes: " + item.durationMinutes : null,
    ].filter(Boolean);
    const notes = [...metrics, item.notes.trim(), "Approved from ChatGPT export.", marker]
      .filter(Boolean).join("\n");

    const { error } = await supabase.from("logs").insert({
      user_id: user.id,
      log_type: item.logType,
      category: item.logType,
      title: item.title.trim(),
      notes,
      action_date: item.eventDate,
      action_time: null,
      effect: null,
      water_amount_ml: item.logType === "Water" ? (item.waterMl ?? null) : null,
      treadmill_distance_km: item.logType === "Treadmill walk" ? (item.distanceKm ?? null) : null,
      treadmill_duration_minutes: item.logType === "Treadmill walk" ? (item.durationMinutes ?? null) : null,
      mood_score: null,
      energy_score: null,
      intensity_score: null,
    });
    if (error) errors.push("Entry " + (index + 1) + ": failed to save. " + error.message);
    else saved++;
  }

  return { saved, duplicates, errors };
}
