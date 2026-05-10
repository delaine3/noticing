import { redirect } from "next/navigation";
import { supabase } from "../../lib/supabase";
import {
  actionTypes,
  effects,
  mealSizes,
  mealSources,
} from "../../lib/log-types";

async function createLog(formData: FormData) {
  "use server";

  const logType = String(formData.get("log_type") || "");
  const title = String(formData.get("title") || "");
  const notes = String(formData.get("notes") || "");
  const actionDate = String(formData.get("action_date") || "");
  const actionTime = String(formData.get("action_time") || "");
  const effect = String(formData.get("effect") || "");
  const mealSize = String(formData.get("meal_size") || "");
  const mealSource = String(formData.get("meal_source") || "");
  const moodScore = formData.get("mood_score");
  const energyScore = formData.get("energy_score");
  const intensityScore = formData.get("intensity_score");

  const { error } = await supabase.from("logs").insert({
    log_type: logType,
    title: title || null,
    notes: notes || null,
    action_date: actionDate || new Date().toISOString().slice(0, 10),
    action_time: actionTime || null,
    category: logType,
    effect: effect || null,
    meal_size: mealSize || null,
    meal_source: mealSource || null,
    mood_score: moodScore ? Number(moodScore) : null,
    energy_score: energyScore ? Number(energyScore) : null,
    intensity_score: intensityScore ? Number(intensityScore) : null,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/logs");
}

export default function NewLogPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10 text-stone-950">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-700">
          New action
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          What happened?
        </h1>

        <p className="mt-4 text-stone-700">
          Record the action, the time, and any useful evidence about how it
          affected your day.
        </p>

        <form
          action={createLog}
          className="mt-8 space-y-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Action</span>
              <select
                name="log_type"
                required
                className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-emerald-700"
              >
                {actionTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-stone-700">Effect</span>
              <select
                name="effect"
                className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-emerald-700"
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Date</span>
              <input
                name="action_date"
                type="date"
                defaultValue={today}
                className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-emerald-700"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-stone-700">Time</span>
              <input
                name="action_time"
                type="time"
                className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-emerald-700"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">
              Short label
            </span>
            <input
              name="title"
              className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-emerald-700"
              placeholder="Example: woke up late, leftover pizza, 30 min treadmill"
            />
          </label>

          <section className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
            <h2 className="text-sm font-semibold text-stone-800">
              Meal details
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Use this when the action is a meal, dessert, craving, or snack.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-stone-700">
                  Meal size
                </span>
                <select
                  name="meal_size"
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-emerald-700"
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
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-emerald-700"
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

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Mood</span>
              <input
                name="mood_score"
                type="number"
                min="1"
                max="10"
                className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-emerald-700"
                placeholder="1-10"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-stone-700">Energy</span>
              <input
                name="energy_score"
                type="number"
                min="1"
                max="10"
                className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-emerald-700"
                placeholder="1-10"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-stone-700">
                Intensity
              </span>
              <input
                name="intensity_score"
                type="number"
                min="1"
                max="10"
                className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-emerald-700"
                placeholder="1-10"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">Notes</span>
            <textarea
              name="notes"
              rows={5}
              className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-emerald-700"
              placeholder="What did you notice? What was the context?"
            />
          </label>

          <button
            type="submit"
            className="rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-900"
          >
            Save action
          </button>
        </form>
      </section>
    </main>
  );
}
