"use server";

/* Legacy actions intentionally disabled in Hoolayah.
 * Server actions cannot provide client-only journal encryption.
 * Noticing's independent production branch continues to own its original endpoints.
 */
export type JournalResult = { ok: boolean; message: string; id?: string };
type EntryPayload = {
  id: string;
  entryDate: string;
  title: string;
  body: string;
  status: "draft" | "saved";
  origin: "journal" | "checkin_draft";
};
const message = "Plaintext journal saving is disabled in Hoolayah. Open your encrypted Thought Garden.";
export async function saveJournalEntry(_payload: EntryPayload): Promise<JournalResult> {
  return { ok: false, message };
}
export async function deleteJournalEntry(_id: string): Promise<JournalResult> {
  return { ok: false, message };
}
export async function updateCheckInReflection(_id: string, _body: string): Promise<JournalResult> {
  return { ok: false, message };
}
