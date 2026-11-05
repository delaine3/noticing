/**
 * All cloud inference is opt-in. The selected Workers AI model is known to
 * operate on Cloudflare's Free plan; no caller-supplied model or endpoint.
 *
 * Confirm the Cloudflare account is *actually* on the Workers Free plan
 * before enabling this. There is no remote API guarantee that a paid account
 * cannot exceed the allowance, so server configuration must fail closed.
 */
export const FREE_WORKERS_MODEL = "@cf/meta/llama-3.1-8b-instruct";

export function freeCloudConfigured(env: {
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_WORKERS_AI_TOKEN?: string;
  CLOUDFLARE_FREE_PLAN_CONFIRMED?: string;
}) {
  return env.CLOUDFLARE_FREE_PLAN_CONFIRMED === "true" &&
    !!env.CLOUDFLARE_WORKERS_AI_TOKEN &&
    !!env.CLOUDFLARE_ACCOUNT_ID &&
    /^[a-f0-9]{32}$/i.test(env.CLOUDFLARE_ACCOUNT_ID);
}

export function cloudPrompt(today: string) {
  return [
    "You are a private activity extraction assistant for Noticing.",
    "Extract at most three *completed first-person activities* from the user's current text.",
    "Ignore hypothetical actions, plans, other people's activities and private information about third parties.",
    "Do not invent quantities, dates, scores or causes. If the user says today, use " + today + ".",
    "Use only these types: Water, Coffee, Meal, Movement, Exercise, Reading, Plant care,",
    "Creative time, Job application, Focused work, Rest, Bedtime, Woke up, Personal observation.",
    "Return a short valid JSON object with the keys reply, follow_up_question, proposed_records.",
    "Each proposed record must have log_type, title, action_date (or empty), action_time (or empty),",
    "notes (or empty), evidence (short matching words), uncertainty (or empty).",
    "Include numeric measurements only if explicitly reported; omit other metric keys.",
    "If no explicit completed activities were described, return proposed_records: [].",
    "Never offer medical diagnoses or hydration prescriptions. Never claim to have saved any record.",
    "Output JSON only, no markdown.",
  ].join("\n");
}
