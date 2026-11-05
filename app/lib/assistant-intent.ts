import type { CaptureAnalysis, CaptureDraft } from "./capture-types";

export type Proposed = CaptureAnalysis["proposed_records"][number];
export type AssistantPending = {
  records: Proposed[];
  phase: "detail" | "confirm";
  requestedField: "water_amount_ml" | "action_time" | null;
  requestedIndex?: number;
};

function localDate(date: Date) {
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" +
    String(date.getDate()).padStart(2, "0");
}
function localTime(date: Date) {
  return String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
}
function record(type: Proposed["log_type"], title: string, date: string, time: string, evidence: string): Proposed {
  return {
    log_type: type, title, notes: "", action_date: date, action_time: time,
    water_amount_ml: null, treadmill_distance_km: null,
    treadmill_duration_minutes: null, sleep_hours: null, duration_minutes: null,
    mood_score: null, energy_score: null, intensity_score: null,
    evidence: evidence.slice(0, 280), uncertainty: "",
  };
}
export function interpretClock(text: string): string {
  const match = text.match(/\b(?:at|around|about)\s+(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(a\.?m\.?|p\.?m\.?)\b/i);
  if (!match) return "";
  const hr = Number(match[1]) % 12 + (/^p/i.test(match[3]) ? 12 : 0);
  return String(hr).padStart(2, "0") + ":" + (match[2] ?? "00");
}
export function interpretDate(text: string, now: Date) {
  const day = new Date(now);
  if (/\byesterday\b/i.test(text)) day.setDate(day.getDate() - 1);
  if (/\blast night\b/i.test(text) && now.getHours() < 12) day.setDate(day.getDate() - 1);
  return localDate(day);
}
export function extractVolume(text: string) {
  const m = text.match(/\b(\d+(?:\.\d+)?)\s*(ml|millilit(?:er|re)s?|l|lit(?:er|re)s?)\b/i);
  if (!m) return null;
  const value = Number(m[1]) * (/^(?:l|lit)/i.test(m[2]) ? 1000 : 1);
  return value > 0 && value <= 5000 ? value : null;
}
const hypothetical = /\b(?:what if|imagine|hypothetically|if i|i might|i would|i want to|i plan to|i need to|i should|i could|for example)\b/i;

export function understandActivity(
  text: string,
  now: Date,
  fallback: (text: string, date: string) => CaptureAnalysis,
): Proposed[] {
  if (hypothetical.test(text) || !text.trim()) return [];
  const day = interpretDate(text, now);
  const time = interpretClock(text);
  const result: Proposed[] = [];

  if (/\b(?:i(?:'m| am)\s+(?:about to |going to |getting ready to )?(?:go to bed|bed|sleep(?: now)?|turn in)|i'm turning in|heading to bed)\b/i.test(text)) {
    result.push(record("Bedtime", "Getting ready for bed", day, time || localTime(now), text));
  }
  if (/\bi\s+(?:just\s+)?(?:woke up|got out of bed|got up)\b/i.test(text)) {
    result.push(record("Woke up", "Woke up", day,
      time || (/\bjust\b/i.test(text) ? localTime(now) : ""), text));
  }

  // Everyday phrasing such as "I just drank 500ml water" must stay on
  // the free deterministic path. No AI request is needed.
  const drinkLead = /\b(?:i\s+(?:have\s+)?(?:just\s+)?(?:had|drank|drunk|made|finished)|i['’]ve\s+(?:just\s+)?(?:had|drunk|finished))\b/i;
  const drinkPhrase = drinkLead.exec(text);
  const drinkContext = drinkPhrase ? text.slice(drinkPhrase.index + drinkPhrase[0].length, drinkPhrase.index + drinkPhrase[0].length + 46) : "";
  const coffee = /\bcoffee\b/i.test(drinkContext);
  const water = /\bwater\b/i.test(drinkContext);
  if (coffee || water) {
    const type = coffee ? "Coffee" : "Water";
    const justNow = /\bjust\b/i.test(drinkPhrase?.[0] ?? "") &&
      !/\b(?:yesterday|last night|last week|last month)\b/i.test(text);
    const proposed = record(type, coffee ? "Had coffee" : "Drank water", day, time || (justNow ? localTime(now) : ""), text);
    proposed.water_amount_ml = extractVolume(text);
    result.push(proposed);
  }

  const fromRules = fallback(text, day).proposed_records;
  for (const item of fromRules) {
    if (result.length >= 6) break;
    if (!result.some((existing) => existing.log_type === item.log_type)) {
      const recentMeal = item.log_type === "Meal" &&
        (/\bI\s+(?:have\s+)?just\s+(?:ate|eaten|had)\b/i.test(item.evidence) ||
         /\bI['’]ve\s+just\s+(?:eaten|had)\b/i.test(item.evidence) ||
         /\bjust now\b/i.test(item.evidence));
      const historical = /\b(?:yesterday|last night|last week|earlier|ago)\b/i.test(text);
      result.push({
        ...item,
        action_date: item.action_date || day,
        action_time: item.action_time || time || (recentMeal && !historical ? localTime(now) : ""),
        uncertainty: item.uncertainty || "",
      });
    }
  }
  return result.slice(0, 6);
}

export function nextQuestion(records: Proposed[]) {
  const index = records.findIndex((entry) =>
    (entry.log_type === "Coffee" || entry.log_type === "Water") && entry.water_amount_ml === null);
  if (index >= 0) return {
    field: "water_amount_ml" as const,
    index,
    text: records[index].log_type === "Coffee"
      ? "About how much coffee was it, in ml? You can say “skip” if you're unsure."
      : "About how much water was it, in ml? You can say “skip” if you're unsure.",
  };
  const wake = records.findIndex((item) => item.log_type === "Woke up" && !item.action_time);
  if (wake >= 0) return {
    field: "action_time" as const,
    index: wake,
    text: "What time did you wake up? You can say “6am”, “06:00”, or “skip”.",
  };
  return null;
}

export function applyDetailReply(pending: AssistantPending, reply: string) {
  if (pending.requestedField === "action_time") {
    if (/^(?:skip|not sure|unknown|unsure)$/i.test(reply.trim())) {
      return { ...pending, phase: "confirm" as const, requestedField: null };
    }
    const timed = interpretClock("at " + reply.trim()) ||
      (/^(?:[01]\\d|2[0-3]):[0-5]\\d$/.test(reply.trim()) ? reply.trim() : "");
    if (!timed) return null;
    const records = pending.records.map((item, index) => index === (pending.requestedIndex ?? 0)
      ? { ...item, action_time: timed } : item);
    return { ...pending, records, phase: "confirm" as const, requestedField: null };
  }
  if (pending.requestedField !== "water_amount_ml") return null;
  if (/^(?:skip|not sure|i don't know|unknown|no idea|unsure)$/i.test(reply.trim())) {
    return { ...pending, phase: "confirm" as const, requestedField: null };
  }
  const value = extractVolume(reply) ??
    (/^\d+(?:\.\d+)?$/.test(reply.trim()) ? Number(reply.trim()) : null);
  if (value === null || value <= 0 || value > 5000) return null;
  const records = pending.records.map((item, index) =>
    index === (pending.requestedIndex ?? 0)
      ? { ...item, water_amount_ml: value }
      : item);
  return { records, phase: "confirm" as const, requestedField: null };
}

export function summarizeRecords(records: Proposed[]) {
  return records.map((item) => {
    const time = item.action_time ? " at " + item.action_time : "";
    const volume = item.water_amount_ml !== null ? " (" + item.water_amount_ml + " ml)" : "";
    return item.title + volume + time + " on " + item.action_date;
  }).join("; ");
}

export function approvedDrafts(records: Proposed[]): CaptureDraft[] {
  return records.map((value) => ({ ...value, id: crypto.randomUUID(), approved: true }));
}
