import { DailyLog, getDailyReport, getTimeBuckets } from "./lib/daily-rules";
import { TodayCommandCenter } from "./components/today-command-center/TodayCommandCenter";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./lib/supabase-server";

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
  console.log(user, "USER");

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

  return <TodayCommandCenter logs={logs} report={report} buckets={buckets} />;
}
