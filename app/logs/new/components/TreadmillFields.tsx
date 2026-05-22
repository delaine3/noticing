export function TreadmillFields() {
  return (
    <section className="bg-white/55 p-4">
      <h2 className="text-md font-semibold text-[var(--ink)]">
        Treadmill details
      </h2>

      <p className="mt-1 text-md text-[var(--ink-soft)]">
        Time and distance. The app will calculate pace.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-md font-medium text-[var(--ink-soft)]">
            Duration minutes
          </span>
          <input
            name="treadmill_duration_minutes"
            type="number"
            min="0"
            step="0.1"
            className="mt-2 w-full   bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
            placeholder="Example: 30"
          />
        </label>

        <label className="block">
          <span className="text-md font-medium text-[var(--ink-soft)]">
            Distance km
          </span>
          <input
            name="treadmill_distance_km"
            type="number"
            min="0"
            step="0.01"
            className="mt-2 w-full   bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
            placeholder="Example: 2.4"
          />
        </label>
      </div>
    </section>
  );
}
