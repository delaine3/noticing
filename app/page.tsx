import Link from "next/link";
import { supabase } from "./lib/supabase";
import {
  DailyLog,
  getDailyReport,
  getEffectEmoji,
  getTimeBuckets,
} from "./lib/daily-rules";

const quickActions = [
  { label: "I woke up", href: "/logs/new?type=Woke%20up" },
  { label: "I ate", href: "/logs/new?type=First%20meal" },
  { label: "I drank water", href: "/logs/new?type=Water" },
  { label: "I got sunlight", href: "/logs/new?type=Sunlight" },
  { label: "I moved", href: "/logs/new?type=Movement" },
  { label: "I’m spiraling", href: "/logs/new?type=Recurring%20thought" },
];

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getReportCardStyle(status: string) {
  if (status === "gold") return "border-amber-200 bg-amber-50";
  if (status === "check") return "border-emerald-200 bg-emerald-50";
  if (status === "warning") return "border-orange-200 bg-orange-50";
  if (status === "code-red") return "border-red-300 bg-red-50";
  if (status === "demerit") return "border-stone-300 bg-stone-100";
  return "border-stone-200 bg-white";
}

export default async function Home() {
  const today = getTodayDate();

  const { data, error } = await supabase
    .from("logs")
    .select("*")
    .eq("action_date", today)
    .order("action_time", { ascending: true, nullsFirst: false })
    .order("occurred_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const logs = (data ?? []) as DailyLog[];
  const report = getDailyReport(logs);
  const buckets = getTimeBuckets(logs);

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10 text-stone-950">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-700">
            Noticing
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Today’s command center
          </h1>

          <p className="mt-4 max-w-2xl text-stone-700">
            The day gets judged by evidence. Log the basics, check the report
            card, and do the next useful thing.
          </p>
        </div>

        <section className="rounded-3xl border border-emerald-200 bg-emerald-950 p-6 text-white shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-200">
            Next best action
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Start with food, water, light, and movement.
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-emerald-50">
            If the organism is under-maintained, the thoughts are unreliable
            witnesses. Handle the body first. Then reassess.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-emerald-950 hover:bg-emerald-50"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-700">
                Daily report card
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                The scoreboard does not care about excuses.
              </h2>
            </div>

            <Link
              href="/logs/new"
              className="rounded-full bg-emerald-800 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-900"
            >
              Log action
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {report.map((item) => (
              <article
                key={`${item.label}-${item.status}`}
                className={`rounded-2xl border p-4 ${getReportCardStyle(item.status)}`}
              >
                <div className="flex gap-3">
                  <span className="text-2xl">{item.emoji}</span>

                  <div>
                    <h3 className="font-semibold text-stone-950">
                      {item.label}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-stone-700">
                      {item.message}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-700">
            Timeline
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            What happened by checkpoint
          </h2>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {buckets.map((bucket) => (
              <section
                key={bucket.label}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
              >
                <h3 className="font-semibold text-stone-950">{bucket.label}</h3>

                {bucket.logs.length === 0 ? (
                  <p className="mt-3 text-sm text-stone-500">
                    Nothing logged here.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {bucket.logs.map((log) => (
                      <article
                        key={log.id}
                        className="rounded-2xl border border-stone-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-emerald-700">
                              {log.log_type} {getEffectEmoji(log.effect)}
                            </p>

                            <h4 className="mt-1 font-semibold text-stone-950">
                              {log.title || "Untitled action"}
                            </h4>
                          </div>

                          <p className="text-sm text-stone-500">
                            {log.action_time
                              ? log.action_time.slice(0, 5)
                              : "No time"}
                          </p>
                        </div>

                        {log.notes ? (
                          <p className="mt-3 text-sm leading-6 text-stone-700">
                            {log.notes}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
