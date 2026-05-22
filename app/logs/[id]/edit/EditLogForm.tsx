"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  actionTypes,
  effects,
  mealSizes,
  mealSources,
} from "../../../lib/log-types";
import { getActionConfig } from "../../../lib/action-config";
import { EditableLog } from "./page";

type EditLogFormProps = {
  editableLog: EditableLog;
  updateLog: (formData: FormData) => Promise<void>;
};

const washupOptions = [
  { value: "brush_teeth", label: "Brush teeth" },
  { value: "shower", label: "Shower" },
  { value: "bath", label: "Bath" },
  { value: "wash_face", label: "Wash face" },
];

export function EditLogForm({ editableLog, updateLog }: EditLogFormProps) {
  const [actionType, setActionType] = useState(editableLog.log_type);
  const [washupTypes, setWashupTypes] = useState<string[]>(
    editableLog.washup_types ?? [],
  );

  const config = useMemo(() => getActionConfig(actionType), [actionType]);

  const showEffect = config.fields.includes("effect");
  const showMeal = config.fields.includes("meal");
  const showMood = config.fields.includes("mood");
  const showEnergy = config.fields.includes("energy");
  const showIntensity = config.fields.includes("intensity");
  const showWater = config.fields.includes("water");
  const showWashup = config.fields.includes("hygiene");
  const showTreadmill = config.fields.includes("treadmill");
  const showStrength = config.fields.includes("strength");

  function toggleWashupType(value: string) {
    setWashupTypes((current) => {
      const alreadySelected = current.includes(value);

      if (alreadySelected) {
        return current.filter((item) => item !== value);
      }

      const next = [...current, value];

      if (
        (value === "shower" || value === "bath") &&
        !next.includes("wash_face")
      ) {
        next.push("wash_face");
      }

      return next;
    });
  }

  return (
    <main className="min-h-screen px-4 py-8 text-[var(--ink)] sm:px-6 sm:py-10">
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
          className="glass-card space-y-5  p-5 shadow-sm"
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
                value={actionType}
                onChange={(event) => setActionType(event.target.value)}
                className="mt-2 w-full   bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
              >
                {actionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            {showEffect ? (
              <label className="block">
                <span className="text-md font-medium text-[var(--ink)]">
                  Effect
                </span>

                <select
                  name="effect"
                  defaultValue={editableLog.effect ?? ""}
                  className="mt-2 w-full   bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
                >
                  <option value="">Select effect</option>
                  {effects.map((effect) => (
                    <option key={effect} value={effect}>
                      {effect}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
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
                className="mt-2 w-full   bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
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
                className="mt-2 w-full   bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-md font-medium text-[var(--ink)]">
              {config.titleLabel}
            </span>

            <input
              name="title"
              defaultValue={editableLog.title ?? ""}
              className="mt-2 w-full   bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
              placeholder={config.titlePlaceholder}
            />
          </label>

          {showMeal ? (
            <section className="bg-white/55 p-4">
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
                    className="mt-2 w-full   bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
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
                    className="mt-2 w-full   bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
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
          ) : null}

          {showWater ? (
            <section className="bg-white/55 p-4">
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
                  className="mt-2 w-full   bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
                  placeholder="Example: 500"
                />
              </label>
            </section>
          ) : null}

          {showWashup ? (
            <section className="bg-white/55 p-4">
              <h2 className="text-md font-semibold text-[var(--ink)]">
                Wash-up
              </h2>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {washupOptions.map((option) => {
                  const isChecked = washupTypes.includes(option.value);

                  return (
                    <label
                      key={option.value}
                      className="flex items-center justify-between   bg-white/75 px-4 py-3 text-[var(--ink)]"
                    >
                      <span className="text-md font-medium">
                        {option.label}
                      </span>

                      <input
                        type="checkbox"
                        name="washup_types"
                        value={option.value}
                        checked={isChecked}
                        onChange={() => toggleWashupType(option.value)}
                        className="h-4 w-4 accent-[var(--leaf)]"
                      />
                    </label>
                  );
                })}
              </div>
            </section>
          ) : null}

          {showTreadmill ? (
            <section className="bg-white/55 p-4">
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
                    className="mt-2 w-full   bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
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
                    className="mt-2 w-full   bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
                  />
                </label>
              </div>
            </section>
          ) : null}

          {showStrength ? (
            <section className="bg-white/55 p-4">
              <h2 className="text-md font-semibold text-[var(--ink)]">
                Strength
              </h2>

              <label className="mt-4 block">
                <span className="text-md font-medium text-[var(--ink)]">
                  Workout name
                </span>

                <input
                  name="workout_name"
                  defaultValue={editableLog.workout_name ?? ""}
                  className="mt-2 w-full   bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
                  placeholder="Example: legs, triceps, full body"
                />
              </label>
            </section>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            {showMood ? (
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
                  className="mt-2 w-full   bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
                />
              </label>
            ) : null}

            {showEnergy ? (
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
                  className="mt-2 w-full   bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
                />
              </label>
            ) : null}

            {showIntensity ? (
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
                  className="mt-2 w-full   bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
                />
              </label>
            ) : null}
          </div>

          <label className="block">
            <span className="text-md font-medium text-[var(--ink)]">Notes</span>

            <textarea
              name="notes"
              rows={5}
              defaultValue={editableLog.notes ?? ""}
              className="mt-2 w-full   bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
              placeholder={config.notesPlaceholder}
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" className="submit-button">
              Save changes
            </button>

            <Link href="/logs" className="secondary-button">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
