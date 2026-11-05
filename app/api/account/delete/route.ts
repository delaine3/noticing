import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failure(message: string, status: number) {
  return NextResponse.json({ error: message }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  // Same-origin check prevents cross-site forms from triggering destructive actions.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return failure("Invalid request origin.", 403);
  try {
    if (new URL(origin).host !== host) return failure("Invalid request origin.", 403);
  } catch {
    return failure("Invalid request origin.", 403);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
    return failure("JSON required.", 415);
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 4096) return failure("Request too large.", 413);
  const input: unknown = await request.json().catch(() => null);
  if (!input || typeof input !== "object" || Array.isArray(input))
    return failure("Invalid request.", 400);
  const body = input as Record<string, unknown>;
  if (body.confirmation !== "DELETE MY ACCOUNT" ||
      typeof body.password !== "string" || !body.password || body.password.length > 1024)
    return failure("Password and exact confirmation are required.", 400);

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || !user || !user.email) return failure("Sign in first.", 401);
  if (user.email.toLowerCase() === "demo@noticing.com")
    return failure("The shared demo account cannot be deleted.", 403);

  // Reauthenticate with the account password immediately before deletion.
  // Never accept a client-supplied user ID or expose the service role key.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey)
    return failure("Account deletion is temporarily unavailable. Contact support.", 503);

  const verifier = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: verified, error: verifyError } =
    await verifier.auth.signInWithPassword({ email: user.email, password: body.password });
  if (verifyError || verified.user?.id !== user.id)
    return failure("Password verification failed. No account was deleted.", 403);

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Auth deletion cascades only where foreign keys are ON DELETE CASCADE.
  // Audit legacy tables and storage before deploying this endpoint.
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return failure("Deletion could not be completed. Your account may still exist. Contact support.", 500);
  }
  return NextResponse.json({ deleted: true }, {
    headers: { "Cache-Control": "no-store" },
  });
}
