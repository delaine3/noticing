import { supabase } from "./lib/supabase";
import { DailyLog, getDailyReport, getTimeBuckets } from "./lib/daily-rules";
import { TodayCommandCenter } from "./components/today-command-center/TodayCommandCenter";
import { redirect } from "next/navigation";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default async function Home() {
  const today = getTodayDate();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  const { data, error } = await supabase
    .from("logs")
    .select("*")
    .eq("action_date", today)
    .order("action_time", { ascending: true, nullsFirst: false })
    .order("occurred_at", { ascending: true })
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  const logs = (data ?? []) as DailyLog[];
  const report = getDailyReport(logs);
  const buckets = getTimeBuckets(logs);

  return <TodayCommandCenter logs={logs} report={report} buckets={buckets} />;
}
