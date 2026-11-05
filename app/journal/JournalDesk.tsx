"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  deleteJournalEntry, saveJournalEntry, updateCheckInReflection,
} from "./actions";
import { bouquetThoughts, flowerForThought, type ThoughtRecord } from "../lib/thought-garden";
import { ThoughtBouquet } from "./ThoughtBouquet";

function prettyDay(value: string) {
  return new Date(value + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}
function labelFor(entry: ThoughtRecord) {
  return entry.kind === "checkin" ? "Wellness check-in" :
    entry.status === "draft" ? "Saved draft" : "Journal page";
}

function ThoughtCard({ item }: { item: ThoughtRecord }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(item.body);
  const [title, setTitle] = useState(item.title);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const flower = flowerForThought(item);

  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      const result = item.kind === "checkin"
        ? await updateCheckInReflection(item.id, body)
        : await saveJournalEntry({
            id: item.id, entryDate: item.entryDate,
            title, body, status: "saved", origin: "journal",
          });
      setFeedback(result.message);
      if (result.ok) { setEditing(false); router.refresh(); }
    } catch { setFeedback("Could not update the reflection. Your edits are still in the form."); }
    finally { setBusy(false); }
  }
  async function erase() {
    const question = item.kind === "checkin"
      ? "Delete this reflection permanently? Your check-in ratings will remain."
      : "Delete this journal entry permanently? This cannot be undone.";
    if (!window.confirm(question) || busy) return;
    setBusy(true);
    try {
      const result = item.kind === "checkin"
        ? await updateCheckInReflection(item.id, "")
        : await deleteJournalEntry(item.id);
      setFeedback(result.message);
      if (result.ok) router.refresh();
    } catch { setFeedback("Could not delete this entry."); }
    finally { setBusy(false); }
  }

  return (
    <article className="break-inside-avoid rounded-2xl border border-[#d6ddce] bg-[#fffdfa] p-4 shadow-[0_12px_30px_rgba(36,65,46,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#63806c]">
            {prettyDay(item.entryDate)} · {labelFor(item)}
          </p>
          {item.kind === "checkin" ? (
            <p className="mt-1 text-xs text-[#6d786d]">
              Mood {item.mood}/5 · Energy {item.energy}/5 · Stress {item.stress}/5
            </p>
          ) : null}
        </div>
        <span aria-hidden="true" title={flower.label} className="text-2xl">
          {item.topic === "work" ? "🌼" : item.topic === "worries" ? "🪻" :
            item.topic === "enjoyment" ? "🌻" : item.topic === "relationships" ? "🌷" :
            item.topic === "planning" ? "🌸" : "🌺"}
        </span>
      </div>
      {editing ? (
        <div className="mt-3 space-y-3">
          {item.kind === "journal" ? (
            <label className="block text-sm">Title
              <input className="mt-1 block w-full rounded-lg border p-2"
                maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
          ) : null}
          <label className="block text-sm">Your words
            <textarea className="mt-1 block w-full rounded-lg border p-3 leading-relaxed"
              rows={7} maxLength={12000} value={body}
              onChange={(e) => setBody(e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="submit-button" disabled={busy}
              onClick={() => void save()}>{busy ? "Saving…" : "Save changes"}</button>
            <button type="button" className="secondary-button" onClick={() => {
              setBody(item.body); setTitle(item.title); setEditing(false);
            }}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="mt-3 text-lg font-semibold text-[#254a38]">
            {item.kind === "checkin" ? (item.body ? "A thought from your check-in" : "A check-in, no written note") : item.title}
          </h3>
          {item.body.length > 300 ? (
            <details className="mt-2">
              <summary className="cursor-pointer whitespace-pre-wrap text-sm leading-6 text-[#454b43]">
                {item.body.slice(0, 260)}… <span className="font-semibold text-[#315b44]">Read the rest</span>
              </summary>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[#394d40]">{item.body}</p>
            </details>
          ) : (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-[#394d40]">
              {item.body || "You can add a reflection whenever you like."}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-4 border-t border-[#e9ede4] pt-3 text-sm">
            <button type="button" onClick={() => setEditing(true)} className="font-semibold text-[#315b44] underline">
              {item.body ? "Edit" : "Add reflection"}
            </button>
            {item.body || item.kind === "journal" ? (
              <button type="button" onClick={() => void erase()} disabled={busy}
                className="text-[#9a4656] underline disabled:opacity-50">Delete</button>
            ) : null}
          </div>
        </>
      )}
      {feedback ? <p role="status" className="mt-2 text-xs">{feedback}</p> : null}
    </article>
  );
}

function JournalComposer({ today }: { today: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("A thought from today");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const id = useRef<string | null>(null);
  const version = useRef(0);
  const saving = useRef<Promise<unknown>>(Promise.resolve());
  const draftTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!body.trim() && title === "A thought from today") return;
    id.current ??= crypto.randomUUID();
    const entryId = id.current;
    const revision = ++version.current;
    const timer = window.setTimeout(() => {
      // Serialize writes so an older draft cannot overwrite the latest text.
      saving.current = saving.current.then(async () => {
        const result = await saveJournalEntry({
          id: entryId, entryDate: today,
          title: title.trim() || "A thought from today",
          body, status: "draft", origin: "journal",
        });
        if (version.current === revision) setStatus(result.ok ? "Draft saved privately" : result.message);
      }).catch(() => { if (version.current === revision) setStatus("Draft could not save. Try again."); });
    }, 900);
    draftTimer.current = timer;
    return () => window.clearTimeout(timer);
  }, [title, body, today]);

  async function save() {
    if (!body.trim() || busy) return;
    setBusy(true);
    setStatus("Saving…");
    if (draftTimer.current !== null) window.clearTimeout(draftTimer.current);
    try {
      id.current ??= crypto.randomUUID();
      // Pending autosaves finish before the final commit.
      await saving.current;
      const result = await saveJournalEntry({
        id: id.current, entryDate: today,
        title: title.trim() || "A thought from today",
        body, status: "saved", origin: "journal",
      });
      setStatus(result.message);
      if (result.ok) {
        version.current++;
        id.current = null;
        setBody(""); setTitle("A thought from today");
        router.refresh();
      }
    } catch { setStatus("Unable to save this entry. Your text remains in the editor."); }
    finally { setBusy(false); }
  }

  return (
    <section className="rounded-3xl border border-[#cbd9c5] bg-[#f9fcf3] p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#578163]">Your diary</p>
          <h2 className="mt-1 text-2xl font-semibold">Plant a thought</h2>
        </div>
        <span aria-hidden="true" className="text-4xl">🌱</span>
      </div>
      <p className="mt-2 text-sm text-[#566956]">
        Write whatever is on your mind. Drafts save privately as you type. Nothing is sent to AI.
      </p>
      <label className="mt-4 block text-sm font-semibold">Title
        <input value={title} maxLength={160}
          onChange={(e) => { setTitle(e.target.value); setStatus("Writing…"); }}
          className="mt-2 block w-full rounded-xl border border-[#cbd9c5] bg-white px-3 py-3" />
      </label>
      <label className="mt-4 block text-sm font-semibold">Your thoughts
        <textarea rows={7} maxLength={12000} value={body}
          onChange={(e) => { setBody(e.target.value); setStatus("Writing…"); }}
          placeholder="Something you noticed, remembered, wondered, or simply wanted to get out of your head…"
          className="mt-2 block w-full rounded-xl border border-[#cbd9c5] bg-white px-3 py-3 font-normal leading-relaxed" />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className="submit-button" onClick={() => void save()}
          disabled={!body.trim() || busy}>{busy ? "Saving…" : "Save this thought"}</button>
        <p role="status" className="text-xs text-[#56715c]">{status || "Saved thoughts appear in your garden below."}</p>
      </div>
    </section>
  );
}

export function JournalDesk({ month, today, entries, journalReady }: {
  month: string;
  today: string;
  entries: ThoughtRecord[];
  journalReady: boolean;
}) {
  const monthName = new Date(month + "-01T12:00:00Z").toLocaleDateString("en-US", {
    month: "long", year: "numeric", timeZone: "UTC",
  });
  const written = entries.filter((entry) => entry.body.trim());
  const planted = entries.filter((entry) => entry.body.trim() || entry.kind === "journal");
  const scoreOnly = entries.filter((entry) => entry.kind === "checkin" && !entry.body.trim());
  const bouquetFlowers = bouquetThoughts(entries);
  const [year, mon] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const complete = month < today.slice(0, 7) ||
    (month === today.slice(0, 7) && Number(today.slice(-2)) === lastDay);

  return (
    <div className="space-y-8">
      {journalReady ? <JournalComposer today={today} /> : (
        <p className="rounded-xl border border-[#b4b59e] bg-[#fff9e9] p-4 text-sm">
          The journal isn't available right now. You can still read any check-in notes shown below.
        </p>
      )}
      <section className="rounded-3xl bg-[linear-gradient(160deg,#eaf4e6_0%,#f5f5e7_47%,#f9ebdf_100%)] p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#537d5c]">Your Thought Garden</p>
            <h2 className="mt-1 text-3xl font-semibold text-[#244f3b]">{monthName}</h2>
            <p className="mt-2 text-sm text-[#546e5b]">
              {written.length} written {written.length === 1 ? "thought" : "thoughts"} this month.
              Every flower belongs to a real entry.
            </p>
          </div>
          <Link href="/check-in" className="secondary-button">Wellness check-in</Link>
        </div>
        {planted.length ? (
          <div className="mt-6 columns-1 gap-4 space-y-4 md:columns-2 xl:columns-3">
            {planted.map((entry) => <ThoughtCard key={entry.kind + entry.id} item={entry} />)}
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-dashed border-[#b5c6ad] bg-white/65 p-8 text-center">
            <p className="text-5xl" aria-hidden="true">🌱</p>
            <p className="mt-3 text-lg font-medium">No entries here yet.</p>
            <p className="mt-1 text-sm text-[#607160]">Write a diary page or record a check-in.</p>
          </div>
        )}
      </section>
      {scoreOnly.length ? (
        <details className="rounded-2xl border border-[#dce6d6] bg-white/70 p-5">
          <summary className="cursor-pointer font-semibold text-[#345e46]">
            {scoreOnly.length} check-ins without written reflections
          </summary>
          <p className="mt-2 text-sm text-[#5b705e]">
            Their ratings are still safely recorded. You can add notes to them or
            leave them as they are.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scoreOnly.map((entry) => <ThoughtCard key={entry.id} item={entry} />)}
          </div>
        </details>
      ) : null}
      {complete ? (
        <section className="rounded-3xl border border-[#e3c6b5] bg-[#fff6ee] p-5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#ad6f68]">A little gift from your month</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#764f52]">Your {monthName} thought bouquet 💐</h2>
          <p className="mt-2 text-sm text-[#815e5d]">
            A keepsake made from your recorded words. Every stem represents a saved reflection.
          </p>
          {bouquetFlowers.length ? (
            <ThoughtBouquet month={month} flowers={bouquetFlowers} total={written.filter((e) => e.status === "saved").length} />
          ) : (
            <p className="mt-4 rounded-xl bg-white/60 p-5 text-sm">
              No finished written reflections this month. Drafts are still in your garden; you can complete them anytime.
            </p>
          )}
        </section>
      ) : (
        <p className="text-center text-sm text-[#64806b]">🌸 Your monthly bouquet blooms on the last day of the month.</p>
      )}
    </div>
  );
}
