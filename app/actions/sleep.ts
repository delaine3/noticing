"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "../lib/supabase-server";
import { validCaptureDate, validCaptureTime } from "../lib/capture-types";
import { getSleepNightStatus, type SleepMoment } from "../lib/sleep-utils";

type MomentKind = "Bedtime" | "Woke up";
type Result = { ok: boolean; message: string };

export async function saveSleepMoment(
  kind: MomentKind,
  localDate: string,
  localTime: string,
): Promise<Result> {
  if ((kind !== "Bedtime" && kind !== "Woke up") ||
      !validCaptureDate(localDate) || !validCaptureTime(localTime) || !localTime) {
    return { ok: false, message: "Your device date or time was invalid. Check it and try again." };
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in to save this entry." };

  // A current sleep period is built from durable bedtime and wake events,
  // not from a guessed number of sleep hours.
  const earliest = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10);
  const { data, error } = await supabase.from("logs")
    .select("id, log_type, action_date, action_time")
    .eq("user_id", user.id)
    .in("log_type", ["Bedtime", "Woke up"])
    .gte("action_date", earliest)
    .order("action_date", { ascending: true })
    .order("action_time", { ascending: true })
    .limit(200);
  if (error) return { ok: false, message: "Could not check existing sleep entries." };

  const events = (data ?? []) as SleepMoment[];
  const sameMinute = events.find((item) =>
    item.log_type === kind && item.action_date === localDate &&
    item.action_time?.slice(0, 5) === localTime);
  if (sameMinute) return { ok: true, message: "That time was already recorded." };

  const state = getSleepNightStatus(events);
  if (kind === "Bedtime" && state.pendingBedtime) {
    return { ok: false, message: "A bedtime is already recorded without a wake-up. Record waking up or correct the existing log first." };
  }
  if (kind === "Woke up" && !state.pendingBedtime) {
    return { ok: false, message: "No unfinished bedtime was found. You can record a wake-up through a normal log." };
  }
  const title = kind === "Bedtime" ? "Getting ready for bed" : "Woke up";
  const notes = kind === "Bedtime"
    ? "Going to bed. This is not confirmation of time asleep."
    : "Wake time recorded. Bedtime and waking estimate time in bed, not hours actually asleep.";
  const { error: insertError } = await supabase.from("logs").insert({
    user_id: user.id,
    log_type: kind,
    category: kind,
    title, notes,
    action_date: localDate,
    action_time: localTime,
  });
  if (insertError) return { ok: false, message: "Could not record this event. No new sleep entry was saved." };

  revalidatePath("/");
  revalidatePath("/logs");
  revalidatePath("/insights");
  return {
    ok: true,
    message: kind === "Bedtime"
      ? "Bedtime noted. When you wake, Noticing can record that time too. Good night 🌙"
      : "Wake time saved. Noticing will show time in bed separately from actual sleep.",
  };
}
