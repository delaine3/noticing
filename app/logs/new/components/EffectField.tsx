import { effects } from "../../../lib/log-types";

export function EffectField() {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">Effect</span>
      <select
        name="effect"
        className="mt-2 w-full rounded border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-green-700"
        defaultValue=""
      >
        <option value="">Select effect</option>
        {effects.map((effect) => (
          <option key={effect} value={effect}>
            {effect}
          </option>
        ))}
      </select>
    </label>
  );
}
