import Link from "next/link";
import { insightAreas, getInsightAreaLogs, getLoggedDays } from "../lib/insight-categories";
import { getInsightLogs, INSIGHT_LOG_LIMIT } from "../lib/insights-data";
import { analyzeArea } from "../lib/insight-analysis";

export default async function InsightsPage() {
  const logs = await getInsightLogs();
  return (
    <main className="min-h-screen px-4 py-8 text-[var(--ink)] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--leaf-dark)]">Insights</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">What can your records help you do?</h1>
        <p className="mt-3 max-w-3xl text-[var(--ink-soft)]">
          Start with a part of life you want to understand. Each page shows what you recorded,
          what the evidence can support, and one useful next step.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link href="/insights/weekly" className="submit-button">Review your last 7 recorded days</Link>
          <Link href="/logs/new?type=Daily%20check-in" className="secondary-button">Daily check-in</Link>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {insightAreas.map((area) => {
            const related = getInsightAreaLogs(logs, area.id);
            const summary = analyzeArea(area.id, related);
            return (
              <Link key={area.id} href={`/insights/${area.id}`}
                className="glass-card block transition hover:-translate-y-0.5 hover:border-[var(--leaf)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--leaf)]">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--leaf-dark)]">
                  {getLoggedDays(related)} days with entries · {related.length} records
                </p>
                <h2 className="mt-2 text-2xl font-bold">{area.title}</h2>
                <p className="mt-2 text-[var(--ink-soft)]">{area.question}</p>
                <p className="mt-4 rounded-lg bg-white/70 p-3 text-sm text-[var(--ink)]">
                  <span className="font-semibold">Useful next step: </span>
                  {summary.findings[0]?.next ?? area.recordPrompt}
                </p>
                <p className="mt-4 text-sm font-semibold text-[var(--leaf-dark)]">Explore this area →</p>
              </Link>
            );
          })}
        </section>
        <p className="mt-6 max-w-3xl text-sm text-[var(--ink-soft)]">
          Not recorded does not mean not done. A score is your rating, not a proven cause.
          Insights use up to your {INSIGHT_LOG_LIMIT} most recent entries, rather than your complete history.
        </p>
      </div>
    </main>
  );
}
