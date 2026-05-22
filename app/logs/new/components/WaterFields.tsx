import { useState } from "react";

export function WaterFields() {
  const [waterAmount, setWaterAmount] = useState(0);

  return (
    <section className="bg-[rgba(255,250,243,0.72)] p-4">
      <h2 className="text-md font-semibold text-[var(--ink)]">
        Water quantity
      </h2>

      <p className="mt-1 text-md text-[var(--ink-soft)]">Estimate is fine.</p>

      <label className="mt-4 block">
        <span className="text-md font-medium text-[var(--ink-soft)]">
          Amount in ml
        </span>

        <input
          name="water_amount_ml"
          type="number"
          min="0"
          step="50"
          value={waterAmount}
          onChange={(event) => setWaterAmount(Number(event.target.value))}
          className="mt-2 w-full   bg-white/70 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
          placeholder="Example: 250, 500, 750"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={(event) => setWaterAmount(250)}
          type="button"
          className="secondary-button"
        >
          Cup: ~250ml
        </button>
        <button
          onClick={(event) => setWaterAmount(500)}
          type="button"
          className="secondary-button"
        >
          Big mug: ~500ml
        </button>
        <button
          onClick={(event) => setWaterAmount(750)}
          type="button"
          className="secondary-button"
        >
          Bottle: ~750ml
        </button>
      </div>
    </section>
  );
}
