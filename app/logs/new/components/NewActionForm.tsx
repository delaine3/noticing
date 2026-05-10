"use client";

import { useMemo, useState } from "react";
import { actionTypes } from "../../../lib/log-types";
import { getActionConfig } from "../../../lib/action-config";
import { EffectField } from "./EffectField";
import { MealFields } from "./MealFields";
import { ScoreFields } from "./ScoreFields";

type NewActionFormProps = {
  selectedType: string;
  today: string;
  createLog: (formData: FormData) => void | Promise<void>;
};

export function NewActionForm({
  selectedType,
  today,
  createLog,
}: NewActionFormProps) {
  const [actionType, setActionType] = useState(selectedType);

  const config = useMemo(() => getActionConfig(actionType), [actionType]);

  const showEffect = config.fields.includes("effect");
  const showMeal = config.fields.includes("meal");
  const showMood = config.fields.includes("mood");
  const showEnergy = config.fields.includes("energy");
  const showIntensity = config.fields.includes("intensity");

  return (
    <>
      <div
        className="glass-card text-[var(--ink)] text-[var(--leaf-dark)]
                   brand-button"
      >
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-green-200">
          Command
        </p>

        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          {config.heading}
        </h2>

        <p className="mt-3 leading-7 text-green-300">{config.instruction}</p>
      </div>

      <form
        action={createLog}
        className="mt-6 space-y-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Action</span>
            <select
              name="log_type"
              required
              value={actionType}
              onChange={(event) => setActionType(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-green-700"
            >
              {actionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          {showEffect ? <EffectField /> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Date</span>
            <input
              name="action_date"
              type="date"
              defaultValue={today}
              className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-green-700"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">Time</span>
            <input
              name="action_time"
              type="time"
              className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-green-700"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">
            {config.titleLabel}
          </span>
          <input
            name="title"
            className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-green-700"
            placeholder={config.titlePlaceholder}
          />
        </label>

        {showMeal ? <MealFields /> : null}

        <ScoreFields
          showMood={showMood}
          showEnergy={showEnergy}
          showIntensity={showIntensity}
        />

        <label className="block">
          <span className="text-sm font-medium text-stone-700">Notes</span>
          <textarea
            name="notes"
            rows={5}
            className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-green-700"
            placeholder={config.notesPlaceholder}
          />
        </label>

        <button
          type="submit"
          className="rounded-full bg-green-800 px-6 py-3 text-sm font-semibold text-green-300 shadow-sm hover:bg-green-900"
        >
          Save action
        </button>
      </form>
    </>
  );
}
