import { mealSizes, mealSources } from "../../../lib/log-types";

export function MealFields() {
  return (
    <section className="bg-black-50 p-4">
      <h2 className="text-md font-semibold text-black-800">Meal details</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-md font-medium text-black-700">Meal size</span>
          <select
            name="meal_size"
            className="mt-2 w-full bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
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
          <span className="text-md font-medium text-black-700">
            Meal source
          </span>
          <select
            name="meal_source"
            className="mt-2 w-full bg-white px-4 py-3 text-black-950 outline-none focus:border-green-700"
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
