import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase-server";
import type { InsightLog } from "./log-types";

// Supabase has a default row limit. Keep this intentional and disclose it in UI.
// A later iteration can use cursor pagination for a larger history window.
export const INSIGHT_LOG_LIMIT = 500;

export async function getInsightLogs(): Promise<InsightLog[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("logs")
    .select("*")
    .eq("user_id", user.id)
    .order("action_date", { ascending: false, nullsFirst: false })
    .order("action_time", { ascending: false, nullsFirst: false })
    .order("occurred_at", { ascending: false })
    .limit(INSIGHT_LOG_LIMIT);

  if (error) throw new Error(error.message);
  return (data ?? []) as InsightLog[];
}
