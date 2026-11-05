"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveCoachingPreferences } from "../actions";

export type CoachingSettings = {
  fluid_goal_ml: number;
  fluid_restricted: boolean | null;
  all_drinks_logged: boolean;
  allow_checkin_invites: boolean;
  cloud_enabled: boolean;
};

export function SettingsForm({ settings, cloudConfigured }: {
  settings: CoachingSettings;
  cloudConfigured: boolean;
}) {
  const router = useRouter();
  const [goal, setGoal] = useState(settings.fluid_goal_ml);
  const [restriction, setRestriction] = useState<"unknown" | "yes" | "no">(
    settings.fluid_restricted === null ? "unknown" : settings.fluid_restricted ? "yes" : "no",
  );
  const [complete, setComplete] = useState(settings.all_drinks_logged);
  const [invites, setInvites] = useState(settings.allow_checkin_invites);
  const [cloud, setCloud] = useState(settings.cloud_enabled);
  const [consent, setConsent] = useState(settings.cloud_enabled);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setBusy(true); setMessage("");
    try {
      const result = await saveCoachingPreferences({
        fluidGoalMl: goal,
        fluidRestricted: restriction === "unknown" ? null : restriction === "yes",
        allDrinksLogged: complete,
        allowInvites: invites,
        cloudEnabled: cloud,
        cloudConsent: cloud && consent,
      });
      setMessage(result.message);
      if (result.ok) router.refresh();
    } catch {
      setMessage("Couldn't save preferences. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass-card mt-6 max-w-3xl space-y-6 p-5 sm:p-7">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Hydration</h2>
        <label className="block text-sm">
          Daily drink goal (ml)
          <input type="number" min={1200} max={4000} step={100} value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
            className="mt-2 block w-40 rounded-lg border p-3"/>
        </label>
        <p className="text-sm text-[var(--ink-soft)]">
          The starting 1,800 ml goal is a general adult drinks guide, not a medical prescription.
          Heat and prolonged activity may increase needs.
        </p>
        <label className="block text-sm">
          Has a clinician asked you to restrict your fluid intake?
          <select value={restriction} onChange={(e) => setRestriction(e.target.value as typeof restriction)}
            className="mt-2 block w-full max-w-sm rounded-lg border p-3">
            <option value="unknown">Not specified</option>
            <option value="yes">Yes, restrict fluid suggestions</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={complete} onChange={(e) => setComplete(e.target.checked)}
            className="mt-1 accent-[#25543d]"/>
          I normally record all my drinks here
        </label>
      </div>

      <div className="space-y-3 border-t border-[var(--border-soft)] pt-5">
        <h2 className="text-xl font-semibold">Check-ins</h2>
        <label className="flex gap-3 text-sm">
          <input type="checkbox" checked={invites} onChange={(e) => setInvites(e.target.checked)}
            className="mt-1 accent-[#25543d]"/>
          Show an occasional check-in invitation on Today (maximum two per day)
        </label>
        <p className="text-sm text-[var(--ink-soft)]">
          Follow-up questions appear only when your answers make them useful.
          Follow-up reviews happen only when you explicitly request them.
        </p>
      </div>

      <div className="space-y-3 border-t border-[var(--border-soft)] pt-5">
        <h2 className="text-xl font-semibold">Optional cloud language understanding</h2>
        <p className="text-sm">
          Your normal check-ins and wellness recommendations run locally.
          Cloudflare Workers AI can help interpret unusual descriptions if you allow it.
        </p>
        <p className="text-sm text-[var(--ink-soft)]">
          When used, only the message you approve is sent to Cloudflare. Your saved logs,
          personal health scores and previous chats are not automatically sent.
          Cloudflare says Workers AI doesn't train on customer inputs and does not retain
          ordinary inference content after processing, subject to exceptions.
        </p>
        <p className="text-xs text-[var(--ink-soft)]">
          Source: <a className="underline" href="https://developers.cloudflare.com/workers-ai/platform/data-usage/"
            target="_blank" rel="noreferrer">Cloudflare data usage terms</a>.
          You can switch this off whenever you want.
        </p>
        {!cloudConfigured ? (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
            Cloud AI is not configured on this server. Local recording remains available at no cost.
          </p>
        ) : null}
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={cloud}
            onChange={(e) => { setCloud(e.target.checked); if (!e.target.checked) setConsent(false); }}
            className="mt-1 accent-[#25543d]"/>
          Enable optional cloud interpretation
        </label>
        {cloud ? (
          <label className="flex items-start gap-3 rounded-lg bg-white/80 p-3 text-sm">
            <input type="checkbox" checked={consent}
              onChange={(e) => setConsent(e.target.checked)} className="mt-1 accent-[#25543d]"/>
            I understand that I will explicitly approve each message before it is transmitted
            to Cloudflare, and that processing occurs under its data-usage terms.
          </label>
        ) : null}
        <p className="text-xs text-[var(--ink-soft)]">
          The app cannot upgrade your Cloudflare plan. The server must be configured
          for an unbilled Workers Free account, and usage stops when the free allocation runs out.
        </p>
      </div>

      <button type="button" onClick={() => void save()} disabled={busy || (cloud && !consent)}
        className="submit-button disabled:opacity-50">
        {busy ? "Saving…" : "Save preferences"}
      </button>
      {message ? <p role="status" className="text-sm">{message}</p> : null}
    </section>
  );
}
