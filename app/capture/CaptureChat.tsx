"use client";

import { useState } from "react";
import Link from "next/link";
import {
  areaForType, captureNumberValid, limits, optionalFields,
  type CaptureAnalysis, type CaptureDraft, type CaptureMessage,
  type CaptureType, validCaptureDraft,
} from "../lib/capture-types";
import { actionTypes } from "../lib/log-types";
import { insightAreas } from "../lib/insight-categories";
import { saveCaptureDrafts } from "./actions";

const metricLabels = {
  water_amount_ml: "Drink (ml)",
  treadmill_distance_km: "Treadmill distance (km)",
  treadmill_duration_minutes: "Treadmill time (min)",
  sleep_hours: "Sleep hours",
  duration_minutes: "Duration (min)",
  mood_score: "Mood (1–10)",
  energy_score: "Energy (1–10)",
  intensity_score: "Stress / intensity (1–10)",
};

function dateToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function draftFromAI(record: CaptureAnalysis["proposed_records"][number]): CaptureDraft {
  return { ...record, id: crypto.randomUUID(), approved: false };
}

export default function CaptureChat() {
  const [messages, setMessages] = useState<CaptureMessage[]>([]);
  const [input, setInput] = useState("");
  const [drafts, setDrafts] = useState<CaptureDraft[]>([]);
  const [question, setQuestion] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [savedCount, setSavedCount] = useState(0);

  function edit(id: string, patch: Partial<CaptureDraft>) {
    setDrafts((old) => old.map((item) => item.id === id ? { ...item, ...patch } : item));
    setNotice("");
  }

  async function send() {
    const text = input.trim();
    if (!text || busy || !consent) return;
    const conversation = [...messages, { role: "user" as const, content: text }].slice(-10);
    setBusy(true);
    setNotice("");
    setErrors([]);
    try {
      const response = await fetch("/api/capture/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent: true,
          messages: conversation,
          localDate: dateToday(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        }),
      });
      const payload = await response.json() as CaptureAnalysis & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not process message.");
      setMessages([...conversation, { role: "assistant" as const, content: payload.reply }].slice(-10));
      setInput("");
      // The model returns an updated draft set, not additional records to append indefinitely.
      // Preserve user corrections only until another analysis is requested.
      setDrafts(payload.proposed_records.map(draftFromAI));
      setQuestion(payload.follow_up_question);
      setSavedCount(0);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not process your message.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (busy || saving) return;
    const selected = drafts.filter((item) => item.approved);
    if (!selected.length) { setNotice("Approve at least one record first."); return; }
    const invalid = selected.map((item, index) => ({ index, error: validCaptureDraft(item) }))
      .find((result) => result.error);
    if (invalid) {
      setNotice("Record " + (invalid.index + 1) + ": " + invalid.error);
      return;
    }
    setSaving(true);
    setNotice("");
    setErrors([]);
    try {
      const result = await saveCaptureDrafts(selected);
      setSavedCount(result.saved);
      setErrors(result.errors);
      setNotice(result.saved + " saved. " + result.duplicates +
        " already present. " + result.errors.length + " failed.");
      if (result.errors.length === 0) {
        // Prevent accidentally saving the same draft again while retaining a view of what was recorded.
        setDrafts([]);
        setQuestion(null);
        setMessages([]);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="glass-card flex flex-col gap-4 p-5">
        <h2 className="text-xl font-bold">Tell Noticing what happened</h2>
        <p className="text-sm text-[var(--ink-soft)]">
          Write naturally. For example: “Today I walked 8 km, watered the garden and sent three proposals.”
          The assistant will identify potential records and ask a question when it needs a useful missing detail.
        </p>
        <div role="log" aria-live="polite" aria-label="Conversation" className="max-h-[420px] min-h-40 space-y-3 overflow-y-auto rounded-lg bg-white/60 p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">No messages yet. Tell Noticing what you did, experienced, or completed.</p>
          ) : messages.map((message, index) => (
            <div key={index} className={`rounded-lg p-3 text-sm ${message.role === "user" ? "ml-5 bg-emerald-50" : "mr-5 bg-white"}`}>
              <p className="mb-1 text-xs font-bold uppercase">{message.role === "user" ? "You" : "Noticing"}</p>
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            </div>
          ))}
          {question ? (
            <p className="rounded-lg border border-[var(--border-soft)] bg-white p-3 text-sm">
              <strong>Question:</strong> {question}
            </p>
          ) : null}
        </div>

        <label className="block text-sm font-semibold" htmlFor="capture-input">What happened?</label>
        <textarea id="capture-input" rows={4} maxLength={2500} value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="I did..., I noticed..., I finished..."
          className="w-full rounded-lg border border-[var(--border-soft)] bg-white p-3" />
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[var(--leaf-dark)]" />
          <span>
            I agree to send the messages in this chat to OpenAI for processing. They are not saved as Noticing logs.
            Do not include passwords, private third-party information, or anything you do not want processed.
          </span>
        </label>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="submit-button disabled:opacity-50"
            disabled={busy || !input.trim() || !consent} onClick={() => void send()}>
            {busy ? "Analyzing…" : "Analyze message"}
          </button>
          <button type="button" className="secondary-button"
            onClick={() => {
              setMessages([]); setInput(""); setDrafts([]); setQuestion(null);
              setNotice(""); setErrors([]); setSavedCount(0);
            }}>
            Clear this chat
          </button>
        </div>
        <p className="text-xs text-[var(--ink-soft)]">
          This is not a live ChatGPT sync. This browser chat is temporary; reloading clears it.
          Only approved records are saved to your account. No AI processing occurs until you submit.
        </p>
      </section>

      <section className="space-y-4">
        <div className="glass-card p-5">
          <h2 className="text-xl font-bold">Review proposed records</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Check that each event actually happened, especially dates and measurements. Uncertain facts stay blank.
            Edit titles, notes or categories, and approve each record individually.
          </p>
          {drafts.length === 0 ? <p className="mt-3 text-sm">Nothing proposed yet.</p> : (
            <p className="mt-3 text-sm">{drafts.filter((d) => d.approved).length} of {drafts.length} approved</p>
          )}
        </div>
        {drafts.map((draft, index) => (
          <article key={draft.id} className="glass-card space-y-3 p-5">
            <label className="flex items-center gap-3 font-semibold">
              <input type="checkbox" checked={draft.approved}
                onChange={(e) => edit(draft.id, { approved: e.target.checked })}
                className="h-5 w-5 accent-[var(--leaf-dark)]" />
              Approve record {index + 1}
            </label>
            <p className="rounded-lg bg-white/70 p-3 text-xs text-[var(--ink-soft)]">
              <strong>Evidence:</strong> {draft.evidence || "Review this entry against the conversation."}
              {draft.uncertainty ? <span className="mt-1 block"><strong>Verify:</strong> {draft.uncertainty}</span> : null}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Activity
                <select value={draft.log_type}
                  onChange={(e) => edit(draft.id, { log_type: e.target.value as CaptureType })}
                  className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-white p-2">
                  {actionTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Insight area
                <p className="mt-1 rounded-lg bg-white/75 p-2">
                  {insightAreas.find((area) => area.id === areaForType(draft.log_type))?.title}
                </p>
              </label>
              <label className="block text-sm font-medium">
                Actual event date
                <input type="date" value={draft.action_date}
                  onChange={(e) => edit(draft.id, { action_date: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-white p-2" />
              </label>
              <label className="block text-sm font-medium">
                Time, if known
                <input type="time" value={draft.action_time}
                  onChange={(e) => edit(draft.id, { action_time: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-white p-2" />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Short title
              <input value={draft.title} maxLength={160}
                onChange={(e) => edit(draft.id, { title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-white p-2" />
            </label>
            <label className="block text-sm font-medium">
              Notes (optional)
              <textarea value={draft.notes} maxLength={1500} rows={2}
                onChange={(e) => edit(draft.id, { notes: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[var(--border-soft)] bg-white p-2" />
            </label>
            <details className="rounded-lg bg-white/70 p-3">
              <summary className="cursor-pointer text-sm font-semibold">Measurements (optional)</summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {optionalFields.map((key) => (
                  <label key={key} className="block text-xs font-semibold">
                    {metricLabels[key]}
                    <input type="number" min={["mood_score", "energy_score", "intensity_score"].includes(key) ? 1 : 0}
                      max={limits[key]} step={["mood_score", "energy_score", "intensity_score"].includes(key) ? 1 : "any"}
                      value={draft[key] ?? ""}
                      onChange={(e) => {
                        const value = e.target.value.trim() === "" ? null : Number(e.target.value);
                        edit(draft.id, { [key]: value });
                      }}
                      aria-invalid={!captureNumberValid(key, draft[key])}
                      className="mt-1 block w-full rounded-lg border border-[var(--border-soft)] bg-white p-2" />
                  </label>
                ))}
              </div>
            </details>
            {validCaptureDraft(draft) ? (
              <p className="text-sm text-amber-900">Needs review: {validCaptureDraft(draft)}</p>
            ) : null}
          </article>
        ))}
        <div className="glass-card space-y-3 p-5">
          <h2 className="text-lg font-semibold">Save reviewed records</h2>
          <button type="button" className="submit-button disabled:opacity-50"
            disabled={saving || busy || drafts.every((d) => !d.approved)}
            onClick={() => void save()}>{saving ? "Saving…" : "Save approved records"}</button>
          {notice ? <p role="status" className="rounded-lg bg-white/75 p-3 text-sm">{notice}</p> : null}
          {errors.length ? <ul className="list-disc pl-5 text-sm text-red-900">{errors.map((error, i) => <li key={i}>{error}</li>)}</ul> : null}
          {savedCount ? <p className="text-sm">
            View <Link href="/logs" className="font-semibold underline">Logs</Link> or
            <Link href="/insights" className="ml-1 font-semibold underline">Insights</Link>.
          </p> : null}
        </div>
      </section>
    </div>
  );
}
