"use client";

import { useMemo, useState } from "react";
import { actionTypes } from "../../../lib/log-types";
import { getActionConfig } from "../../../lib/action-config";
import { EffectField } from "./EffectField";
import { MealFields } from "./MealFields";
import { ScoreFields } from "./ScoreFields";
import { WaterFields } from "./WaterFields";
import { TreadmillFields } from "./TreadmillFields";
import { StrengthFields } from "./StrengthFields";
import { TimeField } from "./TimeField";

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
  const showWater = config.fields.includes("water");
  const showTreadmill = config.fields.includes("treadmill");
  const showStrength = config.fields.includes("strength");
  return (
    <>
      <div className="glass-card text-[var(--ink)] text-[var(--leaf-dark)] rounded">
        <p className="text-md font-medium uppercase tracking-[0.25em]">
          Command
        </p>

        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          {config.heading}
        </h2>

        <p className="mt-3 leading-7">{config.instruction}</p>
      </div>

      <form
        action={createLog}
        className="glass-card mt-6 space-y-5 rounded border border-stone-200 p-6 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-md font-medium text-stone-700">Action</span>
            <select
              name="log_type"
              required
              value={actionType}
              onChange={(event) => setActionType(event.target.value)}
              className="mt-2 w-full rounded border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-green-700"
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
            <span className="text-md font-medium text-stone-700">Date</span>
            <input
              name="action_date"
              type="date"
              defaultValue={today}
              className="mt-2 w-full rounded border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-green-700"
            />
          </label>

          <TimeField />
        </div>

        <label className="block">
          <span className="text-md font-medium text-stone-700">
            {config.titleLabel}
          </span>
          <input
            name="title"
            className="mt-2 w-full rounded border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-green-700"
            placeholder={config.titlePlaceholder}
          />
        </label>
        {showMeal ? <MealFields /> : null}
        {showWater ? <WaterFields /> : null}
        {showTreadmill ? <TreadmillFields /> : null}
        {showStrength ? <StrengthFields /> : null}
        <ScoreFields
          showMood={showMood}
          showEnergy={showEnergy}
          showIntensity={showIntensity}
        />

        <label className="block">
          <span className="text-md font-medium text-stone-700">Notes</span>
          <textarea
            name="notes"
            rows={5}
            className="mt-2 w-full rounded border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-green-700"
            placeholder={config.notesPlaceholder}
          />
        </label>

        <button type="submit" className="brand-button">
          Save action
        </button>
      </form>
    </>
  );
}
