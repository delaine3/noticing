"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  IMPORT_TYPES, parseChatExport, type ImportConversation,
  type ImportProposal, type ImportType,
} from "../../lib/chat-import";
import { saveApprovedConversationItems, type ImportResult } from "./actions";

type Draft = {
  approved: boolean;
  title: string;
  notes: string;
  date: string;
  type: ImportType;
  waterMl: string;
  distanceKm: string;
  durationMinutes: string;
  sleepHours: string;
};

function newDraft(item: ImportProposal): Draft {
  return {
    approved: false,
    title: item.title,
    notes: item.notes,
    date: item.eventDate ?? item.reportedDate,
    type: item.type,
    waterMl: item.waterMl?.toString() ?? "",
    distanceKm: item.distanceKm?.toString() ?? "",
    durationMinutes: item.durationMinutes?.toString() ?? "",
    sleepHours: item.sleepHours?.toString() ?? "",
  };
}

async function fingerprint(source: string) {
  const bytes = new TextEncoder().encode(source);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

function numeric(v: string) {
  return v.trim() === "" ? undefined : Number(v);
}

export default function ChatImportReview() {
  const [conversations, setConversations] = useState<ImportConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showSignals, setShowSignals] = useState(false);

  const current = conversations.find((c) => c.id === selectedConversation);
  const approved = useMemo(() => current?.proposals.filter((p) => drafts[p.sourceKey]?.approved) ?? [],
    [current, drafts]);
  const candidateConversations = conversations.filter((c) => c.proposals.length > 0);
  const totalCandidates = conversations.reduce((count, c) => count + c.proposals.length, 0);

  function edit(key: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    setResult(null);
  }

  async function loadFile(file: File | undefined) {
    if (!file) return;
    setMessage("");
    setResult(null);
    setConversations([]);
    setSelectedConversation("");
    setDrafts({});
    if (file.size > 35 * 1024 * 1024) {
      setMessage("That file is too large. Please use a JSON file smaller than 35 MB.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".json")) {
      setMessage("Please select a ChatGPT export in JSON format.");
      return;
    }
    setLoading(true);
    try {
      const content: unknown = JSON.parse(await file.text());
      const parsed = parseChatExport(content);
      const proposals = parsed.flatMap((c) => c.proposals);
      const initial: Record<string, Draft> = {};
      proposals.forEach((proposal) => { initial[proposal.sourceKey] = newDraft(proposal); });
      setConversations(parsed);
      setDrafts(initial);
      setSelectedConversation(parsed.find((c) => c.proposals.length > 0)?.id ?? "");
      setMessage(parsed.length
        ? "Found " + parsed.length + " conversations. Nothing has been uploaded."
        : "I couldn't find any conversations in that file.");
    } catch (error) {
      setMessage(error instanceof Error ? "Couldn't read the file: " + error.message : "Could not read this JSON file.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!current || saving || !approved.length) return;
    if (approved.length > 25) {
      setMessage("You can save up to 25 entries at a time.");
      return;
    }
    const invalid = approved.find((p) => {
      const d = drafts[p.sourceKey];
      return !d.date || !/^\d{4}-\d{2}-\d{2}$/.test(d.date) || !d.title.trim();
    });
    if (invalid) {
      setMessage("Please add a date and title to each entry you want to save.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const items = await Promise.all(approved.map(async (proposal) => {
        const d = drafts[proposal.sourceKey];
        return {
          fingerprint: await fingerprint(proposal.sourceKey),
          logType: d.type,
          title: d.title.trim(),
          notes: d.notes.trim(),
          eventDate: d.date,
          waterMl: numeric(d.waterMl),
          distanceKm: numeric(d.distanceKm),
          durationMinutes: numeric(d.durationMinutes),
          sleepHours: numeric(d.sleepHours),
        };
      }));
      const response = await saveApprovedConversationItems(items);
      setResult(response);
      setMessage(response.saved + " saved, " + response.duplicates + " already imported or repeated." +
        (response.errors.length ? " Review errors below." : ""));
      if (!response.errors.length) {
        setDrafts((prev) => {
          const next = { ...prev };
          approved.forEach((p) => { next[p.sourceKey] = { ...next[p.sourceKey], approved: false }; });
          return next;
        });
      }
    } catch (error) {
      setMessage(error instanceof Error ? "Save failed: " + error.message : "Could not save the approved entries.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-card space-y-4">
        <h2 className="text-xl font-semibold">1. Upload your ChatGPT export</h2>
        <p className="text-sm text-[var(--ink-soft)]">
          Select <strong>conversations.json</strong> from a ChatGPT export, or a smaller
          <strong> Noticing curated JSON file</strong>. This page reads the file in your browser;
          the file and the original messages are never sent to Noticing&apos;s server.
        </p>
        <input type="file" accept=".json,application/json" aria-label="Select ChatGPT conversations.json"
          onChange={(event) => { void loadFile(event.target.files?.[0]); }}
          className="block w-full rounded-lg border border-[var(--border-soft)] bg-white/80 p-3 text-sm" />
        {loading ? <p role="status">Reading conversations on your device…</p> : null}
        {message ? <p role="status" className="rounded-lg bg-white/75 p-3 text-sm">{message}</p> : null}
        {conversations.length > 0 ? (
          <p className="text-sm">
            {candidateConversations.length} conversations with possible entries · {totalCandidates} suggestions.
            Nothing is approved automatically.
          </p>
        ) : null}
      </section>

      {candidateConversations.length ? (
        <>
          <section className="glass-card space-y-3">
            <h2 className="text-xl font-semibold">2. Find what you want to keep</h2>
            <label className="block text-sm font-medium" htmlFor="conversation-selector">Conversation or group</label>
            <select id="conversation-selector" value={selectedConversation}
              onChange={(e) => { setSelectedConversation(e.target.value); setResult(null); }}
              className="w-full rounded-lg border border-[var(--border-soft)] bg-white p-3">
              {candidateConversations.map((c) => (
                <option key={c.id} value={c.id}>{c.title} ({c.proposals.length} suggestions)</option>
              ))}
            </select>
            <p className="text-sm text-[var(--ink-soft)]">
              Raw chat extraction can miss events or misread sentences. Curated summaries are paraphrases, not original quotes. Check the source summary,
              especially dates, ownership of the activity and numerical values.
            </p>
            <button type="button" className="text-sm font-semibold text-[var(--leaf-dark)] underline"
              onClick={() => setShowSignals((v) => !v)}>
              {showSignals ? "Hide" : "Show"} potential categories to track
            </button>
            {showSignals ? (
              <div className="rounded-lg bg-white/75 p-4">
                <p className="text-sm font-semibold">Topics in this conversation</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {current?.topicSignals.length
                    ? current.topicSignals.map((s) => <li key={s}>{s}</li>)
                    : <li>No topic signals found.</li>}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">3. Review your entries</h2>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                Select only activities you can confirm. For raw chat exports, dates initially represent the message date,
                <strong> not necessarily when the event happened</strong>. Correct each date before approval.
                Avoid importing private details about other people.
              </p>
            </div>
            {current?.proposals.map((proposal) => {
              const draft = drafts[proposal.sourceKey];
              if (!draft) return null;
              return (
                <article key={proposal.sourceKey} className="glass-card space-y-4">
                  <label className="flex cursor-pointer items-center gap-3 text-base font-semibold">
                    <input type="checkbox" className="h-5 w-5 accent-[var(--leaf-dark)]"
                      checked={draft.approved}
                      onChange={(e) => edit(proposal.sourceKey, { approved: e.target.checked })} />
                    Approve this record
                  </label>
                  <div className="rounded-lg border-l-4 border-[var(--leaf)] bg-white/70 p-3 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide">From your conversation</p>
                    <p className="mt-2 break-words whitespace-pre-wrap">{proposal.messageExcerpt}</p>
                    <p className="mt-2 text-xs text-[var(--ink-soft)]">
                      Source report date: {proposal.reportedDate || "unknown"}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-medium">
                      Category
                      <select value={draft.type} onChange={(e) => edit(proposal.sourceKey, { type: e.target.value as ImportType })}
                        className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-white p-3">
                        {IMPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm font-medium">
                      Actual event date
                      <input type="date" value={draft.date} onChange={(e) => edit(proposal.sourceKey, { date: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-white p-3" />
                    </label>
                  </div>
                  <label className="block text-sm font-medium">
                    Record title
                    <input maxLength={120} value={draft.title} onChange={(e) => edit(proposal.sourceKey, { title: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-white p-3" />
                  </label>
                  <label className="block text-sm font-medium">
                    Useful note, no transcript text
                    <textarea rows={2} maxLength={1500} value={draft.notes} onChange={(e) => edit(proposal.sourceKey, { notes: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-white p-3" />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {([
                      ["distanceKm", "Distance (km)"], ["durationMinutes", "Duration (min)"],
                      ["waterMl", "Drink volume (ml)"], ["sleepHours", "Hours slept"],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="block text-sm font-medium">
                        {label}
                        <input type="number" min="0" step="any" value={draft[key]}
                          onChange={(e) => edit(proposal.sourceKey, { [key]: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-white p-2" />
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--ink-soft)]">Only the entries you approve will be saved.</p>
                </article>
              );
            })}
          </section>
          <section className="glass-card space-y-3">
            <h2 className="text-xl font-semibold">4. Save your entries</h2>
            <p className="text-sm">Approved: {approved.length} / 25 per batch. Everything else stays on your device.</p>
            <button type="button" className="submit-button disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saving || approved.length === 0 || approved.length > 25} onClick={() => void save()}>
              {saving ? "Saving approved entries…" : "Save approved entries"}
            </button>
            {result?.errors.length ? <ul className="list-disc pl-5 text-sm text-red-900">{result.errors.map((e, i) => <li key={i}>{e}</li>)}</ul> : null}
            {result?.saved ? <p className="text-sm"><Link href="/logs" className="font-semibold underline">Review saved logs</Link> or <Link href="/insights" className="font-semibold underline">explore insights</Link>.</p> : null}
          </section>
        </>
      ) : conversations.length ? (
        <section className="glass-card">
          <p>I couldn't find entries to suggest in this file. Nothing was uploaded.</p>
        </section>
      ) : null}
    </div>
  );
}
