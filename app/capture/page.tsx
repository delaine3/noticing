import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "../lib/supabase-server";
import CaptureChat from "./CaptureChat";

export default async function CapturePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const configured = Boolean(process.env.OPENAI_API_KEY && process.env.CAPTURE_ALLOWED_USER_IDS);
  return (
    <main className="min-h-screen px-4 py-8 text-[var(--ink)] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--leaf-dark)]">Noticing · Conversational capture</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">Tell Noticing about your day</h1>
        <p className="mt-3 max-w-3xl text-[var(--ink-soft)]">
          Talk instead of filling out repetitive forms. AI can extract potential activities, ask for
          missing facts and suggest how to record them. You decide what gets saved.
        </p>
        {!configured ? (
          <div role="status" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            AI capture is not configured on this deployment. Set server-side OPENAI_API_KEY and
            CAPTURE_ALLOWED_USER_IDS to enable it. No messages can be processed until then.
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/import/chat" className="secondary-button">Import past ChatGPT conversations</Link>
          <Link href="/insights" className="secondary-button">View your insights</Link>
        </div>
        <CaptureChat />
      </div>
    </main>
  );
}
