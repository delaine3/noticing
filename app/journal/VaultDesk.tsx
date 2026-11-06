"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { bouquetThoughts, safeMonth, shiftMonth, type ThoughtRecord } from "../lib/thought-garden";
import { ThoughtBouquet } from "./ThoughtBouquet";
import {
  VAULT_ITERATIONS, createVerifier, decryptThought, deriveVaultKey,
  encryptThought, newSalt, verifyVaultKey,
  type VaultKeyRecord, type VaultPlaintext,
} from "../lib/vault-crypto";

type VaultRow = {
  id: string; user_id: string; entry_date: string; status: "draft" | "saved";
  origin: "journal" | "legacy_journal" | "legacy_checkin";
  source_id: string | null; iv: string; ciphertext: string; updated_at: string;
};
type OpenedRow = VaultRow & VaultPlaintext;
type Legacy = {
  id: string; kind: "legacy_journal" | "legacy_checkin";
  date: string; title: string; body: string; status: "draft" | "saved";
};
function asMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
function formatDate(date: string) {
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}
function isValidDay(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value + "T00:00:00Z"));
}
async function fetchAll(table: "journal_entries" | "wellness_checkins",
  columns: string, userId: string): Promise<Record<string, unknown>[]> {
  const result: Record<string, unknown>[] = [];
  for (let offset = 0; offset < 10000; offset += 500) {
    const query = supabase.from(table).select(columns).eq("user_id", userId).range(offset, offset + 499);
    const { data, error } = await query;
    if (error) throw new Error("Could not read old entries. Nothing was removed.");
    const rows = (data ?? []) as unknown as Record<string, unknown>[];
    result.push(...rows);
    if (rows.length < 500) return result;
  }
  throw new Error("More than 10,000 old entries. Contact support to migrate them in batches.");
}
async function readLegacy(userId: string): Promise<Legacy[]> {
  const [journals, checkins] = await Promise.all([
    fetchAll("journal_entries", "id,entry_date,title,body,status", userId),
    fetchAll("wellness_checkins", "id,local_date,thought_detail", userId),
  ]);
  return [
    ...journals.filter(x => typeof x.body === "string" && x.body.length > 0).map(x => ({
      id: String(x.id), kind: "legacy_journal" as const, date: String(x.entry_date),
      title: String(x.title), body: String(x.body),
      status: x.status === "draft" ? "draft" as const : "saved" as const,
    })),
    ...checkins.filter(x => typeof x.thought_detail === "string" && x.thought_detail.length > 0).map(x => ({
      id: String(x.id), kind: "legacy_checkin" as const, date: String(x.local_date),
      title: "Check-in reflection", body: String(x.thought_detail), status: "saved" as const,
    })),
  ];
}

export function VaultDesk({ today, initialMonth }: { today: string; initialMonth: string }) {
  const month = safeMonth(initialMonth, today.slice(0, 7));
  const keyRef = useRef<CryptoKey | null>(null);
  const [userId, setUserId] = useState("");
  const [config, setConfig] = useState<VaultKeyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [rows, setRows] = useState<OpenedRow[]>([]);
  const [failedRows, setFailedRows] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [legacy, setLegacy] = useState<Legacy[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("A thought from today");
  const [body, setBody] = useState("");
  const [entryDate, setEntryDate] = useState(today);
  const [draft, setDraft] = useState(false);

  const load = useCallback(async (id: string, key: CryptoKey) => {
    const { data, error } = await supabase.from("hoolayah_vault_entries")
      .select("id,user_id,entry_date,status,origin,source_id,iv,ciphertext,updated_at")
      .eq("user_id", id).gte("entry_date", month + "-01")
      .lt("entry_date", new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 1)).toISOString().slice(0, 10))
      .order("updated_at", { ascending: false }).limit(500);
    if (error) throw new Error("Could not load encrypted entries.");
    const out: OpenedRow[] = [];
    let failures = 0;
    for (const row of (data ?? []) as VaultRow[]) {
      try {
        out.push({ ...row, ...await decryptThought(key, id, row.id, row) });
      } catch { failures++; }
    }
    setRows(out.sort((a, b) => b.entry_date.localeCompare(a.entry_date) || b.updated_at.localeCompare(a.updated_at)));
    setFailedRows(failures);
  }, [month]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) throw new Error("Sign in before opening your Thought Garden.");
        if (user.email?.toLowerCase() === "demo@noticing.com")
          throw new Error("A shared demo account cannot hold a private vault. Use a personal account.");
        const { data, error: readError } = await supabase.from("hoolayah_vault_keys")
          .select("salt,verifier_iv,verifier_ciphertext,kdf_iterations")
          .eq("user_id", user.id).maybeSingle();
        if (readError) throw new Error("The private vault is unavailable.");
        if (active) { setUserId(user.id); setConfig(data as VaultKeyRecord | null); }
      } catch (e) { if (active) setNotice(asMessage(e)); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; keyRef.current = null; };
  }, []);
  useEffect(() => {
    if (!unlocked || !userId || !keyRef.current) return;
    void load(userId, keyRef.current).catch(e => setNotice(asMessage(e)));
  }, [load, unlocked, userId]);

  async function unlockOrCreate() {
    if (busy || !userId || passphrase.length < 12) {
      setNotice("Use a unique passphrase at least 12 characters long."); return;
    }
    if (!config && passphrase !== confirmation) { setNotice("Passphrases do not match."); return; }
    setBusy(true); setNotice("");
    try {
      if (!config && !window.confirm(
        "Your vault passphrase cannot be reset by Hoolayah. If you lose it, your encrypted diary cannot be recovered. Have you saved it safely?"
      )) return;
      const setup = config ?? {
        salt: newSalt(), kdf_iterations: VAULT_ITERATIONS,
        verifier_iv: "", verifier_ciphertext: "",
      };
      const key = await deriveVaultKey(passphrase, setup);
      if (config) {
        if (!await verifyVaultKey(key, config)) throw new Error("Incorrect passphrase, or the vault record has been corrupted.");
      } else {
        const verifier = await createVerifier(key);
        const record = { ...setup, verifier_iv: verifier.iv, verifier_ciphertext: verifier.ciphertext };
        const { error } = await supabase.from("hoolayah_vault_keys").insert({ user_id: userId, ...record });
        if (error) throw new Error("Could not create the vault. Refresh before retrying.");
        setConfig(record);
      }
      keyRef.current = key;
      setPassphrase(""); setConfirmation(""); setUnlocked(true);
      await load(userId, key);
      setNotice("Vault unlocked on this device. Your passphrase was not uploaded.");
    } catch(e) { setNotice(asMessage(e)); }
    finally { setBusy(false); }
  }

  async function saveEntry() {
    if (busy || !keyRef.current || !userId || !body.trim() || !title.trim() ||
        !isValidDay(entryDate) || entryDate > today || body.length > 12000 || title.length > 160) {
      setNotice("Enter a title, a valid date, and up to 12,000 characters."); return;
    }
    const key = keyRef.current; setBusy(true); setNotice("");
    try {
      const previous = rows.find(row => row.id === editingId);
      const id = editingId ?? crypto.randomUUID();
      const cipher = await encryptThought(key, userId, id, { title: title.trim(), body });
      const payload = {
        id, user_id: userId, entry_date: entryDate,
        status: draft ? "draft" : "saved",
        origin: previous?.origin ?? "journal",
        source_id: previous?.source_id ?? null, ...cipher, updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("hoolayah_vault_entries").upsert(payload, { onConflict: "id" });
      if (error) throw new Error("Could not save encrypted entry.");
      setEditingId(null); setTitle("A thought from today"); setBody(""); setEntryDate(today); setDraft(false);
      await load(userId, key);
      setNotice("Saved. Supabase received only encrypted text.");
    } catch(e) { setNotice(asMessage(e)); }
    finally { setBusy(false); }
  }

  async function deleteEntry(id: string) {
    if (busy || !userId || !keyRef.current ||
      !window.confirm("Permanently delete this encrypted entry? This cannot be undone.")) return;
    setBusy(true); setNotice("");
    const { error } = await supabase.from("hoolayah_vault_entries").delete()
      .eq("id", id).eq("user_id", userId);
    if (error) setNotice("Could not delete this entry.");
    else {
      if (editingId === id) { setEditingId(null); setTitle("A thought from today"); setBody(""); }
      await load(userId, keyRef.current).catch(e => setNotice(asMessage(e)));
      setNotice("Encrypted entry deleted.");
    }
    setBusy(false);
  }

  async function inspectLegacy() {
    if (busy || !userId) return;
    setBusy(true); setNotice("");
    try {
      const result = await readLegacy(userId);
      setLegacy(result);
      setNotice(result.length ? "Review the warning before migrating." : "No old plaintext reflections found.");
    } catch(e) { setNotice(asMessage(e)); }
    finally { setBusy(false); }
  }
  async function migrate() {
    if (busy || !userId || !keyRef.current || !legacy?.length) return;
    if (!window.confirm(
      "This copies old reflections into your encrypted vault, verifies them, then DELETES their plaintext originals from the SHARED database. Old diary pages and check-in writing will disappear from Noticing too. Check-in scores remain. Continue?"
    )) return;
    setBusy(true); setNotice("");
    const key = keyRef.current;
    let protectedCount = 0; let retained = 0;
    try {
      // Refresh before migrating to reduce the window for concurrent edits in Noticing.
      const current = await readLegacy(userId);
      for (const item of current) {
        try {
          const { data: prior, error: priorError } = await supabase.from("hoolayah_vault_entries")
            .select("id").eq("user_id", userId).eq("origin", item.kind)
            .eq("source_id", item.id).maybeSingle();
          if (priorError) throw new Error("Lookup failed.");
          const id = prior?.id ?? crypto.randomUUID();
          const cipher = await encryptThought(key, userId, id, { title: item.title, body: item.body });
          const { error: putError } = await supabase.from("hoolayah_vault_entries").upsert({
            id, user_id: userId, entry_date: item.date, status: item.status,
            origin: item.kind, source_id: item.id, ...cipher, updated_at: new Date().toISOString(),
          }, { onConflict: "user_id,origin,source_id" });
          if (putError) throw new Error("Encrypted write failed.");
          const { data: saved, error: verifyError } = await supabase.from("hoolayah_vault_entries")
            .select("id,iv,ciphertext").eq("user_id", userId)
            .eq("origin", item.kind).eq("source_id", item.id).single();
          if (verifyError || !saved) throw new Error("Could not verify protected copy.");
          const decoded = await decryptThought(key, userId, saved.id, saved);
          if (decoded.body !== item.body || decoded.title !== item.title)
            throw new Error("Verification mismatch.");
          // Compare-and-delete: concurrent edits must stay in plaintext until explicitly re-migrated.
          if (item.kind === "legacy_journal") {
            const { data: deleted, error } = await supabase.from("journal_entries")
              .delete().eq("user_id", userId).eq("id", item.id)
              .eq("title", item.title).eq("body", item.body)
              .select("id");
            if (error || deleted?.length !== 1) throw new Error("Source changed or could not be deleted.");
          } else {
            const { data: cleared, error } = await supabase.from("wellness_checkins")
              .update({ thought_detail: null }).eq("user_id", userId)
              .eq("id", item.id).eq("thought_detail", item.body).select("id");
            if (error || cleared?.length !== 1) throw new Error("Source changed or could not be cleared.");
          }
          protectedCount++;
        } catch { retained++; } // Never delete old content if encryption, verification or cleanup fails.
      }
      setLegacy(null);
      await load(userId, key);
      setNotice(protectedCount + " entries verified and removed from plaintext storage. " +
        retained + " old entries still need attention. Existing backups may retain earlier plaintext.");
    } catch(e) { setNotice("Migration stopped: " + asMessage(e) + ". Old entries were not bulk deleted."); }
    finally { setBusy(false); }
  }

  const written = rows.filter(row => row.body.trim());
  const forBouquet: ThoughtRecord[] = rows.map(row => ({
    id: row.id, kind: "journal", title: row.title, body: row.body,
    entryDate: row.entry_date, recordedAt: row.updated_at,
    topic: "journal", status: row.status,
  }));
  const flowers = bouquetThoughts(forBouquet);
  const [year, mon] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const complete = month < today.slice(0, 7) ||
    (month === today.slice(0, 7) && Number(today.slice(-2)) === lastDay);

  return (
    <main className="min-h-screen px-4 py-9 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f8868]">Hoolayah · Private diary</p>
        <h1 className="text-4xl font-semibold text-[#284f3b] sm:text-5xl">The Thought Garden 🌷</h1>
        <p className="max-w-3xl text-sm text-[#556a59]">
          Private entries are encrypted on this device before upload. The vault passphrase stays in memory
          and is never sent to Hoolayah or Supabase. Dates and entry status remain visible to the database.
        </p>
        <div className="flex flex-wrap gap-3"><Link href="/" className="secondary-button">Today</Link>
          <Link href="/check-in" className="secondary-button">Check-in</Link>
          <Link href="/privacy" className="secondary-button">Privacy</Link>
        </div>
        {notice ? <p role="status" className="rounded-xl border border-[#cbd9c5] bg-white p-4 text-sm">{notice}</p> : null}
        {loading ? <p>Loading your vault…</p> : !unlocked ? (
          <section className="glass-card max-w-xl space-y-4 p-6">
            <h2 className="text-2xl font-semibold">{config ? "Unlock your diary" : "Create your private vault"}</h2>
            <p className="text-sm">
              {config ? "Enter the separate passphrase you created for this vault." :
                "Use a long, unique passphrase and save it in a password manager. Nobody, including the app operator, can recover your journal without it."}
            </p>
            {userId ? (
              <form onSubmit={e => { e.preventDefault(); void unlockOrCreate(); }} className="space-y-3">
                <label className="block text-sm">Vault passphrase
                  <input type="password" autoComplete="off" required minLength={12}
                    value={passphrase} onChange={e => setPassphrase(e.target.value)}
                    className="mt-1 w-full rounded-xl border p-3" />
                </label>
                {!config ? <label className="block text-sm">Repeat vault passphrase
                  <input type="password" autoComplete="off" required minLength={12}
                    value={confirmation} onChange={e => setConfirmation(e.target.value)}
                    className="mt-1 w-full rounded-xl border p-3" />
                </label> : null}
                <button type="submit" disabled={busy} className="submit-button">
                  {busy ? "Processing…" : config ? "Unlock vault" : "Create encrypted vault"}
                </button>
              </form>
            ) : null}
            <p className="text-xs text-[#845b4c]">Losing this passphrase means losing access to your encrypted journal. This vault is separate from your login password.</p>
          </section>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#52705d]">🔒 Unlocked in this tab. No key is saved to local storage.</p>
              <button className="secondary-button" type="button" onClick={() => {
                keyRef.current = null; setUnlocked(false); setRows([]); setLegacy(null);
                setBody(""); setEditingId(null); setNotice("Vault locked.");
              }}>Lock now</button>
            </div>
            <section className="rounded-3xl border border-[#cbd9c5] bg-[#f9fcf3] p-5 sm:p-7 space-y-3">
              <h2 className="text-2xl font-semibold">{editingId ? "Edit encrypted thought" : "Plant a thought 🌱"}</h2>
              <p className="text-sm">Your words and title are encrypted before saving. Press Save explicitly; unsaved writing stays only in this tab.</p>
              <label className="block text-sm font-semibold">Title
                <input className="mt-1 w-full rounded-xl border p-3" maxLength={160}
                  value={title} onChange={e => setTitle(e.target.value)} />
              </label>
              <label className="block text-sm font-semibold">Date
                <input className="mt-1 rounded-xl border p-3" type="date" value={entryDate}
                  max={today} onChange={e => setEntryDate(e.target.value)} />
              </label>
              <label className="block text-sm font-semibold">Your thoughts
                <textarea className="mt-1 w-full rounded-xl border p-3 leading-relaxed" rows={7}
                  maxLength={12000} value={body} onChange={e => setBody(e.target.value)} />
              </label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft}
                onChange={e => setDraft(e.target.checked)} />Save as unfinished draft</label>
              <div className="flex flex-wrap gap-3">
                <button disabled={busy || !body.trim()} type="button" className="submit-button" onClick={() => void saveEntry()}>
                  {busy ? "Encrypting…" : editingId ? "Save encrypted changes" : "Save encrypted thought"}
                </button>
                {editingId ? <button type="button" className="secondary-button" onClick={() => {
                  setEditingId(null); setBody(""); setTitle("A thought from today"); setEntryDate(today); setDraft(false);
                }}>Cancel edit</button> : null}
              </div>
            </section>
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
              <h2 className="font-semibold">Protect older entries</h2>
              <p className="text-sm">Older Noticing journal pages and check-in writing remain readable to database administrators until you migrate them. Migration is optional and affects Noticing too because the two apps share a database.</p>
              <button type="button" disabled={busy} className="secondary-button" onClick={() => void inspectLegacy()}>
                Review old plaintext entries
              </button>
              {legacy !== null ? <div className="space-y-2 text-sm">
                <p>{legacy.length} written entries are still stored as plaintext.</p>
                {legacy.length > 0 ? <button disabled={busy} type="button"
                  className="submit-button" onClick={() => void migrate()}>
                  Encrypt, verify, then remove plaintext originals
                </button> : null}
                <p>Before removal, every encrypted copy is read back and decrypted locally to verify its contents. Interrupted migrations can be retried. Database backups may still contain older versions.</p>
              </div> : null}
            </section>
            <nav className="flex justify-between items-center gap-3" aria-label="Diary months">
              <Link className="secondary-button" href={`/journal?month=${shiftMonth(month, -1)}`}>← Previous</Link>
              <strong>{new Date(month + "-01T12:00:00Z").toLocaleDateString("en-US", {
                month: "long", year: "numeric", timeZone: "UTC",
              })}</strong>
              {month < today.slice(0, 7) ? <Link className="secondary-button"
                href={`/journal?month=${shiftMonth(month, 1)}`}>Next →</Link> : <span />}
            </nav>
            <section className="rounded-3xl bg-[#eaf4e6] p-5 sm:p-7 space-y-4">
              <h2 className="text-2xl font-semibold">Your Thought Garden 🌸</h2>
              <p className="text-sm">{written.length} encrypted written thoughts this month.</p>
              {failedRows ? <p role="alert" className="text-sm text-red-800">
                {failedRows} entries could not be decrypted. They have not been deleted.
              </p> : null}
              {!rows.length ? <p className="rounded-xl bg-white/70 p-5">No encrypted entries this month yet.</p> : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {rows.map(item => <article key={item.id} className="rounded-2xl bg-white p-4 space-y-3">
                    <p className="text-xs text-[#6b806d]">{formatDate(item.entry_date)} · {item.status === "draft" ? "Draft" : "Saved"}</p>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">{item.body}</p>
                    <div className="flex gap-4 text-sm">
                      <button type="button" className="underline" onClick={() => {
                        setEditingId(item.id); setTitle(item.title); setBody(item.body);
                        setEntryDate(item.entry_date); setDraft(item.status === "draft");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}>Edit</button>
                      <button type="button" disabled={busy} className="text-red-800 underline"
                        onClick={() => void deleteEntry(item.id)}>Delete</button>
                    </div>
                  </article>)}
                </div>
              )}
            </section>
            {complete ? <section className="rounded-3xl border border-[#e3c6b5] bg-[#fff6ee] p-5">
              <h2 className="text-2xl font-semibold">Your monthly thought bouquet 💐</h2>
              {flowers.length ? <ThoughtBouquet month={month} flowers={flowers}
                total={rows.filter(row => row.status === "saved" && row.body.trim()).length} /> :
                <p className="text-sm">Your bouquet grows as you save finished reflections.</p>}
            </section> : <p className="text-center text-sm">🌸 Your monthly bouquet blooms on the last day of the month.</p>}
          </>
        )}
      </div>
    </main>
  );
}
