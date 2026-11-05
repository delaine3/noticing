import { DailyLog, getDailyReport, getTimeBuckets } from "./lib/daily-rules";
import { TodayCommandCenter } from "./components/today-command-center/TodayCommandCenter";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./lib/supabase-server";
import type { SleepMoment } from "./lib/sleep-utils";
import { cookies } from "next/headers";
import { dayInTimeZone } from "./lib/local-day";
import { validateCheckIn, type CheckInValues } from "./lib/coaching";

export default async function Home() {
  const zone = (await cookies()).get("noticing_timezone")?.value;
  const today = dayInTimeZone(zone);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("action_date", today)
    .order("action_time", { ascending: true, nullsFirst: false })
    .order("occurred_at", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }

  const logs = (data ?? []) as DailyLog[];
  const report = getDailyReport(logs);
  const buckets = getTimeBuckets(logs);

  // A night spans two calendar dates. Read recent bedtime/wake events
  // independently of today's timeline, which contains only today's logs.
  const since = new Date(Date.parse(today + "T12:00:00Z") - 10 * 86400000).toISOString().slice(0, 10);
  const { data: moments, error: sleepError } = await supabase.from("logs")
    .select("id, log_type, action_date, action_time")
    .eq("user_id", user.id)
    .in("log_type", ["Bedtime", "Woke up"])
    .gte("action_date", since)
    .order("action_date", { ascending: true })
    .order("action_time", { ascending: true })
    .limit(200);
  if (sleepError) throw new Error(sleepError.message);

  const [{ data: pref }, { count: checkinCount }, { count: dueCount }, { data: latestCheckIn }] = await Promise.all([
    supabase.from("coaching_preferences")
      .select("fluid_goal_ml,fluid_restricted,all_drinks_logged,allow_checkin_invites,max_daily_invites")
      .eq("user_id", user.id).maybeSingle(),
    supabase.from("wellness_checkins")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", user.id).eq("local_date", today),
    supabase.from("coaching_interventions")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", user.id).eq("status", "accepted")
      .lte("follow_up_at", new Date().toISOString()),
    supabase.from("wellness_checkins")
      .select("recorded_at,energy,mood,stress,thought_topic,recently_ate,thirsty,physical_discomfort,overwhelmed,thought_actionable,rested")
      .eq("user_id", user.id).eq("local_date", today)
      .order("recorded_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return <TodayCommandCenter logs={logs} report={report} buckets={buckets}
    coaching={{
      fluidGoalMl: pref?.fluid_goal_ml ?? 1800,
      fluidRestricted: pref?.fluid_restricted ?? null,
      allDrinksLogged: pref?.all_drinks_logged ?? false,
      invitesEnabled: pref?.allow_checkin_invites ?? true,
      maxDailyInvites: pref?.max_daily_invites ?? 2,
      checkinCount: checkinCount ?? 0,
      pendingReviews: dueCount ?? 0,
      latestCheckIn: validateCheckIn(latestCheckIn) ? latestCheckIn as CheckInValues : null,
      lastCheckinAt: latestCheckIn?.recorded_at ?? null,
    }}
    sleepEvents={(moments ?? []) as SleepMoment[]} />;
}
