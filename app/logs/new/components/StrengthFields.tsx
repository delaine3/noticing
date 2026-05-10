"use client";

import { useState } from "react";

type StrengthSet = {
  exerciseName: string;
  reps: string;
  weightKg: string;
};

export function StrengthFields() {
  const [sets, setSets] = useState<StrengthSet[]>([
    { exerciseName: "", reps: "", weightKg: "" },
  ]);

  function updateSet(index: number, field: keyof StrengthSet, value: string) {
    setSets((current) =>
      current.map((set, setIndex) =>
        setIndex === index ? { ...set, [field]: value } : set,
      ),
    );
  }

  function addSet() {
    setSets((current) => [
      ...current,
      {
        exerciseName: current.at(-1)?.exerciseName ?? "",
        reps: "",
        weightKg: "",
      },
    ]);
  }

  function removeSet(index: number) {
    setSets((current) => current.filter((_, setIndex) => setIndex !== index));
  }

  return (
    <section className="rounded border border-[var(--border-soft)] bg-white/55 p-4">
      <h2 className="text-sm font-semibold text-[var(--ink)]">
        Strength details
      </h2>

      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Add each set. Volume is calculated after saving.
      </p>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-[var(--ink-soft)]">
          Workout name
        </span>
        <input
          name="workout_name"
          className="mt-2 w-full rounded border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
          placeholder="Example: triceps day, legs, full body"
        />
      </label>

      <div className="mt-4 space-y-3">
        {sets.map((set, index) => (
          <div
            key={index}
            className="rounded border border-[var(--border-soft)] bg-[rgba(255,250,243,0.7)] p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--ink)]">
                Set {index + 1}
              </p>

              {sets.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeSet(index)}
                  className="text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)]"
                >
                  Remove
                </button>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-[1.4fr_0.8fr_0.8fr]">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                  Exercise
                </span>
                <input
                  name="exercise_name"
                  value={set.exerciseName}
                  onChange={(event) =>
                    updateSet(index, "exerciseName", event.target.value)
                  }
                  className="mt-2 w-full rounded border border-[var(--border-soft)] bg-white/80 px-3 py-2 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
                  placeholder="Tricep pushdown"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                  Reps
                </span>
                <input
                  name="reps"
                  type="number"
                  min="1"
                  value={set.reps}
                  onChange={(event) =>
                    updateSet(index, "reps", event.target.value)
                  }
                  className="mt-2 w-full rounded border border-[var(--border-soft)] bg-white/80 px-3 py-2 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
                  placeholder="12"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                  Weight kg
                </span>
                <input
                  name="weight_kg"
                  type="number"
                  min="0"
                  step="0.5"
                  value={set.weightKg}
                  onChange={(event) =>
                    updateSet(index, "weightKg", event.target.value)
                  }
                  className="mt-2 w-full rounded border border-[var(--border-soft)] bg-white/80 px-3 py-2 text-[var(--ink)] outline-none focus:border-[var(--leaf)]"
                  placeholder="20"
                />
              </label>
            </div>

            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Set volume: {Number(set.reps || 0) * Number(set.weightKg || 0)} kg
            </p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSet}
        className="mt-4 rounded bg-[var(--mint)] px-4 py-2 text-sm font-semibold text-[var(--leaf-dark)] hover:bg-[var(--aqua)]"
      >
        Add set
      </button>
    </section>
  );
}
