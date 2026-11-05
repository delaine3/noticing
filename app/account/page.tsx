import Link from "next/link";
import { DeleteAccountForm } from "./DeleteAccountForm";
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
        <h1 className="text-3xl font-bold">Your data</h1>
        <p>You can edit or delete individual entries in Logs.</p>
        {demo ? (
          <p className="rounded-lg bg-amber-50 p-4 text-amber-950">
            This is a shared public demo. Do not enter private information. Export and account
            deletion are disabled for the demo account.
          </p>
        ) : (
          <>
            <p>Download a copy of your entries. It may contain private information, so keep it somewhere safe.</p>
            <a href="/api/account/export" className="submit-button inline-block">Export my data (JSON)</a>
            <DeleteAccountForm />
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
