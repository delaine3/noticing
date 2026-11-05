import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";
import { freeCloudConfigured } from "../../../../lib/free-cloud";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ enabled: false }, { status: 401 });
  if (!freeCloudConfigured({
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_WORKERS_AI_TOKEN: process.env.CLOUDFLARE_WORKERS_AI_TOKEN,
    CLOUDFLARE_FREE_PLAN_CONFIRMED: process.env.CLOUDFLARE_FREE_PLAN_CONFIRMED,
  })) return NextResponse.json({ enabled: false }, { headers: { "Cache-Control": "no-store" } });

  const { data } = await supabase.from("coaching_preferences")
    .select("cloud_enabled,cloud_consent_at")
    .eq("user_id", user.id).maybeSingle();
  return NextResponse.json({
    enabled: data?.cloud_enabled === true && Boolean(data?.cloud_consent_at),
  }, { headers: { "Cache-Control": "no-store" } });
}
