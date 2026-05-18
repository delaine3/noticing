import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import {
  actionTypes,
  effects,
  mealSizes,
  mealSources,
} from "../../../lib/log-types";

type EditLogPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type EditableLog = {
  id: number;
  log_type: string;
  title: string | null;
  notes: string | null;
  action_date: string | null;
  action_time: string | null;
  effect: string | null;
  meal_size: string | null;
  meal_source: string | null;
  water_amount_ml: number | null;
  washup_types: string[] | null;
  treadmill_duration_minutes: number | null;
  treadmill_distance_km: number | null;
  workout_name: string | null;
  mood_score: number | null;
  energy_score: number | null;
  intensity_score: number | null;
};

const washupOptions = [
  { value: "brush_teeth", label: "Brush teeth" },
  { value: "shower", label: "Shower" },
  { value: "bath", label: "Bath" },
  { value: "wash_face", label: "Wash face" },
];

async function updateLog(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  const logType = String(formData.get("log_type") || "");
  const title = String(formData.get("title") || "");
  const notes = String(formData.get("notes") || "");
  const actionDate = String(formData.get("action_date") || "");
  const actionTime = String(formData.get("action_time") || "");
  const effect = String(formData.get("effect") || "");
  const mealSize = String(formData.get("meal_size") || "");
  const mealSource = String(formData.get("meal_source") || "");
  const waterAmountMl = formData.get("water_amount_ml");
  const washupTypes = formData.getAll("washup_types").map(String);
  const treadmillDurationMinutes = formData.get("treadmill_duration_minutes");
  const treadmillDistanceKm = formData.get("treadmill_distance_km");
  const workoutName = String(formData.get("workout_name") || "");
  const moodScore = formData.get("mood_score");
  const energyScore = formData.get("energy_score");
  const intensityScore = formData.get("intensity_score");

  if (!Number.isFinite(id)) {
    throw new Error("Invalid log id");
  }

  const { error } = await supabase
    .from("logs")
    .update({
      log_type: logType,
      category: logType,
      title: title || null,
      notes: notes || null,
      action_date: actionDate || null,
      action_time: actionTime || null,
      effect: effect || null,
      meal_size: mealSize || null,
      meal_source: mealSource || null,
      water_amount_ml: waterAmountMl ? Number(waterAmountMl) : null,
      washup_types: washupTypes.length ? washupTypes : [],
      treadmill_duration_minutes: treadmillDurationMinutes
        ? Number(treadmillDurationMinutes)
        : null,
      treadmill_distance_km: treadmillDistanceKm
        ? Number(treadmillDistanceKm)
        : null,
      workout_name: workoutName || null,
      mood_score: moodScore ? Number(moodScore) : null,
      energy_score: energyScore ? Number(energyScore) : null,
      intensity_score: intensityScore ? Number(intensityScore) : null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/logs");
}

export default async function EditLogPage({ params }: EditLogPageProps) {
  const { id } = await params;

  const { data: log, error } = await supabase
    .from("logs")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !log) {
    notFound();
  }

  const editableLog = log as EditableLog;
  const washupTypes = editableLog.washup_types ?? [];

  return (
    <main className="app-bg min-h-screen px-4 py-8 text-[var(--ink)] sm:px-6 sm:py-10">
      <section className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="eyebrow">Edit log</p>

          <h1 className="page-title mt-3 text-4xl sm:text-5xl">
            Fix the receipt.
          </h1>

          <p className="p mt-4">
            Update the details. Future-you needs accurate data, not historical
            fiction.
          </p>
        </div>

        <form
          action={updateLog}
          className="glass-card space-y-5 rounded p-5 shadow-sm"
        >
          <input type="hidden" name="id" value={editableLog.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-md font-medium text-[var(--ink)]">
                Action
              </span>

              <select
                name="log_type"
                required
                defaultValue={editableLog.log_type}
                className="mt-2 w-full rounded border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
              >
                {actionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-md font-medium text-[var(--ink)]">
                Effect
              </span>

              <select
                name="effect"
                defaultValue={editableLog.effect ?? ""}
                className="mt-2 w-full rounded border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
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
              <span className="text-md font-medium text-[var(--ink)]">
                Date
              </span>

              <input
                name="action_date"
                type="date"
                defaultValue={editableLog.action_date ?? ""}
                className="mt-2 w-full rounded border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
              />
            </label>

            <label className="block">
              <span className="text-md font-medium text-[var(--ink)]">
                Time
              </span>

              <input
                name="action_time"
                type="time"
                defaultValue={editableLog.action_time?.slice(0, 5) ?? ""}
                className="mt-2 w-full rounded border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-md font-medium text-[var(--ink)]">
              Short label
            </span>

            <input
              name="title"
              defaultValue={editableLog.title ?? ""}
              className="mt-2 w-full rounded border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
              placeholder="What happened?"
            />
          </label>

          <section className="rounded border border-[var(--border-soft)] bg-white/55 p-4">
            <h2 className="text-md font-semibold text-[var(--ink)]">
              Meal details
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-md font-medium text-[var(--ink)]">
                  Meal size
                </span>

                <select
                  name="meal_size"
                  defaultValue={editableLog.meal_size ?? ""}
                  className="mt-2 w-full rounded border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
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
                <span className="text-md font-medium text-[var(--ink)]">
                  Meal source
                </span>

                <select
                  name="meal_source"
                  defaultValue={editableLog.meal_source ?? ""}
                  className="mt-2 w-full rounded border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
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

          <section className="rounded border border-[var(--border-soft)] bg-white/55 p-4">
            <h2 className="text-md font-semibold text-[var(--ink)]">Water</h2>

            <label className="mt-4 block">
              <span className="text-md font-medium text-[var(--ink)]">
                Amount in ml
              </span>

              <input
                name="water_amount_ml"
                type="number"
                min="0"
                step="50"
                defaultValue={editableLog.water_amount_ml ?? ""}
                className="mt-2 w-full rounded border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
                placeholder="Example: 500"
              />
            </label>
          </section>

          <section className="rounded border border-[var(--border-soft)] bg-white/55 p-4">
            <h2 className="text-md font-semibold text-[var(--ink)]">Wash-up</h2>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {washupOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center justify-between rounded border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-[var(--ink)]"
                >
                  <span className="text-md font-medium">{option.label}</span>

                  <input
                    type="checkbox"
                    name="washup_types"
                    value={option.value}
                    defaultChecked={washupTypes.includes(option.value)}
                    className="h-4 w-4 accent-[var(--leaf)]"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="rounded border border-[var(--border-soft)] bg-white/55 p-4">
            <h2 className="text-md font-semibold text-[var(--ink)]">
              Treadmill
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-md font-medium text-[var(--ink)]">
                  Duration minutes
                </span>

                <input
                  name="treadmill_duration_minutes"
                  type="number"
                  min="0"
                  step="0.1"
                  defaultValue={editableLog.treadmill_duration_minutes ?? ""}
                  className="mt-2 w-full rounded border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
                />
              </label>

              <label className="block">
                <span className="text-md font-medium text-[var(--ink)]">
                  Distance km
                </span>

                <input
                  name="treadmill_distance_km"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={editableLog.treadmill_distance_km ?? ""}
                  className="mt-2 w-full rounded border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
                />
              </label>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-md font-medium text-[var(--ink)]">
                Mood
              </span>

              <input
                name="mood_score"
                type="number"
                min="1"
                max="10"
                defaultValue={editableLog.mood_score ?? ""}
                className="mt-2 w-full rounded border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
              />
            </label>

            <label className="block">
              <span className="text-md font-medium text-[var(--ink)]">
                Energy
              </span>

              <input
                name="energy_score"
                type="number"
                min="1"
                max="10"
                defaultValue={editableLog.energy_score ?? ""}
                className="mt-2 w-full rounded border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
              />
            </label>

            <label className="block">
              <span className="text-md font-medium text-[var(--ink)]">
                Intensity
              </span>

              <input
                name="intensity_score"
                type="number"
                min="1"
                max="10"
                defaultValue={editableLog.intensity_score ?? ""}
                className="mt-2 w-full rounded border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-md font-medium text-[var(--ink)]">Notes</span>

            <textarea
              name="notes"
              rows={5}
              defaultValue={editableLog.notes ?? ""}
              className="mt-2 w-full rounded border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
              placeholder="Anything future-you should know?"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" className="brand-button">
              Save changes
            </button>

            <Link href="/logs" className="muted-button">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
