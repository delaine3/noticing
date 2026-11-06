"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { bouquetThoughts, safeMonth, shiftMonth, type ThoughtRecord } from "../lib/thought-garden";
import { ThoughtBouquet } from "./ThoughtBouquet";
import { decryptThought, encryptThought, type VaultPlaintext } from "../lib/vault-crypto";
import {
  hasRecovery, makeNewVault, unlockRecoverableVault, resetVaultWithRecovery,
  replaceRecoveryCodeWithPassphrase, type RecoverableVaultRecord,
} from "../lib/vault-recovery";

type VaultRow = {
  id: string; user_id: string; entry_date: string; status: "draft" | "saved";
  origin: "journal" | "legacy_journal" | "legacy_checkin";
  source_id: string | null; iv: string; ciphertext: string; updated_at: string;
};
type OpenedRow = VaultRow & VaultPlaintext;
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
export function VaultDesk({ today, initialMonth }: { today: string; initialMonth: string }) {
  const month = safeMonth(initialMonth, today.slice(0, 7));
  const keyRef = useRef<CryptoKey | null>(null);
  const [userId, setUserId] = useState("");
  const [config, setConfig] = useState<RecoverableVaultRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [rows, setRows] = useState<OpenedRow[]>([]);
  const [failedRows, setFailedRows] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryInput, setRecoveryInput] = useState("");
  const [newPassphrase, setNewPassphrase] = useState("");
  const [newConfirmation, setNewConfirmation] = useState("");
  const [showRecover, setShowRecover] = useState(false);
  const [managePassphrase, setManagePassphrase] = useState("");
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
    // An earlier request must not show decrypted text after the user locks the vault.
    if (keyRef.current !== key) return;
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
          .select("salt,verifier_iv,verifier_ciphertext,kdf_iterations,vault_version,wrapped_key_iv,wrapped_key_ciphertext,recovery_salt,recovery_iv,recovery_ciphertext")
          .eq("user_id", user.id).maybeSingle();
        if (readError) throw new Error("The private vault is unavailable.");
        if (active) { setUserId(user.id); setConfig(data as RecoverableVaultRecord | null); }
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
      let key: CryptoKey;
      if (config) {
        key = await unlockRecoverableVault(passphrase, config);
      } else {
        const setup = await makeNewVault(passphrase);
        const { error } = await supabase.from("hoolayah_vault_keys")
          .insert({ user_id: userId, ...setup.record });
        if (error) throw new Error("Could not create the private diary. Refresh before retrying.");
        key = setup.key;
        setConfig(setup.record);
        setRecoveryCode(setup.recoveryCode);
      }
      keyRef.current = key;
      setPassphrase(""); setConfirmation(""); setUnlocked(true);
      await load(userId, key);
      setNotice("Diary unlocked. Your passphrase and recovery code stay on your device.");
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
      setNotice("Saved. Your words were locked on this device before being stored online.");
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

  async function recoverVault() {
    if (busy || !userId || !config || !hasRecovery(config)) return;
    if (newPassphrase.length < 12 || newPassphrase !== newConfirmation) {
      setNotice("New passphrase must be at least 12 characters and match the confirmation.");
      return;
    }
    setBusy(true); setNotice("");
    try {
      const restored = await resetVaultWithRecovery(recoveryInput, newPassphrase, config);
      const { data, error } = await supabase.from("hoolayah_vault_keys")
        .update(restored.record).eq("user_id", userId)
        .eq("verifier_ciphertext", config.verifier_ciphertext)
        .select("user_id").single();
      if (error || !data) throw new Error("Could not save your new diary passphrase. Your existing recovery code still applies.");
      keyRef.current = restored.key;
      setConfig(restored.record);
      setRecoveryCode(restored.recoveryCode);
      setRecoveryInput(""); setNewPassphrase(""); setNewConfirmation("");
      setShowRecover(false); setUnlocked(true);
      await load(userId, restored.key);
      setNotice("Passphrase changed. Save your NEW recovery code. The previous code no longer works with active records.");
    } catch (error) { setNotice(asMessage(error)); }
    finally { setBusy(false); }
  }

  async function renewRecovery() {
    if (busy || !userId || !config || managePassphrase.length < 12) {
      setNotice("Enter your current diary passphrase first."); return;
    }
    setBusy(true); setNotice("");
    try {
      const updated = await replaceRecoveryCodeWithPassphrase(managePassphrase, config);
      const { data, error } = await supabase.from("hoolayah_vault_keys")
        .update(updated.record).eq("user_id", userId)
        .eq("verifier_ciphertext", config.verifier_ciphertext)
        .select("user_id").single();
      if (error || !data) throw new Error("Could not save recovery settings. Your existing passphrase still works.");
      setConfig(updated.record); setRecoveryCode(updated.recoveryCode); setManagePassphrase("");
      setNotice("Recovery code updated. Save the NEW code. Older codes no longer work with the active vault.");
    } catch(error) { setNotice(asMessage(error)); }
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
          When you save a Thought Garden entry, your device locks its words before sending it to
          online storage. The people running Hoolayah cannot read the protected writing just by
          opening the saved records. Only you have your diary passphrase. We can still see basic
          details, such as when an entry was written.
        </p>
        <div className="flex flex-wrap gap-3"><Link href="/" className="secondary-button">Today</Link>
          <Link href="/check-in" className="secondary-button">Check-in</Link>
          <Link href="/privacy" className="secondary-button">Privacy</Link>
        </div>
        {notice ? <p role="status" className="rounded-xl border border-[#cbd9c5] bg-white p-4 text-sm">{notice}</p> : null}
        <section aria-labelledby="how-your-diary-is-protected" className="rounded-2xl border border-[#cbd9c5] bg-white/85 p-5 space-y-3 text-sm">
          <h2 id="how-your-diary-is-protected" className="text-lg font-semibold">Who can read my diary? 🔒</h2>
          <p><strong>Can Hoolayah&apos;s owner read my diary?</strong> Not by opening the saved records. Your new Thought Garden entries are locked on your device first. We can see that an entry exists, but its title and words are unreadable without the secret that unlocks them.</p>
          <p><strong>Can I reset my diary passphrase?</strong> Yes, using the personal recovery code supplied when you protect your diary. Only you can use that code. We never receive your passphrase, recovery code or diary key, and cannot retrieve them. Without either your passphrase or recovery code, your writing cannot be recovered.</p>
          <p><strong>Is everything in Hoolayah locked this way?</strong> No. This protection covers Thought Garden writing. Account details, everyday activity logs, check-in scores, assistant messages, and entry dates are not locked by your diary passphrase.</p>
          <p className="text-xs text-[#5f6f62]">A compromised device or harmful website update could still expose your writing when you unlock it. Read our <Link href="/privacy" className="underline">privacy notice</Link> for the limits.</p>
        </section>
        {loading ? <p>Loading your vault…</p> : !unlocked ? (
          <section className="glass-card max-w-xl space-y-4 p-6">
            <h2 className="text-2xl font-semibold">{config ? "Unlock your diary" : "Create your private vault"}</h2>
            <p className="text-sm">
              {config ? "Enter the separate passphrase you created for this vault." :
                "Create a separate, long passphrase. You will also receive a one-time recovery code. Keep both in a safe place, ideally a password manager."}
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
            {config && hasRecovery(config) ? (
              <button type="button" onClick={() => setShowRecover(open => !open)}
                className="text-sm font-semibold underline" disabled={busy}>
                {showRecover ? "Use my diary passphrase instead" : "Forgot diary passphrase? Use recovery code"}
              </button>
            ) : null}
            {showRecover && config && hasRecovery(config) ? (
              <form onSubmit={e => { e.preventDefault(); void recoverVault(); }} className="space-y-3 rounded-xl border p-4">
                <p className="font-semibold">Reset your diary passphrase</p>
                <p className="text-xs">Your recovery code was shown when your diary was secured. We cannot look it up.</p>
                <label className="block text-sm">Recovery code
                  <input className="mt-1 w-full rounded-xl border p-3 font-mono text-xs" type="password"
                    autoComplete="off" required value={recoveryInput} onChange={e => setRecoveryInput(e.target.value)} />
                </label>
                <label className="block text-sm">New diary passphrase
                  <input className="mt-1 w-full rounded-xl border p-3" type="password" minLength={12} required
                    autoComplete="new-password" value={newPassphrase} onChange={e => setNewPassphrase(e.target.value)} />
                </label>
                <label className="block text-sm">Repeat new passphrase
                  <input className="mt-1 w-full rounded-xl border p-3" type="password" minLength={12} required
                    autoComplete="new-password" value={newConfirmation} onChange={e => setNewConfirmation(e.target.value)} />
                </label>
                <button className="submit-button" disabled={busy} type="submit">Reset passphrase with recovery code</button>
              </form>
            ) : null}
            <p className="text-xs text-[#845b4c]">Your diary passphrase is separate from sign-in. If both passphrase and recovery code are lost, your writing cannot be recovered.</p>
          </section>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#52705d]">🔒 Unlocked in this tab. No key is saved to local storage.</p>
              <button className="secondary-button" type="button" disabled={busy} onClick={() => {
                keyRef.current = null; setUnlocked(false); setRows([]); setRecoveryCode("");
                setManagePassphrase(""); setBody(""); setEditingId(null); setNotice("Diary locked.");
              }}>Lock now</button>
            </div>
            {recoveryCode ? (
              <section className="rounded-2xl border-2 border-amber-500 bg-amber-50 p-5 space-y-3" aria-label="Your one-time recovery code">
                <h2 className="text-lg font-semibold">Save your recovery code 🔑</h2>
                <p className="text-sm">This code lets you reset your diary passphrase without revealing your writing to us. It is displayed only now. Copy it into a password manager or another secure offline location.</p>
                <p className="break-all rounded-lg bg-white p-3 font-mono text-sm select-all" aria-label="One-time recovery code">{recoveryCode}</p>
                <div className="flex gap-3 flex-wrap">
                  <button type="button" className="secondary-button" onClick={() => void navigator.clipboard.writeText(recoveryCode)
                    .catch(() => setNotice("Clipboard unavailable. Select and copy the code manually."))}>Copy code</button>
                  <button type="button" className="secondary-button" onClick={() => setRecoveryCode("")}>I have saved my code</button>
                </div>
                <p className="text-xs">Anyone with this code and access to your account could unlock your diary. Never share it.</p>
              </section>
            ) : null}
            <section className="rounded-2xl border border-[#cbd9c5] bg-white p-5 space-y-3">
              <h2 className="font-semibold">Recovery settings</h2>
              <p className="text-sm">{config && hasRecovery(config)
                ? "You can replace your recovery code here if you still know your diary passphrase."
                : "Enable a recovery code for this diary. Your writing will stay encrypted and existing entries will not be changed."}</p>
              <form onSubmit={e => { e.preventDefault(); void renewRecovery(); }} className="flex flex-col gap-2 sm:flex-row">
                <label className="flex-1 text-sm">Current diary passphrase
                  <input type="password" autoComplete="off" minLength={12} required
                    className="mt-1 w-full rounded-xl border p-3" value={managePassphrase}
                    onChange={e => setManagePassphrase(e.target.value)} />
                </label>
                <button className="secondary-button self-end" type="submit" disabled={busy}>
                  {config && hasRecovery(config) ? "Replace recovery code" : "Create recovery code"}
                </button>
              </form>
            </section>
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
