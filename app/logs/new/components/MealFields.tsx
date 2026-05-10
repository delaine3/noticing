import { mealSizes, mealSources } from "../../../lib/log-types";

export function MealFields() {
  return (
    <section className="rounded border border-stone-200 bg-stone-50 p-4">
      <h2 className="text-sm font-semibold text-stone-800">Meal details</h2>
      <p className="mt-1 text-sm text-stone-600">
        Food facts only. No moral essay.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Meal size</span>
          <select
            name="meal_size"
            className="mt-2 w-full rounded border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-green-700"
            defaultValue=""
          >
            <option value="">Select size</option>
            {mealSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">
            Meal source
          </span>
          <select
            name="meal_source"
            className="mt-2 w-full rounded border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-green-700"
            defaultValue=""
          >
            <option value="">Select source</option>
            {mealSources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
