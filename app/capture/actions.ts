"use server";

import { createSupabaseServerClient } from "../lib/supabase-server";
import { revalidatePath } from "next/cache";
import { type CaptureDraft, validCaptureDraft } from "../lib/capture-types";

type SaveResult = { saved: number; duplicates: number; errors: string[] };

export async function saveCaptureDrafts(items: CaptureDraft[]): Promise<SaveResult> {
  if (!Array.isArray(items) || items.length === 0 || items.length > 10) {
    return { saved: 0, duplicates: 0, errors: ["Select 1–10 approved records."] };
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { saved: 0, duplicates: 0, errors: ["Sign in first."] };

  let saved = 0;
  let duplicates = 0;
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const [i, item] of items.entries()) {
    if (!item || item.approved !== true || typeof item.id !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)) {
      errors.push("Record " + (i + 1) + ": requires individual approval and a valid identifier.");
      continue;
    }
    const problem = validCaptureDraft(item);
    if (problem) { errors.push("Record " + (i + 1) + ": " + problem); continue; }
    if (seen.has(item.id)) { duplicates++; continue; }
    seen.add(item.id);

    const marker = "[noticing-chat:" + item.id.toLowerCase() + "]";
    const { data: existing, error: lookupError } = await supabase.from("logs")
      .select("id").eq("user_id", user.id).like("notes", "%" + marker + "%").limit(1);
    if (lookupError) {
      errors.push("Record " + (i + 1) + ": could not check for duplicates.");
      continue;
    }
    if (existing?.length) { duplicates++; continue; }

    const prefixed = [
      item.sleep_hours !== null && item.log_type === "Sleep" ? "Hours slept: " + item.sleep_hours : null,
      item.duration_minutes !== null && item.log_type !== "Treadmill walk"
        ? "Duration minutes: " + item.duration_minutes : null,
      item.notes.trim(),
      marker,
    ].filter(Boolean).join("\n");
    const { error } = await supabase.from("logs").insert({
      user_id: user.id,
      log_type: item.log_type,
      category: item.log_type,
      title: item.title.trim(),
      notes: prefixed,
      action_date: item.action_date,
      action_time: item.action_time || null,
      water_amount_ml: item.log_type === "Water" || item.log_type === "Coffee" ? item.water_amount_ml : null,
      treadmill_distance_km: item.log_type === "Treadmill walk" ? item.treadmill_distance_km : null,
      treadmill_duration_minutes: item.log_type === "Treadmill walk" ? item.treadmill_duration_minutes : null,
      mood_score: item.mood_score,
      energy_score: item.energy_score,
      intensity_score: item.intensity_score,
      effect: null,
      meal_size: null,
      meal_source: null,
    });
    if (error) errors.push("Record " + (i + 1) + ": could not save (" + error.message + ").");
    else saved++;
  }

  if (saved) {
    revalidatePath("/");
    revalidatePath("/logs");
    revalidatePath("/insights");
  }
  return { saved, duplicates, errors };
}
