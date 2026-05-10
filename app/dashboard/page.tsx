const careActions = [
  "Wash Up",
  "Sunlight",
  "Water",
  "Food",
  "Movement",
  "Reading",
  "Plant care",
  "App work",
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10 text-stone-950">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-700">
            Dashboard
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Today’s evidence
          </h1>

          <p className="mt-4 max-w-2xl text-stone-700">
            A soft place to see what happened, what helped, and what needs care.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Mood</h2>
            <p className="mt-3 text-4xl font-semibold">—</p>
            <p className="mt-2 text-sm text-stone-600">No mood logged yet.</p>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Energy</h2>
            <p className="mt-3 text-4xl font-semibold">—</p>
            <p className="mt-2 text-sm text-stone-600">No energy logged yet.</p>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Mental noise</h2>
            <p className="mt-3 text-4xl font-semibold">—</p>
            <p className="mt-2 text-sm text-stone-600">
              No thought loops logged yet.
            </p>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Care actions</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {careActions.map((action) => (
              <div
                key={action}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium"
              >
                {action}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
