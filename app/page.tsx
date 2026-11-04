import { DailyLog, getDailyReport, getTimeBuckets } from "./lib/daily-rules";
import { TodayCommandCenter } from "./components/today-command-center/TodayCommandCenter";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./lib/supabase-server";
import type { SleepMoment } from "./lib/sleep-utils";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default async function Home() {
  const today = getTodayDate();
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
  const since = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10);
  const { data: moments, error: sleepError } = await supabase.from("logs")
    .select("id, log_type, action_date, action_time")
    .eq("user_id", user.id)
    .in("log_type", ["Bedtime", "Woke up"])
    .gte("action_date", since)
    .order("action_date", { ascending: true })
    .order("action_time", { ascending: true })
    .limit(200);
  if (sleepError) throw new Error(sleepError.message);

  return <TodayCommandCenter logs={logs} report={report} buckets={buckets}
    sleepEvents={(moments ?? []) as SleepMoment[]} />;
}
