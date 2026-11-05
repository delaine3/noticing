import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../lib/supabase-server";

export const metadata = { title: "Your Data | Noticing" };
export const dynamic = "force-dynamic";

export default async function AccountDataPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const demo = user.email?.toLowerCase() === "demo@noticing.com";
  return (
    <main className="min-h-[75vh] px-4 py-10">
      <section className="glass-card mx-auto max-w-3xl space-y-5 p-6">
        <h1 className="text-3xl font-bold">Your data and privacy controls</h1>
        <p>Your journal belongs to you. You can correct and delete individual logs in the Logs section.</p>
        {demo ? (
          <p className="rounded-lg bg-amber-50 p-4 text-amber-950">
            This is a shared public demo. Do not enter private information. Export and account
            deletion are disabled for the demo account.
          </p>
        ) : (
          <>
            <p>Download a JSON copy of the records currently accessible through your account.
              The export contains potentially sensitive information. Store it securely.</p>
            <a href="/api/account/export" className="submit-button inline-block">Export my data (JSON)</a>
            <p>
              To request account closure and deletion of account data, email{" "}
              <a className="underline" href="mailto:delaineabner3@gmail.com?subject=Noticing%20account%20deletion%20request">
                delaineabner3@gmail.com
              </a> from your registered address. We will verify the request and explain
              the deletion process and any remaining provider backup retention.
              <strong> This request is not instant or automatic.</strong>
            </p>
          </>
        )}
        <p className="text-sm text-[var(--ink-soft)]">
          See <Link className="underline" href="/privacy">Privacy</Link> and{" "}
          <Link className="underline" href="/safety">Safety</Link>.
        </p>
      </section>
    </main>
  );
}
