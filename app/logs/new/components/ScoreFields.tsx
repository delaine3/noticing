type ScoreFieldsProps = {
  showMood: boolean;
  showEnergy: boolean;
  showIntensity: boolean;
};

export function ScoreFields({
  showMood,
  showEnergy,
  showIntensity,
}: ScoreFieldsProps) {
  if (!showMood && !showEnergy && !showIntensity) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {showMood ? (
        <label className="block">
          <span className="text-md font-medium text-stone-700">Mood</span>
          <input
            name="mood_score"
            type="number"
            min="1"
            max="10"
            className="mt-2 w-full rounded border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-green-700"
            placeholder="1-10"
          />
        </label>
      ) : null}

      {showEnergy ? (
        <label className="block">
          <span className="text-md font-medium text-stone-700">Energy</span>
          <input
            name="energy_score"
            type="number"
            min="1"
            max="10"
            className="mt-2 w-full rounded border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-green-700"
            placeholder="1-10"
          />
        </label>
      ) : null}

      {showIntensity ? (
        <label className="block">
          <span className="text-md font-medium text-stone-700">Intensity</span>
          <input
            name="intensity_score"
            type="number"
            min="1"
            max="10"
            className="mt-2 w-full rounded border border-stone-300 bg-white px-4 py-3 text-stone-950 outline-none focus:border-green-700"
            placeholder="1-10"
          />
        </label>
      ) : null}
    </div>
  );
}
