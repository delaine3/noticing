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
import { withOperationTimeout, OperationTimeoutError } from "../../lib/operation-timeout";
import { validCaptureDate, type CaptureDraft } from "../../lib/capture-types";

type Message = { role: "me" | "noticing"; text: string };
type Pending = AssistantPending & { ids: string[] };
type Stage = "ordinary" | "cloud-permission" | "more-info";

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
  const [busy, setBusy] = useState(false);
  const [saveUncertain, setSaveUncertain] = useState(false);
  const [expandDetails, setExpandDetails] = useState(false);
  const inFlight = useRef(false);
  const operation = useRef(0);
  const logBottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (window.location.search.includes("assistant=open")) setOpen(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, [pathname]);
  useEffect(() => {
    logBottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  if (pathname === "/login" || pathname === "/signup" || pathname === "/privacy" ||
      pathname === "/terms" || pathname === "/community-guidelines" || pathname === "/safety" ||
      pathname === "/account") return null;
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

  async function optionalCloudIsEnabled() {
    try {
      const response = await withOperationTimeout(
        fetch("/api/coaching/cloud/status", { cache: "no-store" }),
        6000, "Cloud settings lookup timed out.",
      );
      if (!response.ok) return false;
      const status = await response.json() as { enabled?: boolean };
      return status.enabled === true;
    } catch { return false; }
  }

  async function tryConsentedCloud(text: string): Promise<Proposed[] | null> {
    const response = await withOperationTimeout(
      fetch("/api/coaching/cloud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent: true,
          message: text,
          localDate: localDate(new Date()),
        }),
      }),
      20000,
      "Private cloud processing timed out.",
    );
    const result = await response.json() as {
      proposed_records?: Proposed[];
      error?: string;
    };
    if (!response.ok) throw new Error(result.error || "Cloud processing is unavailable.");
    return Array.isArray(result.proposed_records)
      ? result.proposed_records.slice(0, 3) : null;
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
          ? "Saved " + result.saved + (result.saved === 1 ? " entry" : " entries") + "."
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
      if (stage === "cloud-permission") {
        setStage("ordinary");
        if (!isYes(text)) {
          reply("No problem. Tell me what happened in simpler terms, or use manual entry.");
          return;
        }
        try {
          const found = await tryConsentedCloud(unknownText);
          if (token !== operation.current) return;
          if (found?.length) startDrafts(found);
          else {
            setStage("more-info");
            reply("I didn't quite get that. What happened, and when?");
          }
        } catch (error) {
          reply(error instanceof Error ? error.message :
            "Cloud processing is unavailable. Try a shorter message.");
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
            reply(pending.requestedField === "action_time"
              ? "What time was that? Try “6am”, “06:00”, or “skip”."
              : "Could you give an amount in ml, such as “250 ml”, or say “skip”?");
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

      // No cloud processing unless settings opt-in AND user grants permission
      // for this one message. Only the selected text is sent, no history.
      if (await optionalCloudIsEnabled()) {
        if (token !== operation.current) return;
        setUnknownText(text);
        setStage("cloud-permission");
        reply("Would you like me to use Cloudflare AI to understand that message? Only this message will be sent. Reply yes or no.");
        return;
      }

      reply("I didn't quite understand that. Try telling me what happened, like ‘I just ate a fruit salad’.");
    } catch {
      if (token !== operation.current) return;
      reply("I couldn't finish that request. Try basic recording or adjust your message.");
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
    reply("Stopped waiting. No new record was saved.");
  }

  return (
    <div className="fixed bottom-4 right-4 z-[80] sm:bottom-6 sm:right-6">
      {open ? (
        <section role="dialog" aria-label="Talk to Noticing"
          className="flex h-[min(76vh,620px)] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[#f8f9f0] shadow-2xl">
          <header className="flex items-center justify-between bg-[#25543d] px-4 py-3 text-white">
            <div><h2 className="font-semibold">🌿 Noticing</h2><p className="text-xs text-white/80">Your journal</p></div>
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
              Working on it…
              <button type="button" className="ml-2 underline" onClick={stopThinking}>Stop waiting</button>
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
              <span className="flex items-center gap-3">
                <Link href="/coaching/settings" onClick={() => setOpen(false)} className="underline">Privacy</Link>
                <Link href="/logs/new" onClick={() => setOpen(false)} className="underline">Manual entry</Link>
              </span>
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
