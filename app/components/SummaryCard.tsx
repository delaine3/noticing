type SummaryCardProps = {
  label: string;
  value: string | number;
  message: string;
};

export function SummaryCard({ label, value, message }: SummaryCardProps) {
  return (
    <article className="glass-card  p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--leaf-dark)]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-[var(--ink)]">{value}</p>

      <p className="mt-1 text-md text-[var(--ink-soft)]">{message}</p>
    </article>
  );
}
