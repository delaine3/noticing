export default function InsightNotes() {
  return (
    <article className="glass-card  p-5 shadow-sm">
      <p className="text-md font-medium uppercase tracking-[0.2em] text-[var(--leaf-dark)]">
        Notes
      </p>

      <h2 className="mt-2 text-xl font-semibold">How to read this page</h2>

      <div className="mt-4 space-y-3 leading-7 text-[var(--ink-soft)]">
        <p>
          Only compare entries you actually recorded. A missing entry does not mean an activity did not happen. Ratings describe your assessment, not a proven effect. For a useful comparison, record the activity, duration, and how you felt before and after on several occasions.
        </p>
      </div>
    </article>
  );
}
