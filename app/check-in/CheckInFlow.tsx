"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getAdaptiveQuestions, recommendNextAction, type CheckInValues, type ThoughtTopic, type QuestionKey } from "../lib/coaching";
import { saveWellnessCheckIn } from "../coaching/actions";
import { saveJournalEntry } from "../journal/actions";

type Answers = Omit<CheckInValues, "energy" | "mood" | "stress" | "thought_topic"> & {
  energy: number | null; mood: number | null; stress: number | null; thought_topic: ThoughtTopic | null;
};
type Stage = "core" | "extras" | "review" | "saved";

const topics: { id: ThoughtTopic; title: string }[] = [
  { id: "work", title: "Work" },
  { id: "worries", title: "Worries" },
  { id: "planning", title: "Planning" },
  { id: "relationships", title: "People" },
  { id: "enjoyment", title: "Something enjoyable" },
  { id: "everyday", title: "Everyday things" },
  { id: "other", title: "Something else" },
  { id: "prefer_not_to_say", title: "Keep private" },
];

function emptyAnswers(): Answers {
  return {
    energy: null, mood: null, stress: null, thought_topic: null, thought_detail: null,
    recently_ate: null, thirsty: null, physical_discomfort: null,
    overwhelmed: null, thought_actionable: null, rested: null,
  };
}

function Rating({ name, prompt, value, onChange }: {
  name: string; prompt: string; value: number | null; onChange: (v: number) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="font-medium">{prompt}</legend>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <button key={v} type="button" aria-label={name + " " + v + " of 5"}
            aria-pressed={value === v} onClick={() => onChange(v)}
            className={`h-11 min-w-11 flex-1 rounded-lg border font-semibold ${
              value === v ? "border-[#25543d] bg-[#25543d] text-white" : "border-[var(--border-soft)] bg-white"
            }`}>{v}</button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-[var(--ink-soft)]">
        <span>{name === "Stress" ? "Low" : "Low"}</span><span>{name === "Stress" ? "High" : "High"}</span>
      </div>
    </fieldset>
  );
}

export function CheckInFlow({ localDate, fluidRestricted }: { localDate: string; fluidRestricted: boolean | null }) {
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [stage, setStage] = useState<Stage>("core");
  const [answeredExtra, setAnsweredExtra] = useState<QuestionKey[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const journalDraftId = useRef<string | null>(null);
  const draftTimer = useRef<number | null>(null);
  const draftInFlight = useRef<Promise<unknown>>(Promise.resolve());
  const [followUp, setFollowUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const requestKey = useRef<string | null>(null);

  const ready = answers.energy !== null && answers.mood !== null &&
    answers.stress !== null && answers.thought_topic !== null;
  const values = ready ? answers as CheckInValues : null;

  // Freeze potential follow-ups to the three most useful for the original
  // core answers. Answering 'skip' must not spawn an endless questionnaire.
  const questions = useMemo(() => {
    if (!ready || !values) return [];
    return getAdaptiveQuestions({
      ...values,
      recently_ate: null, thirsty: null, physical_discomfort: null,
      overwhelmed: null, thought_actionable: null, rested: null,
    });
  // All relevant core controls are scalars; conditional answers are excluded.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers.energy, answers.mood, answers.stress, answers.thought_topic]);

  const nextQuestion = questions.find((q) => !answeredExtra.includes(q.key));
  const suggestion = values ? recommendNextAction(values, { fluidRestricted }) : null;

  function setScore(key: "energy" | "mood" | "stress", v: number) {
    setAnswers((old) => ({ ...old, [key]: v }));
    setAnsweredExtra([]);
    setMessage("");
  }
  function extra(key: QuestionKey, v: boolean | null) {
    setAnswers((old) => ({ ...old, [key]: v }));
    const next = [...answeredExtra, key];
    setAnsweredExtra(next);
    if (questions.every((q) => next.includes(q.key))) setStage("review");
  }
  function reset() {
    setAnswers(emptyAnswers());
    setStage("core");
    setAnsweredExtra([]);
    setDraftMessage("");
    journalDraftId.current = null;
    setFollowUp(false);
    setMessage("");
    requestKey.current = null;
  }

  // A check-in reflection is a diary entry even before its ratings are submitted.
  // Recover typed text as a private draft; submitting the check-in attaches the
  // note to the check-in and deletes the redundant draft.
  useEffect(() => {
    const body = answers.thought_detail ?? "";
    if (!body.trim() || stage !== "review" || busy) return;
    journalDraftId.current ??= crypto.randomUUID();
    const id = journalDraftId.current;
    const timer = window.setTimeout(() => {
      // Queue drafts, so an older save never runs after a newer one.
      draftInFlight.current = draftInFlight.current.then(async () => {
        const result = await saveJournalEntry({
          id, entryDate: localDate, title: "Check-in reflection",
          body, status: "draft", origin: "checkin_draft",
        });
        setDraftMessage(result.ok ? "Draft saved privately" : result.message);
      }).catch(() => setDraftMessage("Draft not saved. Save your check-in to retain the text."));
    }, 950);
    draftTimer.current = timer;
    return () => window.clearTimeout(timer);
  }, [answers.thought_detail, localDate, stage, busy]);

  async function save() {
    if (!values || busy) return;
    setBusy(true);
    setMessage("");
    try {
      // Flush the current text before saving, so fast navigation cannot discard
      // a pending autosave. The check-in write still saves the note itself.
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
      await draftInFlight.current;
      const noteText = values.thought_detail?.trim();
      if (noteText && journalDraftId.current) {
        const draft = await saveJournalEntry({
          id: journalDraftId.current, entryDate: localDate,
          title: "Check-in reflection", body: noteText,
          status: "draft", origin: "checkin_draft",
        });
        if (!draft.ok) setDraftMessage(draft.message);
      }
      requestKey.current ??= crypto.randomUUID();
      const result = await saveWellnessCheckIn({
        values: {
          ...values,
          thought_detail: values.thought_detail?.trim() || null,
        },
        requestKey: requestKey.current,
        localDate, followUp,
        journalDraftId: journalDraftId.current,
      });
      setMessage(result.message);
      if (result.ok) setStage("saved");
    } catch {
      setMessage("Couldn't confirm the save. Check your recent check-ins before retrying.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass-card mt-5 max-w-3xl space-y-5 p-5 sm:p-7">
      {stage === "core" ? (
        <>
          <div>
            <h2 className="text-xl font-semibold">How are you right now?</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">A few quick questions about how you&apos;re feeling.</p>
          </div>
          <Rating name="Energy" prompt="Physical energy" value={answers.energy}
            onChange={(v) => setScore("energy", v)} />
          <Rating name="Mood" prompt="Mood" value={answers.mood}
            onChange={(v) => setScore("mood", v)} />
          <Rating name="Stress" prompt="Stress or pressure" value={answers.stress}
            onChange={(v) => setScore("stress", v)} />
          <fieldset className="space-y-2">
            <legend className="font-medium">What have your thoughts mostly been about in the last hour?</legend>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <button type="button" key={topic.id} aria-pressed={answers.thought_topic === topic.id}
                  onClick={() => { setAnswers((old) => ({ ...old, thought_topic: topic.id })); setAnsweredExtra([]); }}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    answers.thought_topic === topic.id
                      ? "border-[#25543d] bg-[#25543d] text-white"
                      : "border-[var(--border-soft)] bg-white"
                  }`}>{topic.title}</button>
              ))}
            </div>
          </fieldset>
          <button type="button" className="submit-button disabled:opacity-40" disabled={!ready}
            onClick={() => setStage(questions.length ? "extras" : "review")}>
            Continue
          </button>
        </>
      ) : null}

      {stage === "extras" && nextQuestion ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--leaf-dark)]">
            One more useful detail
          </p>
          <h2 className="text-xl font-semibold">{nextQuestion.prompt}</h2>
          <p className="text-sm text-[var(--ink-soft)]">{nextQuestion.reason}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="submit-button" onClick={() => extra(nextQuestion.key, true)}>Yes</button>
            <button type="button" className="secondary-button" onClick={() => extra(nextQuestion.key, false)}>No</button>
            <button type="button" className="secondary-button" onClick={() => extra(nextQuestion.key, null)}>Skip</button>
          </div>
          <button type="button" onClick={() => setStage("review")} className="text-sm underline">
            That&apos;s enough questions
          </button>
        </>
      ) : null}

      {stage === "review" && suggestion ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--leaf-dark)]">
            Something you could try
          </p>
          <h2 className="text-2xl font-semibold">{suggestion.title}</h2>
          <p>{suggestion.next}</p>
          <p className="rounded-lg bg-white/75 p-3 text-sm">
            <strong>Why:</strong> {suggestion.benefit}
          </p>
          <section className="space-y-2 rounded-xl border border-[var(--border-soft)] bg-white/80 p-4">
            <label htmlFor="checkin-thoughts" className="block font-semibold">Your private thoughts</label>
            <p className="text-sm text-[var(--ink-soft)]">
              Write whatever is on your mind. Your draft saves as you type and appears in your journal when you save this check-in.
            </p>
            <textarea id="checkin-thoughts" rows={6} maxLength={12000}
              placeholder="What have you been thinking about? What happened today?"
              value={answers.thought_detail ?? ""}
              onChange={(e) => { setAnswers((old) => ({ ...old, thought_detail: e.target.value })); setDraftMessage("Saving draft…"); }}
              className="block w-full rounded-lg border border-[var(--border-soft)] bg-white p-3 leading-relaxed" />
            <p role="status" className="text-xs text-[var(--ink-soft)]">{draftMessage || "Your writing is saved to your private account."}</p>
          </section>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={followUp} onChange={(e) => setFollowUp(e.target.checked)}
              className="mt-1 accent-[#25543d]" />
            Ask me later if this helped
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="submit-button disabled:opacity-50"
              disabled={busy} onClick={() => void save()}>
              {busy ? "Saving…" : "Save my check-in"}
            </button>
            <button type="button" className="secondary-button" onClick={() => setStage("core")}>Edit answers</button>
          </div>
        </>
      ) : null}

      {stage === "saved" ? (
        <>
          <h2 className="text-xl font-semibold">Recorded 🌿</h2>
          <p>{message}</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={reset} className="submit-button">Check in again</button>
            <Link href="/journal" className="secondary-button">View your journal</Link>
            <Link href="/" className="secondary-button">Back to Today</Link>
          </div>
        </>
      ) : null}

      {message && stage !== "saved" ? <p role="status" className="text-sm text-amber-900">{message}</p> : null}
      <p className="text-xs text-[var(--ink-soft)]">
        You can skip additional questions. Your written reflections are saved privately and can be edited or deleted in Journal.
      </p>
    </section>
  );
}
