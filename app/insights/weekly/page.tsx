import Link from "next/link";
import { getInsightLogs, INSIGHT_LOG_LIMIT } from "../../lib/insights-data";
import { getWeeklyReview } from "../../lib/insight-analysis";
import { getInsightAreaLogs, insightAreas } from "../../lib/insight-categories";

export default async function WeeklyReviewPage() {
  const logs = await getInsightLogs();
  const review = getWeeklyReview(logs);
  return (
    <main className="min-h-screen px-4 py-8 text-[var(--ink)] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/insights" className="text-sm font-semibold text-[var(--leaf-dark)] hover:underline">← Back to insights</Link>
        <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-[var(--leaf-dark)]">Weekly review</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-5xl">Your recent days</h1>
        <p className="mt-3 max-w-3xl text-[var(--ink-soft)]">
          The seven days up to your latest entry
          {review.latest ? " (" + review.latest + ")" : ""}. 
        </p>
        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          <article className="glass-card p-5"><h2 className="text-sm font-semibold">Days with entries</h2><p className="mt-2 text-3xl font-bold">{review.activeDays}/7</p></article>
          <article className="glass-card p-5"><h2 className="text-sm font-semibold">Entries</h2><p className="mt-2 text-3xl font-bold">{review.recent.length}</p></article>
          <article className="glass-card p-5">
            <h2 className="text-sm font-semibold">Most frequently logged</h2>
            <p className="mt-2 text-lg font-bold">{review.top[0]?.[0] ?? "No records"}</p>
          </article>
        </section>
        <section className="mt-6">
          <h2 className="text-2xl font-bold">Review by area</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {insightAreas.map((area) => {
              const areaLogs = getInsightAreaLogs(review.recent, area.id);
              return (
                <article key={area.id} className="glass-card p-5">
                  <h3 className="text-xl font-bold">{area.title}</h3>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{areaLogs.length} entries this week</p>
                  <p className="mt-3 text-[var(--ink-soft)]">{area.recordPrompt}</p>
                  <Link href={`/insights/${area.id}`} className="mt-4 inline-block text-sm font-semibold text-[var(--leaf-dark)] hover:underline">Explore this area →</Link>
                </article>
              );
            })}
          </div>
        </section>
        <section className="glass-card mt-6 p-5">
          <h2 className="text-2xl font-bold">Looking ahead</h2>
          <p className="mt-4 text-[var(--ink-soft)]">Is there anything from this week you want to remember or do differently?</p>
          <Link href="/check-in" className="submit-button mt-4 inline-block">Write a check-in</Link>
        </section>
        <p className="mt-6 text-sm text-[var(--ink-soft)]">Based on up to {INSIGHT_LOG_LIMIT} most recent records. Earlier entries may not be represented.</p>
      </div>
    </main>
  );
}
