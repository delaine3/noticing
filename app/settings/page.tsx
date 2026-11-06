import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../lib/supabase-server";
import { DeleteAccountForm } from "./DeleteAccountForm";

export const metadata = { title: "Settings | Hoolayah" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const demo = user.email?.toLowerCase() === "demo@noticing.com";

  return (
    <main className="min-h-[75vh] px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <section className="glass-card space-y-3 p-6">
          <h2 className="text-xl font-semibold">Your account</h2>
          <p className="text-sm text-[var(--ink-soft)]">{user.email}</p>
          <p>You can edit or delete individual entries in <Link href="/logs" className="underline">Logs</Link> or <Link href="/journal" className="underline">your journal</Link>.</p>
          <Link href="/coaching/settings" className="secondary-button inline-block">Check-in settings</Link>
        </section>
        <section className="glass-card space-y-2 p-6">
          <h2 className="text-xl font-semibold">Your private diary 🔒</h2>
          <p className="text-sm">
            Entries you save in the <Link href="/journal" className="underline">Thought Garden</Link>
            {" "}are locked on your device before being stored online. We can access saved records,
            but neither the owner nor the people running Hoolayah can read the protected words
            simply by opening those records.
          </p>
          <p className="text-sm">
            Your diary passphrase is separate from your sign-in password. We never receive
            the passphrase, the recovery code or the key that unlocks your writing. You can reset
            your diary passphrase yourself using the recovery code supplied when you secure
            your Thought Garden. If you lose both, no one can recover your encrypted writing.
          </p>
          <p className="text-xs text-[var(--ink-soft)]">
            This diary protection does not cover activity logs, check-in scores,
            account information or assistant messages.
            {" "}<Link href="/privacy" className="underline">See what stays private.</Link>
          </p>
        </section>
        {demo ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
            This is a shared demo account. Export and account deletion are unavailable here.
            Please don&apos;t save personal information in the demo.
          </p>
        ) : (
          <>
            <section className="glass-card space-y-3 p-6">
              <h2 className="text-xl font-semibold">Download your data</h2>
              <p>Save a copy of your entries as a JSON file. Keep it somewhere private.</p>
              <a href="/api/account/export" className="submit-button inline-block">Download my data</a>
            </section>
            <DeleteAccountForm />
          </>
        )}
        <p className="text-sm text-[var(--ink-soft)]">
          Read our <Link className="underline" href="/privacy">Privacy notice</Link> or <Link className="underline" href="/safety">Safety information</Link>.
        </p>
      </div>
    </main>
  );
}
