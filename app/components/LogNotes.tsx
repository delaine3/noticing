import { splitLogNotes } from "../lib/log-notes";

type Props = {
  notes: string | null | undefined;
  className?: string;
};

/** A collapsed disclosure keeps import fingerprints out of normal reading. */
export function ImportInfo({ metadata }: { metadata: string[] }) {
  if (!metadata.length) return null;
  return (
    <details className="mt-3 rounded-lg border border-[var(--border-soft)] bg-white/60 px-3 py-2 text-sm text-[var(--ink-soft)]">
      <summary className="cursor-pointer font-medium text-[var(--leaf-dark)]">
        Import details
      </summary>
      <p className="mt-2">
        This record was imported. Its source identifier helps prevent duplicate imports.
      </p>
      <div className="mt-2 space-y-1">
        {metadata.map((value, index) => (
          <code className="block break-all text-xs" key={index}>{value}</code>
        ))}
      </div>
    </details>
  );
}

export function LogNotes({ notes, className = "mt-3 whitespace-pre-wrap leading-7 text-[var(--ink-soft)]" }: Props) {
  const { displayNotes, metadata } = splitLogNotes(notes);
  if (!displayNotes && !metadata.length) return null;
  return (
    <div>
      {displayNotes ? <p className={className}>{displayNotes}</p> : null}
      <ImportInfo metadata={metadata} />
    </div>
  );
}
