import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeLogNotes, splitLogNotes } from "../app/lib/log-notes.ts";

const fingerprint = "a0ce3cd879968b96fc88406e4fd241d296596c0f6c17edf25f021337d633a59d";

test("hides reviewed-import labels and fingerprint but keeps actual notes", () => {
  const text = "Completed three proposals.\nApproved from reviewed import. [" + "noticing-import:" + fingerprint + "]";
  const parts = splitLogNotes(text);
  assert.equal(parts.displayNotes, "Completed three proposals.");
  assert.equal(parts.isImported, true);
  assert.deepEqual(parts.metadata, ["Approved from reviewed import.", "[noticing-import:" + fingerprint + "]"]);
});

test("handles a provenance-only note without showing a fingerprint in main content", () => {
  const parts = splitLogNotes("Approved from reviewed import. [noticing-import:" + fingerprint + "]");
  assert.equal(parts.displayNotes, "");
  assert.equal(parts.metadata.length, 2);
});

test("editing retains import identifiers for future duplicate prevention", () => {
  const before = "Old note\nApproved from ChatGPT export.\n[noticing-import:" + fingerprint + "]";
  const after = mergeLogNotes("Updated note", before);
  assert.equal(splitLogNotes(after).displayNotes, "Updated note");
  assert.ok(after.includes("[noticing-import:" + fingerprint + "]"));
  assert.ok(after.includes("Approved from ChatGPT export."));
});

test("local chat fingerprints remain hidden and survive an edit", () => {
  const before = "I walked 5 km\n[noticing-chat:4d7e8f3b-922e-48c9-8a07-9c68fc542889]";
  const after = mergeLogNotes("Walked 5.1 km", before);
  const parts = splitLogNotes(after);
  assert.equal(parts.displayNotes, "Walked 5.1 km");
  assert.equal(parts.metadata.length, 1);
});

test("ordinary note text is never stripped", () => {
  const notes = "My notes contain no import metadata.\nHours slept: 7.5";
  assert.deepEqual(splitLogNotes(notes), { displayNotes: notes, metadata: [], isImported: false });
});
