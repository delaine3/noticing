import { LogNotes } from "../../components/LogNotes";
import { getLogDisplayTitle } from "../../lib/log-title";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getInsightArea,
  getInsightAreaLogs,
  insightAreas,
  getLogDate,
  formatLogDate,
} from "../../lib/insight-categories";
import { getInsightLogs, INSIGHT_LOG_LIMIT } from "../../lib/insights-data";
import { analyzeArea } from "../../lib/insight-analysis";
import type { InsightLog } from "../../lib/log-types";
import { ScoreTrendChart } from "../../components/ScoreTrendChart";
import { FirstMealAudit } from "../../components/FirstMealAudit";
import { Treadmill } from "../../components/Treadmill";
import { createSupabaseServerClient } from "../../lib/supabase-server";

type Props = { params: Promise<{ category: string }> };

function logUrl(href: string, category: string) {
  const separator = href.includes("?") ? "&" : "?";
  return (
    href + separator + "returnTo=" + encodeURIComponent("/insights/" + category)
  );
}

function describe(log: InsightLog) {
  if (log.log_type === "Treadmill walk" && log.treadmill_distance_km !== null)
    return (
      log.treadmill_distance_km +
      " km" +
      (log.treadmill_duration_minutes !== null
        ? " · " + log.treadmill_duration_minutes + " min"
        : "")
    );
  if (log.water_amount_ml !== null) return log.water_amount_ml + " ml";
  const ratings = [
    log.mood_score !== null ? "Mood " + log.mood_score + "/10" : null,
    log.energy_score !== null ? "Energy " + log.energy_score + "/10" : null,
    log.intensity_score !== null
      ? "Intensity " + log.intensity_score + "/10"
      : null,
  ].filter(Boolean);
  return ratings.join(" · ");
}

export default async function InsightCategoryPage({ params }: Props) {
  const { category } = await params;
  const area = getInsightArea(category);
  if (!area) notFound();
  const all = await getInsightLogs();
  const logs = getInsightAreaLogs(all, area.id);
  const { metrics, findings } = analyzeArea(area.id, logs);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [checkinsResult, outcomesResult] = category === "mind" && user
    ? await Promise.all([
        supabase.from("wellness_checkins")
          .select("id,local_date,energy,mood,stress,thought_topic")
          .eq("user_id", user.id).order("recorded_at", { ascending: false }).limit(12),
        supabase.from("coaching_outcomes")
          .select("tried,helped")
          .eq("user_id", user.id).order("reviewed_at", { ascending: false }).limit(50),
      ])
    : [{ data: null }, { data: null }];
  const wellnessCheckins = checkinsResult.data ?? [];
  const wellnessOutcomes = outcomesResult.data ?? [];
  const triedOutcomes = wellnessOutcomes.filter((item) => item.tried === true);
  const helpedOutcomes = triedOutcomes.filter((item) => item.helped === true);

  const recent = [...logs]
    .sort((a, b) =>
      (getLogDate(b) + (b.action_time ?? "")).localeCompare(
        getLogDate(a) + (a.action_time ?? ""),
      ),
    )
    .slice(0, 6);

  return (
    <main className="min-h-screen px-4 py-8 text-[var(--ink)] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/insights"
          className="text-sm font-semibold text-[var(--leaf-dark)] hover:underline"
        >
          ← Back to insights
        </Link>
        <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-[var(--leaf-dark)]">
          Insights / {area.title}
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-5xl">{area.title}</h1>
        <p className="mt-3 max-w-3xl text-[var(--ink-soft)]">{area.question}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {insightAreas.map((other) => (
            <Link
              key={other.id}
              href={`/insights/${other.id}`}
              aria-current={other.id === area.id ? "page" : undefined}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${other.id === area.id ? "border-[var(--leaf-dark)] bg-[var(--leaf-dark)] text-white" : "border-[var(--border-soft)] bg-white/60 hover:bg-white"}`}
            >
              {other.title}
            </Link>
          ))}
        </div>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <article key={metric.label} className="glass-card p-5">
              <h2 className="text-sm font-semibold text-[var(--ink-soft)]">
                {metric.label}
              </h2>
              <p className="mt-2 text-3xl font-bold">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                {metric.detail}
              </p>
            </article>
          ))}
        </section>

        {category === "mind" ? (
          <section className="mt-6 glass-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Your wellness check-ins</h2>
              <div className="flex flex-wrap gap-2">
                <Link href="/journal" className="secondary-button">Read your reflections 🌷</Link>
                <Link href="/check-in" className="submit-button">Check in</Link>
              </div>
            </div>
            {wellnessCheckins.length ? (
              <>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  {wellnessCheckins.length} recent check-ins. {helpedOutcomes.length} of
                  {" "}{triedOutcomes.length} reviewed suggestions were rated helpful.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {wellnessCheckins.slice(0, 6).map((item) => (
                    <article key={item.id} className="rounded-lg border border-[var(--border-soft)] bg-white/70 p-3 text-sm">
                      <p className="font-semibold">{item.local_date}</p>
                      <p className="mt-1">Energy {item.energy}/5 · Mood {item.mood}/5 · Stress {item.stress}/5</p>
                      <p className="mt-1 text-[var(--ink-soft)]">Thoughts: {item.thought_topic.replaceAll("_", " ")}</p>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                Check in to start seeing how your mood, energy and stress develop over time.
              </p>
            )}
          </section>
        ) : null}

        <section className="mt-7 glass-card">
          <h2 className="text-2xl font-bold">
            What stands out
          </h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {findings.map((item) => (
              <article className="glass-card p-5" key={item.title}>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="mt-3 text-[var(--ink-soft)]">{item.detail}</p>
                <Link
                  className="submit-button mt-5 inline-block"
                  href={logUrl(item.href, category)}
                >
                  {item.next}
                </Link>
              </article>
            ))}
          </div>
        </section>

        {category === "body" && logs.length > 0 ? (
          <div className="mt-7 space-y-5">
            <FirstMealAudit logs={logs} />
            <Treadmill logs={logs} />
          </div>
        ) : null}
        {category === "mind" && logs.length > 0 ? (
          <ScoreTrendChart logs={logs} />
        ) : null}

        <section className="mt-8 glass-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Recent entries</h2>
            <Link
              href={logUrl(
                `/logs/new?type=${encodeURIComponent(area.logType)}`,
                category,
              )}
              className="secondary-button"
            >
              Add an entry
            </Link>
          </div>
          {recent.length ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {recent.map((log) => (
                <article key={log.id} className="glass-card p-5">
                  <p className="text-sm text-[var(--ink-soft)]">
                    {formatLogDate(getLogDate(log))} · {log.log_type}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">
                    {getLogDisplayTitle(log)}
                  </h3>
                  {describe(log) ? (
                    <p className="mt-2 text-sm font-semibold">
                      {describe(log)}
                    </p>
                  ) : null}
                  <LogNotes
                    notes={log.notes}
                    className="mt-2 whitespace-pre-wrap break-words text-sm text-[var(--ink-soft)]"
                  />
                  <Link
                    href={`/logs/${log.id}/edit`}
                    className="mt-3 inline-block text-sm font-semibold text-[var(--leaf-dark)] hover:underline"
                  >
                    Edit entry →
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="glass-card mt-3 p-5">
              <p>No entries for this area yet. {area.recordPrompt}</p>
              <Link
                href={`/logs/new?type=${encodeURIComponent(area.logType)}`}
                className="submit-button mt-4 inline-block"
              >
                Add an entry
              </Link>
            </div>
          )}
        </section>
        <p className="mt-7 text-sm text-[var(--ink-soft)]">
          {logs.length} records in this area, from up to {INSIGHT_LOG_LIMIT}{" "}
          recent entries across your account.
        </p>
      </div>
    </main>
  );
}
