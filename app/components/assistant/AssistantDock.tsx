"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  applyDetailReply, extractVolume, interpretClock, nextQuestion,
  summarizeRecords, understandActivity, type AssistantPending, type Proposed,
} from "../../lib/assistant-intent";
import { extractLocalRecords } from "../../lib/free-capture";
import { saveCaptureDrafts } from "../../capture/actions";
import { actionTypes } from "../../lib/log-types";
import { withOperationTimeout, OperationTimeoutError } from "../../lib/operation-timeout";
import { parseLocalCaptureResponse } from "../../lib/local-capture-response";
import { validCaptureDate, type CaptureDraft } from "../../lib/capture-types";

type Message = { role: "me" | "noticing"; text: string };
type Pending = AssistantPending & { ids: string[] };
type Stage = "ordinary" | "download-permission" | "more-info";
const SMALL_MODEL = "SmolLM2-360M-Instruct-q4f16_1-MLC";
const LARGE_MODEL = "SmolLM2-1.7B-Instruct-q4f16_1-MLC";

function localDate(date: Date) {
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" +
    String(date.getDate()).padStart(2, "0");
}

function makePending(records: Proposed[], now: Date): Pending {
  // Conversational logs default to today's date. Confirmations always show
  // that date, so the user can correct it before saving.
  const normalized = records.map((item) => ({
    ...item,
    action_date: validCaptureDate(item.action_date) ? item.action_date : localDate(now),
  }));
  const question = nextQuestion(normalized);
  return {
    records: normalized,
    phase: question ? "detail" : "confirm",
    requestedField: question?.field ?? null,
    requestedIndex: question?.index,
    ids: normalized.map(() => crypto.randomUUID()),
  };
}

function confirmation(pending: Pending) {
  return "I have: " + summarizeRecords(pending.records) + ". Shall I save " +
    (pending.records.length === 1 ? "it" : "these") +
    "? Reply “yes”, “no”, or tell me what to correct.";
}

function isYes(text: string) { return /^(?:yes|y|yeah|yep|sure|save(?: it| them)?|please do|go ahead|okay|ok)[.!\s]*$/i.test(text.trim()); }
function isNo(text: string) { return /^(?:no|n|cancel|discard|forget it|never mind)[.!\s]*$/i.test(text.trim()); }

export function AssistantDock() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "noticing", text: "Hi 🌿 Tell me what happened today. I'll ask if I need another detail, then check with you before saving." },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [stage, setStage] = useState<Stage>("ordinary");
  const [unknownText, setUnknownText] = useState("");
  const [downloadAllowed, setDownloadAllowed] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveUncertain, setSaveUncertain] = useState(false);
  const [expandDetails, setExpandDetails] = useState(false);
  const inFlight = useRef(false);
  const operation = useRef(0);
  const logBottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.location.search.includes("assistant=open")) setOpen(true);
  }, [pathname]);
  useEffect(() => {
    logBottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  if (pathname === "/login" || pathname === "/signup") return null;
  function reply(text: string) {
    setMessages((prev) => [...prev, { role: "noticing" as const, text }].slice(-32));
  }
  function typed(text: string) {
    setMessages((prev) => [...prev, { role: "me" as const, text }].slice(-32));
  }
  function startDrafts(records: Proposed[]) {
    const next = makePending(records, new Date());
    setPending(next);
    setStage("ordinary");
    setExpandDetails(false);
    const question = nextQuestion(next.records);
    if (question) reply(question.text);
    else reply(confirmation(next));
  }

  async function tryLocalModels(text: string) {
    let ai: typeof import("../../lib/noticing-webllm");
    try {
      ai = await import("../../lib/noticing-webllm");
    } catch {
      return null;
    }
    const messages = [{ role: "user" as const, content: text }];
    for (const modelId of [SMALL_MODEL, LARGE_MODEL]) {
      if (aiUnavailable) return null;
      try {
        const raw = await withOperationTimeout(
          ai.analyzeLocal({
            messages,
            localDate: localDate(new Date()),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
            modelId,
            onProgress: () => {},
          }),
          180_000,
          "Local processing timed out.",
        );
        const parsed = parseLocalCaptureResponse(raw, actionTypes);
        if (parsed.proposed_records.length > 0) return parsed.proposed_records;
      } catch (error) {
        // A hung WebGPU request cannot safely be followed by another load.
        if (error instanceof OperationTimeoutError) throw error;
        // If the smaller model fails, the session manager unloads it before
        // attempting the larger one. No server inference fallback exists.
      }
    }
    return null;
  }

  async function savePending(current: Pending) {
    const items: CaptureDraft[] = current.records.map((item, index) => ({
      ...item, id: current.ids[index], approved: true,
    }));
    const invalid = items.find((item) => !validCaptureDate(item.action_date));
    if (invalid) {
      reply("I still need the correct date before I can save that. You can edit it below.");
      setExpandDetails(true);
      return;
    }
    try {
      const result = await withOperationTimeout(
        saveCaptureDrafts(items), 30_000,
        "Saving took too long. Please check Logs before trying again.",
      );
      if (result.errors.length || (!result.saved && !result.duplicates)) {
        reply("I couldn't finish saving every item. " + result.errors.join(" ").slice(0, 320));
      } else {
        reply(result.saved
          ? "Saved " + result.saved + (result.saved === 1 ? " entry" : " entries") +
            ". Thanks for telling me. 🌿"
          : "These entries were already recorded.");
        setPending(null);
        setExpandDetails(false);
        router.refresh();
      }
    } catch (error) {
      if (error instanceof OperationTimeoutError) setSaveUncertain(true);
      reply(error instanceof Error ? error.message : "I couldn't confirm the save. Please check Logs.");
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || inFlight.current || saveUncertain) return;
    inFlight.current = true;
    const token = ++operation.current;
    setBusy(true);
    setInput("");
    typed(text);
    try {
      if (stage === "download-permission") {
        setStage("ordinary");
        if (!isYes(text)) {
          reply("That's fine. Tell me the action in simpler terms, or use the optional manual entry.");
          return;
        }
        setDownloadAllowed(true);
        const found = await tryLocalModels(unknownText);
        if (token !== operation.current) return;
        if (found?.length) startDrafts(found);
        else {
          setStage("more-info");
          reply("I'm having trouble understanding that well enough to record it. Could you describe the specific action, time or amount?");
        }
        return;
      }

      if (pending) {
        if (isNo(text)) {
          setPending(null);
          setExpandDetails(false);
          reply("Okay, I won't save that. What else happened?");
          return;
        }
        if (pending.phase === "detail") {
          const updated = applyDetailReply(pending, text);
          if (!updated) {
            reply("Could you give an amount in ml, such as “250 ml”, or say “skip”?");
            return;
          }
          const next: Pending = { ...pending, ...updated };
          setPending(next);
          reply(confirmation(next));
          return;
        }
        if (isYes(text)) {
          await savePending(pending);
          return;
        }
        // Make simple corrections from chat without opening a form.
        const correctionTime = interpretClock(text);
        const date = /\byesterday\b/i.test(text)
          ? (() => { const d = new Date(); d.setDate(d.getDate() - 1); return localDate(d); })()
          : /\btoday\b/i.test(text) ? localDate(new Date()) : null;
        const volume = extractVolume(text);
        if (pending.records.length === 1 && (correctionTime || date || volume !== null)) {
          const records = pending.records.map((item) => ({
            ...item,
            action_date: date ?? item.action_date,
            action_time: correctionTime || item.action_time,
            water_amount_ml: volume !== null && (item.log_type === "Coffee" || item.log_type === "Water")
              ? volume : item.water_amount_ml,
          }));
          const changed = { ...pending, records };
          setPending(changed);
          reply(confirmation(changed));
        } else {
          reply("I can correct a time, date or drink amount here. Or open “Adjust details” below. Reply “yes” when it's right.");
        }
        return;
      }

      const extracted = understandActivity(text, new Date(), extractLocalRecords);
      if (extracted.length) {
        startDrafts(extracted);
        return;
      }
      if (stage === "more-info") setStage("ordinary");

      if (aiUnavailable || !("gpu" in navigator)) {
        reply("I couldn't reliably turn that into a record yet. Try telling me what you did and when, or use the optional manual entry.");
        return;
      }
      if (!downloadAllowed) {
        setUnknownText(text);
        setStage("download-permission");
        reply("I can try a more capable private assistant on your device. The first use may download a substantial amount of model files (possibly over 2 GB in total), using your internet data. Is that okay? Reply yes or no.");
        return;
      }
      const found = await tryLocalModels(text);
      if (token !== operation.current) return;
      if (found?.length) startDrafts(found);
      else {
        setStage("more-info");
        reply("I couldn't confidently identify a completed activity. What exactly happened, and was it today?");
      }
    } catch (error) {
      if (token !== operation.current) return;
      if (error instanceof OperationTimeoutError) {
        setAiUnavailable(true);
        reply("The local assistant stopped responding. I can still record simple things without it. Reload the page to retry the larger model.");
      } else {
        reply("I couldn't finish that. Your message remains in our chat. Try a shorter description.");
      }
    } finally {
      if (token === operation.current) {
        setBusy(false);
        inFlight.current = false;
      }
    }
  }

  function stopThinking() {
    operation.current += 1;
    inFlight.current = false;
    setBusy(false);
    setAiUnavailable(true);
    reply("Okay, I've stopped waiting. Simple recording still works.");
  }

  return (
    <div className="fixed bottom-4 right-4 z-[80] sm:bottom-6 sm:right-6">
      {open ? (
        <section role="dialog" aria-label="Talk to Noticing"
          className="flex h-[min(76vh,620px)] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[#f8f9f0] shadow-2xl">
          <header className="flex items-center justify-between bg-[#25543d] px-4 py-3 text-white">
            <div><h2 className="font-semibold">🌿 Noticing</h2><p className="text-xs text-white/80">Your daily companion</p></div>
            <button type="button" aria-label="Close assistant" onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-xl hover:bg-white/20">×</button>
          </header>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3" role="log" aria-live="polite">
            {messages.map((message, i) => (
              <p key={i} className={`max-w-[93%] rounded-xl p-3 text-sm leading-6 ${
                message.role === "me" ? "ml-auto bg-[#dbeedb]" : "mr-auto bg-white"
              }`}>{message.text}</p>
            ))}
            {busy ? <p role="status" className="text-sm text-[var(--ink-soft)]">
              Thinking on your device…
              <button type="button" className="ml-2 underline" onClick={stopThinking}>Use simple recording</button>
            </p> : null}
            <div ref={logBottom} />
          </div>

          {pending ? (
            <details open={expandDetails} onToggle={(event) => setExpandDetails(event.currentTarget.open)}
              className="max-h-48 overflow-y-auto border-t border-[var(--border-soft)] bg-white/85 px-3 py-2 text-sm">
              <summary className="cursor-pointer font-medium text-[var(--leaf-dark)]">Adjust details (optional)</summary>
              <div className="mt-3 space-y-3">
                {pending.records.map((item, i) => (
                  <div key={pending.ids[i]} className="space-y-2 rounded-lg border border-[var(--border-soft)] p-2">
                    <label className="block text-xs">Activity
                      <input className="mt-1 w-full rounded border p-2" maxLength={160} value={item.title}
                        onChange={(e) => setPending((prev) => prev ? ({
                          ...prev, records: prev.records.map((r, j) => j === i ? { ...r, title: e.target.value } : r),
                        }) : prev)} />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs">Date
                        <input type="date" className="mt-1 w-full rounded border p-2" value={item.action_date}
                          onChange={(e) => setPending((prev) => prev ? ({
                            ...prev, records: prev.records.map((r,j) => j === i ? { ...r, action_date: e.target.value } : r),
                          }) : prev)} />
                      </label>
                      <label className="text-xs">Time
                        <input type="time" className="mt-1 w-full rounded border p-2" value={item.action_time}
                          onChange={(e) => setPending((prev) => prev ? ({
                            ...prev, records: prev.records.map((r,j) => j === i ? { ...r, action_time: e.target.value } : r),
                          }) : prev)} />
                      </label>
                    </div>
                    {item.log_type === "Coffee" || item.log_type === "Water" ? (
                      <label className="block text-xs">Amount (ml, optional)
                        <input type="number" min={1} max={5000} className="mt-1 w-full rounded border p-2"
                          value={item.water_amount_ml ?? ""}
                          onChange={(e) => setPending((prev) => prev ? ({
                            ...prev, records: prev.records.map((r,j) => j === i
                              ? { ...r, water_amount_ml: e.target.value ? Number(e.target.value) : null } : r),
                          }) : prev)} />
                      </label>
                    ) : null}
                  </div>
                ))}
              </div>
            </details>
          ) : null}

          <form className="border-t border-[var(--border-soft)] bg-white p-3"
            onSubmit={(event) => { event.preventDefault(); void send(); }}>
            <div className="flex items-end gap-2">
              <label htmlFor="noticing-message" className="sr-only">Tell Noticing what happened</label>
              <textarea id="noticing-message" rows={2} maxLength={1200}
                value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault(); void send();
                  }
                }}
                placeholder="Tell me what happened…"
                className="min-w-0 flex-1 resize-none rounded-xl border border-[var(--border-soft)] p-3 text-sm" />
              <button type="submit" disabled={busy || !input.trim() || saveUncertain}
                className="rounded-xl bg-[#25543d] px-4 py-3 font-semibold text-white disabled:opacity-45"
                aria-label="Send message">Send</button>
            </div>
            <div className="mt-2 flex justify-between gap-2 text-xs text-[var(--ink-soft)]">
              <span>Nothing saved without your yes.</span>
              <Link href="/logs/new" onClick={() => setOpen(false)} className="underline">Manual entry</Link>
            </div>
            {saveUncertain ? <p className="mt-2 text-xs text-amber-900">
              The last save may have completed. Check <Link href="/logs" className="underline">Logs</Link> before trying again.
            </p> : null}
          </form>
        </section>
      ) : (
        <button type="button" onClick={() => setOpen(true)} aria-label="Talk to Noticing"
          className="rounded-full bg-[#25543d] px-5 py-3 font-semibold text-white shadow-xl hover:bg-[#173b29]">
          🌿 Tell Noticing
        </button>
      )}
    </div>
  );
}
