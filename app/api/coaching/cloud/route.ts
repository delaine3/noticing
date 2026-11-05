import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase-server";
import { freeCloudConfigured, FREE_WORKERS_MODEL, cloudPrompt } from "../../../lib/free-cloud";
import { parseLocalCaptureResponse } from "../../../lib/local-capture-response";
import { actionTypes } from "../../../lib/log-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Optional Cloudflare Workers AI, never called from the regular check-in. */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const env = {
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_WORKERS_AI_TOKEN: process.env.CLOUDFLARE_WORKERS_AI_TOKEN,
    CLOUDFLARE_FREE_PLAN_CONFIRMED: process.env.CLOUDFLARE_FREE_PLAN_CONFIRMED,
  };
  if (!freeCloudConfigured(env)) {
    return NextResponse.json({
      error: "AI isn't available right now. You can still add entries.",
    }, { status: 503 });
  }

  const input: unknown = await request.json().catch(() => null);
  if (!input || typeof input !== "object" || Array.isArray(input))
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const body = input as Record<string, unknown>;
  if (body.consent !== true || typeof body.message !== "string" ||
      body.message.trim().length < 3 || body.message.length > 1000 ||
      typeof body.localDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.localDate)) {
    return NextResponse.json({
      error: "Confirm consent and supply one short message.",
    }, { status: 400 });
  }

  const { data: settings, error: settingsError } = await supabase
    .from("coaching_preferences")
    .select("cloud_enabled,cloud_consent_at")
    .eq("user_id", user.id).maybeSingle();
  if (settingsError || !settings?.cloud_enabled || !settings?.cloud_consent_at) {
    return NextResponse.json({
      error: "Turn on optional AI in check-in settings first.",
    }, { status: 403 });
  }

  // Atomic user-level daily cap. Free-plan service quotas may be even lower.
  const { data: permitted, error: quotaError } =
    await supabase.rpc("claim_free_coaching_cloud_request");
  if (quotaError || permitted !== true) {
    return NextResponse.json({
      error: "You've reached today's AI limit. You can still add entries.",
    }, { status: 429 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${env.CLOUDFLARE_WORKERS_AI_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: FREE_WORKERS_MODEL,
          messages: [
            { role: "system", content: cloudPrompt(body.localDate) },
            { role: "user", content: body.message },
          ],
          temperature: 0.1,
          max_completion_tokens: 650,
          store: false,
        }),
        cache: "no-store",
      },
    );
    if (!response.ok) {
      return NextResponse.json({
        error: response.status === 429 || response.status === 403
          ? "AI isn't available right now. You can still add entries."
          : "AI didn't respond. You can still add your entry.",
      }, { status: response.status === 429 ? 429 : 502 });
    }
    const payload = await response.json() as {
      choices?: { message?: { content?: string } }[];
    };
    const result = payload.choices?.[0]?.message?.content;
    if (typeof result !== "string") throw new Error("Unexpected provider response.");
    const parsed = parseLocalCaptureResponse(result, actionTypes);
    // Return only structured, validated proposals; no provider content is logged.
    return NextResponse.json({
      proposed_records: parsed.proposed_records.slice(0, 3),
      reply: parsed.reply,
      follow_up_question: parsed.follow_up_question,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({
      error: "AI didn't respond. No charges were made by Noticing.",
    }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
