import { supabase } from "../lib/supabase";
import { InsightLog, InsightsDashboard } from "../components/InsightsDashboard";

export default async function InsightsPage() {
  const { data, error } = await supabase
    .from("logs")
    .select("*")
    .order("action_date", { ascending: true, nullsFirst: false })
    .order("action_time", { ascending: true, nullsFirst: false })
    .order("occurred_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const logs = (data ?? []) as InsightLog[];

  return <InsightsDashboard logs={logs} />;
}
