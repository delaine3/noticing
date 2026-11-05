"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "../lib/supabase-server";

export type JournalResult = { ok: boolean; message: string; id?: string };
type EntryPayload = {
  id: string;
  entryDate: string;
  title: string;
  body: string;
  status: "draft" | "saved";
  origin: "journal" | "checkin_draft";
};

const uuid = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
function validDay(value: string) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value &&
    date.getUTCFullYear() >= 2000 && date.getTime() <= Date.now() + 86400000;
}
function validText(body: string) {
  return typeof body === "string" && body.length <= 12000;
}
function refreshJournal() {
  revalidatePath("/journal");
  revalidatePath("/insights/mind");
  revalidatePath("/check-in");
}
function failure(message: string, code?: string): JournalResult {
  return { ok: false, message: code === "42P01" || code === "PGRST205"
    ? "Journal storage needs its Supabase migration. Your existing check-ins remain intact."
    : message };
}

/** Save or autosave a private journal thought. Ownership is enforced by RLS and user filter. */
export async function saveJournalEntry(payload: EntryPayload): Promise<JournalResult> {
  if (!payload || typeof payload.id !== "string" || !uuid.test(payload.id) ||
      !validDay(payload.entryDate) || !validText(payload.body) ||
      typeof payload.title !== "string" || payload.title.trim().length < 1 ||
      payload.title.length > 160 ||
      !["draft", "saved"].includes(payload.status) ||
      !["journal", "checkin_draft"].includes(payload.origin) ||
      (payload.status === "saved" && !payload.body.trim())) {
    return failure("Check the date, title and text before saving.");
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return failure("Sign in to save your journal.");
  const fields = {
    entry_date: payload.entryDate,
    title: payload.title.trim(),
    body: payload.body,
    status: payload.status,
    origin: payload.origin,
    updated_at: new Date().toISOString(),
  };
  const { data: existing, error: readError } = await supabase.from("journal_entries")
    .select("id").eq("id", payload.id).eq("user_id", user.id).maybeSingle();
  if (readError) return failure("Unable to check the journal entry.", readError.code);
  if (existing) {
    const { error } = await supabase.from("journal_entries").update(fields)
      .eq("id", payload.id).eq("user_id", user.id);
    if (error) return failure("Could not update your thought.", error.code);
  } else {
    const { error } = await supabase.from("journal_entries")
      .insert({ id: payload.id, user_id: user.id, ...fields });
    if (error) return failure("Could not save your thought.", error.code);
  }
  if (payload.status === "saved") refreshJournal();
  return { ok: true, id: payload.id, message: payload.status === "draft" ? "Draft saved." : "Thought saved to your journal." };
}

export async function deleteJournalEntry(id: string): Promise<JournalResult> {
  if (typeof id !== "string" || !uuid.test(id)) return failure("Invalid entry.");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return failure("Sign in first.");
  const { error } = await supabase.from("journal_entries")
    .delete().eq("id", id).eq("user_id", user.id);
  if (error) return failure("Unable to delete the journal entry.", error.code);
  refreshJournal();
  return { ok: true, message: "Thought deleted." };
}

/** Editing or erasing a reflection must never silently erase its check-in scores. */
export async function updateCheckInReflection(id: string, body: string): Promise<JournalResult> {
  if (typeof id !== "string" || !uuid.test(id) || !validText(body))
    return failure("Invalid reflection (maximum 12,000 characters).");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return failure("Sign in first.");
  const { data, error } = await supabase.from("wellness_checkins")
    .update({ thought_detail: body.trim() || null })
    .eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
  if (error || !data) return failure("Could not update that check-in reflection.", error?.code);
  refreshJournal();
  return { ok: true, message: body.trim() ? "Reflection updated." : "Reflection deleted; check-in scores retained." };
}
