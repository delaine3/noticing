const effectOptions = [
  { value: "restorative", label: "Restorative" },
  { value: "helpful", label: "Helpful" },
  { value: "neutral", label: "Neutral" },
  { value: "unhelpful", label: "Unhelpful" },
  { value: "harmful", label: "Harmful" },
  { value: "detrimental", label: "Detrimental" },
];

export function EffectField() {
  return (
    <label className="block">
      <span className="text-md font-medium text-[var(--ink)]">Effect</span>

      <select name="effect" className="" defaultValue="">
        <option value="">Select effect</option>

        {effectOptions.map((effect) => (
          <option key={effect.value} value={effect.value}>
            {effect.label}
          </option>
        ))}
      </select>
    </label>
  );
}
