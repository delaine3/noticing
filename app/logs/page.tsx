export default function LogsPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10 text-stone-950">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-700">
          Logs
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          What you’ve noticed
        </h1>

        <div className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-stone-600">
          No logs yet. Your future receipts will live here.
        </div>
      </section>
    </main>
  );
}
