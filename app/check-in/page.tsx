import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../lib/supabase-server";
import { dayInTimeZone } from "../lib/local-day";
import { CheckInFlow } from "./CheckInFlow";
import { FollowUpReview, type DueCoachingAction } from "./FollowUpReview";

export default async function CheckInPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const zone = (await cookies()).get("noticing_timezone")?.value;
  const date = dayInTimeZone(zone);

  const { data: due, error } = await supabase.from("coaching_interventions")
    .select("id,title,benefit,follow_up_at")
    .eq("user_id", user.id)
    .eq("status", "accepted")
    .lte("follow_up_at", new Date().toISOString())
    .order("follow_up_at", { ascending: true })
    .limit(3);
  const { data: preference } = await supabase.from("coaching_preferences")
    .select("fluid_restricted").eq("user_id", user.id).maybeSingle();
  const notInstalled = error?.code === "42P01" || error?.code === "PGRST205";

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--leaf-dark)]">
          Noticing · Check-in
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">How are you doing right now?</h1>
        <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">
          Take a moment to check in with yourself. Skip anything you don't want to answer.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/coaching/settings" className="secondary-button">My coaching preferences</Link>
          <Link href="/" className="secondary-button">Today</Link>
        </div>
        {notInstalled ? (
          <section className="glass-card mt-5 p-5">
            <h2 className="font-semibold">Check-ins are unavailable</h2>
            <p className="mt-2 text-sm">We couldn't load check-ins right now. Please try again later.</p>
          </section>
        ) : null}
        {(due ?? []).map((action) => (
          <FollowUpReview key={action.id} action={action as DueCoachingAction} />
        ))}
        <CheckInFlow localDate={date} fluidRestricted={preference?.fluid_restricted ?? null} />
      </div>
    </main>
  );
}
