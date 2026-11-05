"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordCoachingOutcome } from "../coaching/actions";

export type DueCoachingAction = {
  id: string;
  title: string;
  benefit: string;
  follow_up_at: string;
};

export function FollowUpReview({ action }: { action: DueCoachingAction }) {
  const router = useRouter();
  const [tried, setTried] = useState<boolean | null>(null);
  const [helped, setHelped] = useState<boolean | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    if (busy || tried === null) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await recordCoachingOutcome({
        interventionId: action.id,
        tried,
        helped: tried ? helped : null,
        energyAfter: energy, moodAfter: null,
      });
      setMessage(response.message);
      if (response.ok) router.refresh();
    } catch {
      setMessage("Couldn't confirm that the review was saved. Check again before retrying.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass-card mt-5 space-y-3 p-5" aria-label="Follow-up review">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--leaf-dark)]">How did that go?</p>
      <h2 className="text-xl font-semibold">{action.title}</h2>
      <p className="text-sm text-[var(--ink-soft)]">Did you try this suggestion?</p>
      <div className="flex gap-2">
        <button type="button" aria-pressed={tried === true}
          className={tried === true ? "submit-button" : "secondary-button"}
          onClick={() => { setTried(true); setHelped(null); }}>Yes</button>
        <button type="button" aria-pressed={tried === false}
          className={tried === false ? "submit-button" : "secondary-button"}
          onClick={() => { setTried(false); setHelped(null); }}>No</button>
      </div>
      {tried === true ? (
        <>
          <p className="text-sm font-medium">Did it help?</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={helped === true} className={helped === true ? "submit-button" : "secondary-button"} onClick={() => setHelped(true)}>Yes</button>
            <button type="button" aria-pressed={helped === false} className={helped === false ? "submit-button" : "secondary-button"} onClick={() => setHelped(false)}>No</button>
            <button type="button" aria-pressed={helped === null} className={helped === null ? "submit-button" : "secondary-button"} onClick={() => setHelped(null)}>Not sure</button>
          </div>
          <label className="block text-sm">
            Energy now (optional)
            <select value={energy ?? ""} onChange={(e) => setEnergy(e.target.value ? Number(e.target.value) : null)}
              className="mt-2 block rounded-lg border p-2">
              <option value="">Skip</option>
              {[1,2,3,4,5].map((v) => <option key={v} value={v}>{v} / 5</option>)}
            </select>
          </label>
        </>
      ) : null}
      <button type="button" disabled={busy || tried === null}
        onClick={() => void save()} className="submit-button disabled:opacity-50">
        {busy ? "Saving…" : "Save follow-up"}
      </button>
      {message ? <p role="status" className="text-sm">{message}</p> : null}
    </section>
  );
}
