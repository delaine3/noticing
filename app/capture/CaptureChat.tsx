"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  areaForType, captureNumberValid, limits, optionalFields,
  type CaptureAnalysis, type CaptureDraft, type CaptureMessage,
  type CaptureType, validCaptureDraft,
} from "../lib/capture-types";
import { actionTypes } from "../lib/log-types";
import { insightAreas } from "../lib/insight-categories";
import { saveCaptureDrafts } from "./actions";
import { extractLocalRecords } from "../lib/free-capture";
import { analyzeLocal, loadLocalModel, resetLocalModel } from "../lib/noticing-webllm";
import { resolveLocalCapture } from "../lib/capture-result";
import { parseLocalCaptureResponse } from "../lib/local-capture-response";
import { OperationTimeoutError, withOperationTimeout } from "../lib/operation-timeout";

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

// Retain earlier unsaved entries when a later local-model reply forgets them.
function addUniqueDrafts(
  previous: CaptureDraft[],
  records: CaptureAnalysis["proposed_records"],
) {
  const next = [...previous];
  for (const record of records) {
    const fingerprint = (record.evidence || record.title).trim().toLowerCase();
    const exists = next.some((draft) =>
      draft.log_type === record.log_type &&
      (draft.evidence || draft.title).trim().toLowerCase() === fingerprint);
    if (!exists) next.push(draftFromAI(record));
  }
  return next.slice(-10);
}

export default function CaptureChat() {
  const [messages, setMessages] = useState<CaptureMessage[]>([]);
  const [input, setInput] = useState("");
  const [drafts, setDrafts] = useState<CaptureDraft[]>([]);
  const [question, setQuestion] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState<"basic" | "local">("basic");
  const [modelId, setModelId] = useState("SmolLM2-360M-Instruct-q4f16_1-MLC");
  const [modelReady, setModelReady] = useState(false);
  const [requiresReload, setRequiresReload] = useState(false);
  const [saveUncertain, setSaveUncertain] = useState(false);
  const operationRef = useRef(0);
  const [modelStatus, setModelStatus] = useState("Not loaded. Loading downloads open weights, but does not upload chats.");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [savedCount, setSavedCount] = useState(0);

  function edit(id: string, patch: Partial<CaptureDraft>) {
    setDrafts((old) => old.map((item) => item.id === id ? { ...item, ...patch } : item));
    setNotice("");
  }

  function useBasicInstead() {
    if (busy) {
      // A WebGPU operation cannot necessarily be cancelled. Ignore all late
      // callbacks and require a page refresh before loading another model.
      operationRef.current += 1;
      setRequiresReload(true);
      setModelStatus("Local operation abandoned. Reload the page to release GPU resources.");
      setModelReady(false);
      setBusy(false);
      setNotice("Offline basic is available. The previous local operation may still be running " +
        "until you reload this page.");
    }
    setCaptureMode("basic");
  }

  function restartLocalAI() {
    if ((drafts.length > 0 || input.trim() || messages.length > 0) &&
        !window.confirm("Reloading clears unsaved chat and proposed records. Continue?")) {
      return;
    }
    window.location.reload();
  }

  async function prepareLocalModel() {
    if (busy || requiresReload) return;
    const operation = ++operationRef.current;
    setBusy(true);
    setNotice("");
    try {
      await withOperationTimeout(
        loadLocalModel(modelId, (status) => {
          if (operationRef.current === operation) setModelStatus(status);
        }),
        180_000,
        "Local model initialization stopped responding.",
      );
      if (operationRef.current !== operation) return;
      setModelReady(true);
    } catch (error) {
      if (operationRef.current !== operation) return;
      setModelReady(false);
      const isTimeout = error instanceof OperationTimeoutError;
      if (isTimeout) {
        operationRef.current += 1;
        setRequiresReload(true);
        setBusy(false);
      }
      setModelStatus(error instanceof Error ? error.message : "Could not load the local model.");
      setNotice(isTimeout
        ? "Model loading did not finish. Use Offline basic now; reload this page before trying the AI again."
        : "Could not initialize the local model. You can use Offline basic without a model.");
    } finally {
      if (operationRef.current === operation) setBusy(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || busy || (captureMode === "local" && (!modelReady || requiresReload))) return;
    const operation = ++operationRef.current;
    const conversation = [...messages, { role: "user" as const, content: text }].slice(-10);
    setBusy(true);
    setNotice("");
    setErrors([]);
    try {
      if (captureMode === "basic") {
        const parsed = extractLocalRecords(text, dateToday());
        setMessages([...conversation, { role: "assistant" as const, content: parsed.reply }].slice(-10));
        setDrafts((previous) => [...previous, ...parsed.proposed_records.map(draftFromAI)].slice(0, 10));
        setQuestion(null);
        setInput("");
        setSavedCount(0);
        return;
      }
      const raw = await withOperationTimeout(analyzeLocal({
        messages: conversation,
        localDate: dateToday(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        modelId,
        onProgress: (status) => {
          if (operationRef.current === operation) setModelStatus(status);
        },
      }), 90_000, "The local model did not finish analyzing this message.");
      if (operationRef.current !== operation) return;
      const { analysis: payload, usedBasic } = resolveLocalCapture(
        raw, text, dateToday(), actionTypes,
        parseLocalCaptureResponse, extractLocalRecords,
      );
      if (usedBasic) {
        setNotice("The small model did not return usable activity data. " +
          "Review the offline suggestions below. No cloud processing occurred.");
      }
      setMessages([...conversation, { role: "assistant" as const, content: payload.reply }].slice(-10));
      setInput("");
      // Keep prior unapproved records and avoid re-adding matching suggestions.
      setDrafts((previous) => addUniqueDrafts(previous, payload.proposed_records));
      setQuestion(usedBasic ? null : payload.follow_up_question);
      setSavedCount(0);
    } catch (error) {
      if (operationRef.current !== operation) return;
      // Don't await a reset after a hung GPU operation: that reset could hang
      // behind the same promise and leave the spinner running forever.
      if (captureMode === "local") {
        if (error instanceof OperationTimeoutError) {
          operationRef.current += 1;
          setBusy(false);
        }
        setModelReady(false);
        setRequiresReload(true);
        setModelStatus("Local AI stopped responding. Reload to reset WebGPU or use Offline basic.");
        void resetLocalModel(modelId).catch(() => {});
        const offline = extractLocalRecords(text, dateToday());
        if (offline.proposed_records.length > 0) {
          setMessages([...conversation, {
            role: "assistant" as const,
            content: "Local AI stopped unexpectedly. I found " +
              offline.proposed_records.length +
              " suggested records using offline basic extraction.",
          }].slice(-10));
          setDrafts((previous) => addUniqueDrafts(previous, offline.proposed_records));
          setInput("");
          setQuestion(null);
          setNotice("Model generation failed; offline records are available for review. " +
            "Reload the model to use AI again.");
        } else {
          setNotice("Local model generation failed: " +
            (error instanceof Error ? error.message : "Unknown error") +
            ". Your message is preserved. Reload the model or use Offline basic.");
        }
      } else {
        setNotice(error instanceof Error ? error.message : "Could not process your message.");
      }
    } finally {
      if (operationRef.current === operation) setBusy(false);
    }
  }

  async function save() {
    if (busy || saving || saveUncertain) return;
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
      const result = await withOperationTimeout(
        saveCaptureDrafts(selected),
        30_000,
        "The save request did not respond. Check Logs before trying again.",
      );
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
      if (error instanceof OperationTimeoutError) setSaveUncertain(true);
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

        <fieldset className="rounded-lg border border-[var(--border-soft)] bg-white/70 p-3">
          <legend className="px-1 text-sm font-semibold">Processing mode</legend>
          <label className="mt-2 flex items-start gap-2 text-sm">
            <input type="radio" name="capture-mode" value="basic" checked={captureMode === "basic"}
              onChange={useBasicInstead} className="mt-1 accent-[var(--leaf-dark)]" />
            <span><strong>Offline basic</strong> · No model download. Limited rules, completely on-device.</span>
          </label>
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input type="radio" name="capture-mode" value="local" checked={captureMode === "local"}
              onChange={() => { if (!busy && !requiresReload) setCaptureMode("local"); }} disabled={busy || requiresReload} className="mt-1 accent-[var(--leaf-dark)]" />
            <span><strong>Open-weight AI on this device</strong> · No API, no training on your conversations, no prompt uploads. Requires browser WebGPU and a model download.</span>
          </label>
          {captureMode === "local" ? (
            <div className="mt-3 space-y-2 rounded-lg bg-white/80 p-3">
              <label className="block text-sm font-medium">Local model
                <select value={modelId} disabled={busy} onChange={(event) => { setModelId(event.target.value); setModelReady(false); setModelStatus("Model changed. Load and verify the new model before analyzing."); }}
                  className="mt-1 block w-full rounded-lg border p-2">
                  <option value="SmolLM2-360M-Instruct-q4f16_1-MLC">SmolLM2 360M (lighter, less accurate; ~376 MB graphics memory)</option>
                  <option value="SmolLM2-1.7B-Instruct-q4f16_1-MLC">SmolLM2 1.7B (stronger, ~1.8 GB graphics memory)</option>
                </select>
              </label>
              <button type="button" className="secondary-button" disabled={busy || modelReady || requiresReload}
                onClick={() => void prepareLocalModel()}>{modelReady ? "Model ready" : busy ? "Loading…" : "Download / load model"}</button>
              <p role="status" className="text-xs text-[var(--ink-soft)]">{modelStatus}</p>
              {busy ? (
                <button type="button" onClick={useBasicInstead} className="secondary-button">
                  Use Offline basic instead
                </button>
              ) : null}
              {requiresReload ? (
                <button type="button" onClick={restartLocalAI} className="secondary-button">
                  Restart local AI (reload page)
                </button>
              ) : null}
              <p className="text-xs text-[var(--ink-soft)]">WebLLM JavaScript is served by Noticing. Model weights and WASM are still downloaded from their publishers and use bandwidth; those hosts can see download metadata, never your chat text. The app does not send prompts to external inference services.</p>
            </div>
          ) : null}
        </fieldset>
        <label className="block text-sm font-semibold" htmlFor="capture-input">What happened?</label>
        <textarea id="capture-input" rows={4} maxLength={2500} value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="I did..., I noticed..., I finished..."
          className="w-full rounded-lg border border-[var(--border-soft)] bg-white p-3" />
        <div className="flex flex-wrap gap-3">
          <button type="button" className="submit-button disabled:opacity-50"
            disabled={busy || !input.trim() || (captureMode === "local" && !modelReady)} onClick={() => void send()}>
            {busy ? "Analyzing…" : captureMode === "basic" ? "Find records offline" : "Analyze on this device"}
          </button>
          <button type="button" className="secondary-button"
            onClick={() => {
              setMessages([]); setInput(""); setDrafts([]); setQuestion(null);
              setNotice(""); setErrors([]); setSavedCount(0); setSaveUncertain(false);
            }}>
            Clear this chat
          </button>
        </div>
        <p className="text-xs text-[var(--ink-soft)]">
          This is not a live ChatGPT sync. This browser chat is temporary; reloading clears it.
          Both modes process messages on this device; no AI provider receives prompts. Only a deliberate Save sends your edited, approved records to Noticing.
          Only approved records are saved to your account.
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
            disabled={saving || busy || saveUncertain || drafts.every((d) => !d.approved)}
            onClick={() => void save()}>{saving ? "Saving…" : "Save approved records"}</button>
          {notice ? <p role="status" className="rounded-lg bg-white/75 p-3 text-sm">{notice}</p> : null}
          {saveUncertain ? <p className="text-sm text-amber-900">Saving is temporarily disabled because the previous request may have succeeded. Check <Link href="/logs" className="underline font-semibold">Logs</Link> before attempting another save.</p> : null}
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
