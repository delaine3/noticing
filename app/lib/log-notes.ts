/**
 * The existing logs table stores import provenance in notes for backward
 * compatibility. Keep it out of ordinary reading/editing without losing
 * stable duplicate-detection identifiers.
 *
 * Do not put arbitrary user text in the metadata viewer: recognize only
 * the markers Noticing itself writes.
 */
const IMPORT_MARKER = /\[noticing-(?:import:[a-f0-9]{64}|chat:[a-f0-9-]{36})\]/gi;
const IMPORT_LABEL = /Approved from (?:reviewed import|ChatGPT export)\./gi;

export type LogNoteParts = {
  displayNotes: string;
  metadata: string[];
  isImported: boolean;
};

export function splitLogNotes(notes: string | null | undefined): LogNoteParts {
  const text = notes ?? "";
  const metadata: string[] = [];
  const clean = text.split(/\r?\n/).map((line) => {
    const result = line
      .replace(IMPORT_LABEL, (match) => {
        metadata.push(match);
        return "";
      })
      .replace(IMPORT_MARKER, (match) => {
        metadata.push(match);
        return "";
      })
      .trim();    return result;
  }).filter(Boolean).join("\n").trim();

  return { displayNotes: clean, metadata, isImported: metadata.length > 0 };
}

/** Preserve the stable import markers when the owner edits visible notes. */
export function mergeLogNotes(visibleNotes: string, originalNotes: string | null | undefined) {
  const { metadata } = splitLogNotes(originalNotes);
  return [visibleNotes.trim(), ...metadata].filter(Boolean).join("\n");
}
