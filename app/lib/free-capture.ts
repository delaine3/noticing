import type { CaptureAnalysis, CaptureType } from "./capture-types";

/**
 * Zero-network fallback when no API key is configured or a user prefers not to
 * send any text to an AI provider. Deterministic parsing, NOT a language model.
 * Only explicit first-person completed actions are considered.
 */
export function extractLocalRecords(input: string, localDate: string): CaptureAnalysis {
  const text = input.trim();
  const draft: CaptureAnalysis["proposed_records"] = [];
  const exclude = /\b(?:what if|imagine|hypothetically|if I|if we|I might|I would|I want to|I plan to|I need to|I should|I could|pretend|for example)\b/i;
  if (!text || exclude.test(text)) {
    return {
      reply: "No completed activity was confidently detected. You can rephrase with what you actually did or switch to free-tier AI.",
      follow_up_question: null,
      proposed_records: [],
    };
  }

  const add = (
    type: CaptureType, title: string, evidence: string,
    values: Partial<CaptureAnalysis["proposed_records"][number]> = {},
  ) => {
    if (draft.length >= 6) return;
    draft.push({
      log_type: type,
      title,
      notes: "",
      action_date: /\b(?:today|this morning|this afternoon|this evening)\b/i.test(text) ? localDate : "",
      action_time: "",
      water_amount_ml: null,
      treadmill_distance_km: null,
      treadmill_duration_minutes: null,
      sleep_hours: null,
      duration_minutes: null,
      mood_score: null,
      energy_score: null,
      intensity_score: null,
      evidence: evidence.slice(0, 250),
      uncertainty: "Confirm the actual date and any missing measurements.",
      ...values,
    });
  };
  const distance = text.match(/\bI\s+(?:walked|ran|completed|did|finished)\s+(\d{1,2}(?:\.\d+)?)\s*(?:km|kilomet(?:er|re)s?)\b/i);
  if (distance) {
    const km = Number(distance[1]);
    if (km > 0 && km <= 100) {
      const treadmill = /\b(?:treadmill|walking pad)\b/i.test(text);
      add(treadmill ? "Treadmill walk" : "Movement",
        (treadmill ? "Treadmill: " : "Walk/run: ") + km + " km",
        distance[0],
        treadmill ? { treadmill_distance_km: km } : {});
    }
  }
  const water = text.match(/\bI\s+(?:drank|had)\s+(\d+(?:\.\d+)?)\s*(ml|l|lit(?:er|re)s?)\s+(?:of\s+)?(water|tea|coffee)\b/i);
  if (water) {
    const volume = Number(water[1]) * (water[2].toLowerCase().startsWith("l") ? 1000 : 1);
    if (volume > 0 && volume <= 5000)
      add(water[3].toLowerCase() === "coffee" ? "Coffee" : "Water",
        water[3] + ": " + volume + " ml", water[0], { water_amount_ml: volume });
  }
  const slept = text.match(/\bI\s+(?:slept|got)\s+(?:for\s+)?(\d+(?:\.\d+)?)\s*hours?\b/i);
  if (slept) {
    const hours = Number(slept[1]);
    if (hours > 0 && hours <= 24)
      add("Sleep", "Slept " + hours + " hours", slept[0], { sleep_hours: hours });
  }
  const garden = text.match(/\bI\s+(?:watered|pruned|planted|repotted|mulched)\s+(?:my\s+|the\s+)?(?:garden|roses?|plants?|trees?|avocados?)\b/i);
  if (garden) add("Plant care", "Garden care", garden[0]);
  const outreach = text.match(/\bI\s+(?:sent|emailed|submitted)\s+(?:(\d+)\s+)?(?:proposals?|outreach emails?|applications?)\b/i);
  if (outreach) add(/application/i.test(outreach[0]) ? "Job application" : "Focused work",
    (outreach[1] ? outreach[1] + " " : "") + (/(?:applications?)/i.test(outreach[0]) ? "Applications sent" : "Outreach sent"),
    outreach[0]);
  const creativity = text.match(/\bI\s+(?:photographed|painted|drew|sketched|wrote|filmed)\s+[^.!?]{2,70}/i);
  if (creativity) add("Creative time", "Creative activity", creativity[0]);

  return {
    reply: draft.length
      ? "Found " + draft.length + " possible " + (draft.length === 1 ? "record" : "records") + ". Review the dates and details before saving."
      : "No confidently matched activities in basic mode. Try adding a specific completed activity, or switch to free-tier AI.",
    follow_up_question: null,
    proposed_records: draft,
  };
}
