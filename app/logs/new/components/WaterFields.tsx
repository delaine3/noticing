import { toTitleCase } from "@/app/utils/format";
import { Dispatch, SetStateAction } from "react";

type WaterFieldsProps = {
  commonWaterTitles: string[];
  waterAmount: string;
  setWaterAmount: Dispatch<SetStateAction<string>>;
  setTitle: Dispatch<SetStateAction<string>>;
};

const fallbackLiquidTitles = ["Water", "Rooibos", "Lemon water"];

const quantityPresets = [
  { label: "Cup", amountMl: 250 },
  { label: "Big mug", amountMl: 500 },
  { label: "Bottle", amountMl: 750 },
  { label: "Big bottle", amountMl: 1000 },
];

export function WaterFields({
  commonWaterTitles,
  waterAmount,
  setWaterAmount,
  setTitle,
}: WaterFieldsProps) {
  const liquidTitles =
    commonWaterTitles.length > 0
      ? [...new Set(commonWaterTitles.map((item) => toTitleCase(item)))]
      : fallbackLiquidTitles;

  return (
    <section className="bg-[rgba(255,250,243,0.72)] p-4">
      <h2 className="text-md font-semibold text-[var(--ink)]">Water details</h2>

      <p className="mt-1 text-md text-[var(--ink-soft)]">
        Pick the liquid and the amount separately, or type manually.
      </p>

      <div className="mt-4">
        <p className="text-md font-medium text-[var(--ink-soft)]">Liquid</p>

        <div className="mt-2 flex flex-wrap gap-2">
          {liquidTitles.map((title) => (
            <button
              key={title}
              type="button"
              onClick={() => setTitle(title)}
              className="secondary-button"
            >
              {title}
            </button>
          ))}
        </div>
      </div>

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
          onChange={(event) => setWaterAmount(event.target.value)}
          className="mt-2 w-full bg-white/70 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
          placeholder="Example: 250, 500, 750"
        />
      </label>

      <div className="mt-3">
        <p className="text-md font-medium text-[var(--ink-soft)]">Quantity</p>

        <div className="mt-2 flex flex-wrap gap-2">
          {quantityPresets.map((preset) => (
            <button
              key={`${preset.label}-${preset.amountMl}`}
              type="button"
              onClick={() => setWaterAmount(String(preset.amountMl))}
              className="secondary-button"
            >
              {preset.label}: ~{preset.amountMl}ml
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
