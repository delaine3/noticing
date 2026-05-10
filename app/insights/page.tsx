export default function InsightsPage() {
  return (
    <main className="min-h-screen app-bg px-6 py-10 text-stone-950">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-green-700">
          Insights
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          Patterns will appear here
        </h1>

        <div className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-stone-600">
          Once there are enough logs, this page will show trends, correlations,
          and tiny useful truths.
        </div>
      </section>
    </main>
  );
}
