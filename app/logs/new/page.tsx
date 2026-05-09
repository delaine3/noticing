const logTypes = [
  "Mood",
  "Energy",
  "Dessert eaten",
  "Dessert craving",
  "Shower",
  "Sunlight",
  "Exercise",
  "Treadmill walk",
  "Reading",
  "App work",
  "TikTok used",
  "TikTok avoided",
  "Plant care",
  "Recurring thought",
  "Social interaction",
];

export default function NewLogPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10 text-stone-950">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-700">
          New log
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          Log something you noticed
        </h1>

        <form className="mt-8 space-y-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Type</span>
            <select className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-emerald-700">
              {logTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">Notes</span>
            <textarea
              rows={5}
              className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-emerald-700"
              placeholder="What happened? What did you notice?"
            />
          </label>

          <button
            type="button"
            className="rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-900"
          >
            Save log
          </button>
        </form>
      </section>
    </main>
  );
}
