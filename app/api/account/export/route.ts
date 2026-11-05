import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const tables = [
  "profiles", "logs", "strength_sets", "coaching_preferences",
  "wellness_checkins", "coaching_interventions", "coaching_outcomes",
  "coaching_cloud_usage",
] as const;

async function fetchAll(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  table: string, userId: string) {
  const rows: Record<string, unknown>[] = [];
  const batch = 500;
  for (let from = 0; from < 100000; from += batch) {
    const column = table === "profiles" ? "id" : "user_id";
    const result = await supabase.from(table).select("*").eq(column, userId)
      .range(from, from + batch - 1);
    if (result.error) {
      if (result.error.code === "42P01" || result.error.code === "PGRST205") return { rows: [], unavailable: true };
      throw new Error("Could not export " + table + ".");
    }
    const next = (result.data ?? []) as Record<string, unknown>[];
    rows.push(...next);
    if (next.length < batch) return { rows, unavailable: false };
  }
  throw new Error("Export exceeds safety limit. Contact support for a complete copy.");
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (user.email?.toLowerCase() === "demo@noticing.com")
    return NextResponse.json({ error: "Shared demo data cannot be exported." }, { status: 403 });

  try {
    const records: Record<string, unknown> = {};
    const unavailable: string[] = [];
    for (const table of tables) {
      const result = await fetchAll(supabase, table, user.id);
      records[table] = result.rows;
      if (result.unavailable) unavailable.push(table);
    }
    const payload = JSON.stringify({
      exported_at: new Date().toISOString(),
      account: { id: user.id, email: user.email, created_at: user.created_at },
      records, unavailable_tables: unavailable,
      note: "This export covers listed Noticing tables; provider metadata and backups are not included.",
    }, null, 2);
    return new Response(payload, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="noticing-data.json"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Export could not be completed. Contact the privacy address." },
      { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
