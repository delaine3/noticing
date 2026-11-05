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
      reply: "No completed activity was identified. Try a more specific description.",
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
  const distance = text.match(/\b(?:I\s+(?:have\s+)?(?:just\s+)?(?:walked|ran|completed|did|finished)|I['’]ve\s+(?:just\s+)?(?:walked|run|completed|finished))\s+(\d{1,2}(?:\.\d+)?)\s*(?:km|kilomet(?:er|re)s?)\b/i);
  if (distance) {
    const km = Number(distance[1]);
    if (km > 0 && km <= 100) {
      const treadmill = /\b(?:treadmill|walking pad)\b/i.test(text);
      add(treadmill ? "Treadmill walk" : "Movement",
        (treadmill ? "Treadmill: " : "Walk/run: ") + km + " km",
        distance[0],
        treadmill ? { treadmill_distance_km: km } : { notes: "Distance recorded: " + km + " km." });
    }
  }
  const directDrink = text.match(/\b(?:I\s+(?:have\s+)?(?:just\s+)?(?:drank|drunk|had|finished)|I['’]ve\s+(?:just\s+)?(?:drunk|had|finished))\s+(\d+(?:\.\d+)?)\s*(ml|l|lit(?:er|re)s?)\s+(?:of\s+)?(water|tea|coffee)\b/i);
  // "I just ate fruit salad and drank 500ml water" carries the "I" across
  // both completed actions. Do not match someone else's report.
  const carriedDrink = text.match(/\b(?:and(?:\s+then)?|then)\s+(?:just\s+)?(?:drank|had|finished)\s+(\d+(?:\.\d+)?)\s*(ml|l|lit(?:er|re)s?)\s+(?:of\s+)?(water|tea|coffee)\b/i);
  const water = directDrink || (
    carriedDrink && /\bI\s+(?:have\s+)?(?:just\s+)?(?:ate|eaten|had|drank|walked|ran)\b/i
      .test(text.slice(0, carriedDrink.index))
      ? carriedDrink : null
  );
  if (water) {
    const volume = Number(water[1]) * (water[2].toLowerCase().startsWith("l") ? 1000 : 1);
    if (volume > 0 && volume <= 5000)
      add(water[3].toLowerCase() === "coffee" ? "Coffee" : "Water",
        water[3] + ": " + volume + " ml", water[0], { water_amount_ml: volume });
  }
  const slept = text.match(/\b(?:I\s+(?:have\s+)?(?:just\s+)?(?:slept|got)|I['’]ve\s+(?:just\s+)?(?:slept|got))\s+(?:for\s+)?(\d+(?:\.\d+)?)\s*hours?\b/i);
  if (slept) {
    const hours = Number(slept[1]);
    if (hours > 0 && hours <= 24)
      add("Sleep", "Slept " + hours + " hours", slept[0], { sleep_hours: hours });
  }
  // Capture ordinary completed meals without network or multi-GB AI downloads.
  // "Had" can describe a meeting or a problem, so require food vocabulary
  // unless the user explicitly says ate/eaten. No inferred first meal.
  const meal = text.match(/\b(?:I\s+(?:have\s+)?(?:just\s+)?(?:ate|eaten)|I['’]ve\s+(?:just\s+)?eaten|I\s+(?:just\s+)?had(?:\s+for\s+(?:breakfast|lunch|dinner))?|I\s+(?:just\s+)?finished)\s+([^.!?;]{2,150})/i);
  if (meal) {
    const verb = meal[0].slice(0, meal[0].length - meal[1].length);
    const explicitEating = /\b(?:ate|eaten)\b/i.test(verb);
    const rawFood = meal[1]
      .split(/\s+(?:(?:and\s+then|then|and)\s+)(?:(?:I|we)\s+)?(?:just\s+)?(?:drank|had|ate|eaten|walked|went|finished|took|started|made|worked|watered)\b/i)[0]
      .trim();
    const foodVocabulary = /\b(?:salad|fruit|fruits|peach|guava|apple|banana|orange|grape|melon|berries|strawberry|mango|avocado|yoghurt|yogurt|egg|eggs|toast|bread|sandwich|rice|beans|chicken|beef|pork|fish|meat|vegetable|vegetables|veggies|cereal|oats|porridge|pasta|noodles|soup|pizza|burger|chips|potato|potatoes|breakfast|lunch|dinner|snack|cake|food)\b/i;
    const negativeFood = /^(?:nothing|no\s|not\s|none\b|zero\b)/i.test(rawFood);
    if ((explicitEating || foodVocabulary.test(rawFood)) && !negativeFood) {
      const timing = rawFood.match(/\b(?:at|around)\s+(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(a\.?m\.?|p\.?m\.?)\b/i);
      const food = rawFood
        .replace(/\b(?:at|around)\s+\d{1,2}(?::\d{2})?\s*[ap]\.?m\.?/gi, "")
        .replace(/\b(?:today|yesterday|this morning|this afternoon|this evening|just now)\b/gi, "")
        .replace(/\s+for\s+(?:breakfast|lunch|dinner)\b/gi, "")
        .replace(/[,\s]+$/, "")
        .trim();
      if (food && !/^(?:to\b|that\b)/i.test(food)) {
        let time = "";
        if (timing) {
          const hour = Number(timing[1]) % 12 + (/^p/i.test(timing[3]) ? 12 : 0);
          time = String(hour).padStart(2, "0") + ":" + String(Number(timing[2] || 0)).padStart(2, "0");
        }
        add("Meal", "Ate " + food.slice(0, 75), meal[0].slice(0, 250), {
          action_time: time,
          uncertainty: "Review the event date and meal details before saving.",
        });
      }
    }
  }

  const garden = text.match(/\b(?:I\s+(?:have\s+)?(?:just\s+)?|I['’]ve\s+(?:just\s+)?|and\s+)(?:watered|pruned|planted|repotted|mulched)\s+(?:my\s+|the\s+)?(?:garden|roses?|plants?|trees?|avocados?)\b/i);
  if (garden) add("Plant care", "Garden care", garden[0]);
  const outreach = text.match(/\b(?:I\s+(?:have\s+)?(?:just\s+)?|I['’]ve\s+(?:just\s+)?)(?:sent|emailed|submitted)\s+(?:(\d+)\s+)?(?:proposals?|outreach emails?|job applications?|applications?)\b/i);
  if (outreach) add(/application/i.test(outreach[0]) ? "Job application" : "Focused work",
    (outreach[1] ? outreach[1] + " " : "") + (/(?:applications?)/i.test(outreach[0]) ? "Applications sent" : "Outreach sent"),
    outreach[0]);
  const creativity = text.match(/\b(?:I\s+(?:have\s+)?(?:just\s+)?|I['’]ve\s+(?:just\s+)?)(?:photographed|painted|drew|sketched|written|wrote|filmed)\s+[^.!?]{2,70}/i);
  if (creativity) add("Creative time", "Creative activity", creativity[0]);

  return {
    reply: draft.length
      ? "Found " + draft.length + " possible " + (draft.length === 1 ? "record" : "records") + ". Review the dates and details before saving."
      : "I couldn't identify a completed activity. Try adding what you did and when.",
    follow_up_question: null,
    proposed_records: draft,
  };
}
