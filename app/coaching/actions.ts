"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "../lib/supabase-server";
import { recommendNextAction, validateCheckIn, type CheckInValues } from "../lib/coaching";

export type CoachingResult = { ok: boolean; message: string; id?: string };

function isDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(date + "T12:00:00Z");
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return false;
  return Math.abs(Date.now() - parsed.getTime()) < 8 * 86400000;
}
function isUuid(value: string) {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
}
function problem(error: { code?: string; message?: string } | null, fallback: string) {
  if (error?.code === "42P01" || error?.code === "PGRST205")
    return "Coaching storage has not been installed yet. Run the SQL migration in Supabase first.";
  return fallback;
}

export async function saveWellnessCheckIn(payload: {
  values: CheckInValues;
  requestKey: string;
  localDate: string;
  followUp: boolean;
}): Promise<CoachingResult> {
  if (!payload || !validateCheckIn(payload.values) ||
      typeof payload.requestKey !== "string" || !isUuid(payload.requestKey) ||
      typeof payload.localDate !== "string" || !isDate(payload.localDate) ||
      typeof payload.followUp !== "boolean") {
    return { ok: false, message: "Check the scores and date before saving." };
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in to save a check-in." };

  // requestKey makes retries safe after a slow request.
  const { data: previouslySaved } = await supabase.from("wellness_checkins")
    .select("id").eq("user_id", user.id).eq("request_key", payload.requestKey).maybeSingle();
  if (previouslySaved?.id) return { ok: true, id: previouslySaved.id, message: "This check-in is already saved." };

  const v = payload.values;
  const { data: saved, error } = await supabase.from("wellness_checkins").insert({
    user_id: user.id,
    request_key: payload.requestKey,
    local_date: payload.localDate,
    energy: v.energy,
    mood: v.mood,
    stress: v.stress,
    thought_topic: v.thought_topic,
    thought_detail: v.thought_detail?.trim() || null,
    recently_ate: v.recently_ate,
    thirsty: v.thirsty,
    physical_discomfort: v.physical_discomfort,
    overwhelmed: v.overwhelmed,
    thought_actionable: v.thought_actionable,
    rested: v.rested,
  }).select("id").single();

  if (error || !saved) {
    if (error?.code === "23505") return {
      ok: true, message: "This check-in was already submitted.",
    };
    return { ok: false, message: problem(error, "Couldn't save the check-in. Please try again.") };
  }
  const { data: preference } = await supabase.from("coaching_preferences")
    .select("fluid_restricted").eq("user_id", user.id).maybeSingle();
  const suggestion = recommendNextAction(v, { fluidRestricted: preference?.fluid_restricted ?? null });
  const { error: suggestionError } = await supabase.from("coaching_interventions").insert({
    user_id: user.id,
    checkin_id: saved.id,
    action_code: suggestion.code,
    title: suggestion.title,
    benefit: suggestion.benefit,
    status: payload.followUp ? "accepted" : "offered",
    follow_up_at: payload.followUp ? new Date(Date.now() + 60 * 60000).toISOString() : null,
  });
  revalidatePath("/");
  revalidatePath("/check-in");
  revalidatePath("/insights");
  return {
    ok: true,
    id: saved.id,
    message: suggestionError
      ? "Check-in saved. The follow-up could not be scheduled; you can review your check-in later."
      : "Check-in saved." + (payload.followUp ? " I'll ask whether the suggestion helped when you return after an hour." : ""),
  };
}

export async function recordCoachingOutcome(payload: {
  interventionId: string;
  tried: boolean | null;
  helped: boolean | null;
  energyAfter: number | null;
  moodAfter: number | null;
}): Promise<CoachingResult> {
  if (!payload || !isUuid(String(payload.interventionId)) ||
      !([true, false, null] as unknown[]).includes(payload.tried) ||
      !([true, false, null] as unknown[]).includes(payload.helped) ||
      ![payload.energyAfter, payload.moodAfter].every((n) =>
        n === null || (Number.isInteger(n) && n >= 1 && n <= 5))) {
    return { ok: false, message: "Please review your answers." };
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in first." };

  const { data: intervention, error: readError } = await supabase.from("coaching_interventions")
    .select("id, status, follow_up_at").eq("id", payload.interventionId)
    .eq("user_id", user.id).maybeSingle();
  if (readError || !intervention) return { ok: false, message: "This follow-up isn't available." };
  if (intervention.status !== "accepted")
    return { ok: false, message: "This follow-up has already been handled." };
  if (intervention.follow_up_at && new Date(intervention.follow_up_at).getTime() > Date.now())
    return { ok: false, message: "This follow-up isn't due yet." };

  const { error } = await supabase.from("coaching_outcomes").insert({
    user_id: user.id,
    intervention_id: payload.interventionId,
    tried: payload.tried, helped: payload.helped,
    energy_after: payload.energyAfter, mood_after: payload.moodAfter,
  });
  if (error) {
    if (error.code === "23505") return { ok: true, message: "Already reviewed." };
    return { ok: false, message: problem(error, "Couldn't save the follow-up.") };
  }
  await supabase.from("coaching_interventions").update({ status: "reviewed" })
    .eq("id", payload.interventionId).eq("user_id", user.id);
  revalidatePath("/");
  revalidatePath("/check-in");
  return { ok: true, message: "Recorded. Noticing will use your feedback when reviewing what tends to help." };
}

export async function saveCoachingPreferences(payload: {
  fluidGoalMl: number;
  fluidRestricted: boolean | null;
  allDrinksLogged: boolean;
  allowInvites: boolean;
  cloudEnabled: boolean;
  cloudConsent: boolean;
}): Promise<CoachingResult> {
  if (!payload || !Number.isInteger(payload.fluidGoalMl) ||
      payload.fluidGoalMl < 1200 || payload.fluidGoalMl > 4000 ||
      ![null, true, false].includes(payload.fluidRestricted) ||
      typeof payload.allDrinksLogged !== "boolean" ||
      typeof payload.allowInvites !== "boolean" ||
      typeof payload.cloudEnabled !== "boolean" ||
      (payload.cloudEnabled && payload.cloudConsent !== true)) {
    return { ok: false, message: "Check your preferences and cloud permission before saving." };
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in first." };

  const { error } = await supabase.from("coaching_preferences").upsert({
    user_id: user.id,
    fluid_goal_ml: payload.fluidGoalMl,
    fluid_restricted: payload.fluidRestricted,
    all_drinks_logged: payload.allDrinksLogged,
    allow_checkin_invites: payload.allowInvites,
    cloud_enabled: payload.cloudEnabled,
    cloud_consent_at: payload.cloudEnabled ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) return { ok: false, message: problem(error, "Couldn't save preferences.") };
  revalidatePath("/");
  revalidatePath("/check-in");
  revalidatePath("/coaching/settings");
  return { ok: true, message: "Preferences saved." };
}
