import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../lib/supabase-server";
import { dayInTimeZone } from "../lib/local-day";
import { safeMonth, monthBounds, shiftMonth, type ThoughtRecord } from "../lib/thought-garden";
import { JournalDesk } from "./JournalDesk";

export default async function JournalPage({ searchParams }: {
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const cookieStore = await cookies();
  const zone = cookieStore.get("hoolayah_timezone")?.value;
  const today = dayInTimeZone(zone);
  const query = await searchParams;
  const month = safeMonth(typeof query.month === "string" ? query.month : undefined, today.slice(0, 7));
  const { start, next } = monthBounds(month);

  // Read old check-in thought_detail directly: no migration or data copy
  // is needed to recover earlier saved reflections in the Journal UI.
  const [checkins, notes] = await Promise.all([
    supabase.from("wellness_checkins")
      .select("id,local_date,recorded_at,energy,mood,stress,thought_topic,thought_detail")
      .eq("user_id", user.id).gte("local_date", start).lt("local_date", next)
      .order("recorded_at", { ascending: false }).limit(500),
    supabase.from("journal_entries")
      .select("id,entry_date,title,body,status,origin,updated_at")
      .eq("user_id", user.id).gte("entry_date", start).lt("entry_date", next)
      .order("updated_at", { ascending: false }).limit(500),
  ]);

  const entries: ThoughtRecord[] = [
    ...(checkins.data ?? []).map((item) => ({
      id: item.id,
      kind: "checkin" as const,
      title: "A check-in reflection",
      body: item.thought_detail ?? "",
      entryDate: item.local_date,
      recordedAt: item.recorded_at,
      topic: item.thought_topic,
      status: "saved" as const,
      mood: item.mood,
      energy: item.energy,
      stress: item.stress,
    })),
    ...(notes.data ?? []).map((item) => ({
      id: item.id,
      kind: "journal" as const,
      title: item.title,
      body: item.body,
      entryDate: item.entry_date,
      recordedAt: item.updated_at,
      topic: "journal",
      status: item.status as "saved" | "draft",
    })),
  ].sort((a, b) => b.entryDate.localeCompare(a.entryDate) ||
    b.recordedAt.localeCompare(a.recordedAt));

  const journalReady = !notes.error;
  const prev = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);
  const maxMonth = today.slice(0, 7);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f8868]">
          Hoolayah · Your personal diary
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#284f3b] sm:text-5xl">
          The Thought Garden 🌷
        </h1>
        <p className="mt-3 max-w-2xl text-[#556a59]">
          Write what&apos;s on your mind, and come back to it whenever you like.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/check-in" className="secondary-button">Wellness check-in</Link>
          <Link href="/coaching/settings" className="secondary-button">Check-in preferences</Link>
          <Link href="/" className="secondary-button">Today</Link>
        </div>
        {checkins.error ? (
          <p role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
            We couldn&apos;t load your check-ins right now. Please try again later.
          </p>
        ) : null}
        <nav className="my-6 flex items-center justify-between gap-3 rounded-2xl border border-[#d9e5d6] bg-white/70 p-3"
          aria-label="Journal month navigation">
          <Link className="secondary-button" href={`/journal?month=${prev}`} aria-label="Previous month">
            ← Previous
          </Link>
          <span className="text-center text-sm font-semibold text-[#2e6048]">{month}</span>
          {nextMonth <= maxMonth ? (
            <Link className="secondary-button" href={`/journal?month=${nextMonth}`} aria-label="Next month">
              Next →
            </Link>
          ) : <span className="px-4 text-sm text-[#829184]">Current month</span>}
        </nav>
        <JournalDesk month={month} today={today} entries={entries} journalReady={journalReady} />
        {(checkins.data?.length === 500 || notes.data?.length === 500) ? (
          <p className="mt-6 text-sm text-[#a45c4a]">
            Some older entries aren&apos;t shown here because this view is limited to 500 entries per type. They haven&apos;t been deleted.
          </p>
        ) : null}
      </div>
    </main>
  );
}
