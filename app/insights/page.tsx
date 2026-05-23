import { InsightLog, InsightsDashboard } from "../components/InsightsDashboard";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../lib/supabase-server";

export default async function InsightsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("logs")
    .select("*")
    .eq("user_id", user.id)
    .order("action_date", { ascending: true, nullsFirst: false })
    .order("action_time", { ascending: true, nullsFirst: false })
    .order("occurred_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const logs = (data ?? []) as InsightLog[];

  return <InsightsDashboard logs={logs} />;
}
