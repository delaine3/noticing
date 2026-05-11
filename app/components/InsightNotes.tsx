export default async function InsightNotes() {
  return (
    <article className="glass-card rounded p-5 shadow-sm">
      <p className="text-md font-medium uppercase tracking-[0.2em] text-[var(--leaf-dark)]">
        Notes
      </p>

      <h2 className="mt-2 text-xl font-semibold">How to read this page</h2>

      <div className="mt-4 space-y-3 leading-7 text-[var(--ink-soft)]">
        <p>
          The goal is not perfect tracking. The goal is to spot which actions
          reliably reduce suffering and which ones make the day messy.
        </p>

        <p>
          Useful actions should become easier to repeat. Harmful actions should
          become easier to interrupt. Neutral actions are context.
        </p>

        <p>
          Once you have more data, this page can get stricter: best food
          windows, TikTok cost, sunlight impact, movement effect, and recurring
          thought triggers.
        </p>
      </div>
    </article>
  );
}
