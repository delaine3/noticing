export function WaterFields() {
  return (
    <section className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,250,243,0.72)] p-4">
      <h2 className="text-sm font-semibold text-[var(--ink)]">
        Water quantity
      </h2>

      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Estimate is fine. The app needs direction, not courtroom evidence.
      </p>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-[var(--ink-soft)]">
          Amount in ml
        </span>

        <input
          name="water_amount_ml"
          type="number"
          min="0"
          step="50"
          className="mt-2 w-full rounded-md border border-[var(--border-soft)] bg-white/70 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
          placeholder="Example: 250, 500, 750"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-md bg-[var(--mint)] px-3 py-1 text-xs font-medium text-[var(--leaf-dark)]">
          Cup: ~250ml
        </span>
        <span className="rounded-md bg-[var(--mint)] px-3 py-1 text-xs font-medium text-[var(--leaf-dark)]">
          Big mug: ~500ml
        </span>
        <span className="rounded-md bg-[var(--mint)] px-3 py-1 text-xs font-medium text-[var(--leaf-dark)]">
          Bottle: ~750ml
        </span>
      </div>
    </section>
  );
}
