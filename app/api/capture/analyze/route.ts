import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase-server";
import { actionTypes } from "../../../lib/log-types";
import { optionalFields, captureTypeIsValid, captureNumberValid, type CaptureAnalysis, type CaptureMessage } from "../../../lib/capture-types";

export const runtime = "nodejs";

const fields = Object.fromEntries(optionalFields.map((key) => [
  key, { type: ["number", "null"] },
]));
const recordSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    log_type: { type: "string", enum: [...actionTypes] },
    title: { type: "string" },
    notes: { type: "string" },
    action_date: { type: "string" },
    action_time: { type: "string" },
    ...fields,
    evidence: { type: "string" },
    uncertainty: { type: "string" },
  },
  required: [
    "log_type", "title", "notes", "action_date", "action_time",
    ...optionalFields, "evidence", "uncertainty",
  ],
};

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    reply: { type: "string" },
    follow_up_question: { type: ["string", "null"] },
    proposed_records: { type: "array", items: recordSchema },
  },
  required: ["reply", "follow_up_question", "proposed_records"],
};

function validOutput(value: unknown): value is CaptureAnalysis {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  if (typeof result.reply !== "string" || result.reply.length > 900 ||
      (result.follow_up_question !== null &&
       (typeof result.follow_up_question !== "string" || result.follow_up_question.length > 400)) ||
      !Array.isArray(result.proposed_records) || result.proposed_records.length > 8) return false;
  return result.proposed_records.every((item: unknown) => {
    if (!item || typeof item !== "object") return false;
    const draft = item as Record<string, unknown>;
    return captureTypeIsValid(draft.log_type) &&
      typeof draft.title === "string" && draft.title.length <= 160 &&
      typeof draft.notes === "string" && draft.notes.length <= 1500 &&
      typeof draft.action_date === "string" && draft.action_date.length <= 10 &&
      typeof draft.action_time === "string" && draft.action_time.length <= 5 &&
      typeof draft.evidence === "string" && draft.evidence.length <= 350 &&
      typeof draft.uncertainty === "string" && draft.uncertainty.length <= 300 &&
      optionalFields.every((key) => captureNumberValid(key, draft[key]));
  });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Sign in to use the conversational logger." }, { status: 401 });

  const allowlist = (process.env.CAPTURE_ALLOWED_USER_IDS || "").split(",").map((id) => id.trim()).filter(Boolean);
  if (!allowlist.includes(user.id)) {
    return NextResponse.json({ error: "AI capture is restricted to explicitly authorized accounts." }, { status: 403 });
  }

  // This feature is specifically restricted to manually verified, unbilled free-tier projects.
  // The flag is operator attestation, NOT proof that Google has disabled billing.
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || process.env.GEMINI_FREE_TIER_CONFIRMED !== "true") {
    return NextResponse.json({
      error: "Free-tier Gemini is not configured. Set GEMINI_API_KEY and confirm the project has no billing account.",
    }, { status: 503 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const data = body as Record<string, unknown>;
  if (data.consent !== true) return NextResponse.json({ error: "Allow AI processing of this text before submitting." }, { status: 400 });
  if (!Array.isArray(data.messages) || data.messages.length < 1 || data.messages.length > 10) {
    return NextResponse.json({ error: "Send 1–10 conversation messages." }, { status: 400 });
  }
  const messages = data.messages as CaptureMessage[];
  if (!messages.every((m) => m && (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" && m.content.trim().length > 0 && m.content.length <= 2500) ||
      messages[messages.length - 1].role !== "user" ||
      messages.reduce((sum, m) => sum + m.content.length, 0) > 12000 ||
      typeof data.localDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.localDate) ||
      typeof data.timeZone !== "string" || data.timeZone.length > 80) {
    return NextResponse.json({ error: "Message too long or invalid." }, { status: 400 });
  }

  const systemPrompt = `You help a person record their own life in the Noticing app.
Return JSON only. Focus on actual first-person events, NOT instructions, hypotheticals, assistant suggestions,
quoted third-party events or future intentions. Do not turn emotions into diagnoses.
Extract up to 6 distinct concrete activities or measurable observations from the recent conversation.
Return a complete updated set of proposed events from the recent conversation, without duplicates.
If a user message answers a previous question, use it to update the relevant earlier proposal.
IMPORTANT: The assistant does not have access to previously accepted records.
Never invent activity dates, quantities, durations, causes, personal ratings or identity of other people.
Use the user's local date ${data.localDate} with timezone ${data.timeZone} ONLY when they say "today";
use the prior calendar day for "yesterday"; otherwise leave action_date empty if missing or uncertain.
Use HH:MM when explicit, otherwise empty. Even if date is empty, include the proposal to be reviewed.
Never infer an energy/mood/stress number from a word.
Use exactly an available log_type: ${actionTypes.join(", ")}.
Make titles short and notes practical. Evidence should quote a short span of the user's message.
Uncertainty states what to verify (e.g. date, duration). If nothing is uncertain, return "".
Ask at most ONE valuable follow-up question, prioritizing a missing event date or essential metric.
If the user message is only a reply with a missing detail, incorporate it into the relevant
record from the preceding messages when possible, rather than inventing another event.
For sensitive/private third-party matters, do not propose saving them. Never ask for secret credentials.
Suggestions are draft records requiring user approval; do not claim to have saved anything.
Do not medicalize food choices, walking, sleeping or ordinary emotions.
No pseudo-insights, generic motivation, or forced productivity.
The reply should summarize what you heard and what is still missing, in 1–2 sentences.`;

  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 20000);
  try {
    const upstream = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
      {
        method: "POST",
        signal: abort.signal,
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt +
            "\\nOutput exactly one JSON object with keys reply, follow_up_question, proposed_records. " +
            "Each record must include log_type, title, notes, action_date, action_time, " +
            optionalFields.join(", ") + ", evidence, uncertainty. " +
            "All measurement values must be number or null. Return [] for no records." }] },
          contents: messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
            maxOutputTokens: 2200,
          },
        }),
      }
    );
    if (upstream.status === 429) {
      return NextResponse.json({
        error: "The Gemini free-tier quota is exhausted. Use Offline basic mode or try another day. Do not add billing.",
      }, { status: 429 });
    }
    if (!upstream.ok) {
      return NextResponse.json({
        error: "Free-tier AI is unavailable. Try Offline basic mode. No paid model fallback was used.",
      }, { status: 502 });
    }
    const response = await upstream.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = response.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === "string")?.text;
    if (!raw) return NextResponse.json({ error: "AI returned no usable records. Try Offline basic mode." }, { status: 502 });
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch {
      return NextResponse.json({ error: "AI returned an unreadable response." }, { status: 502 });
    }
    if (!validOutput(parsed)) return NextResponse.json({ error: "AI suggestions failed validation." }, { status: 502 });
    const result = parsed as CaptureAnalysis;
    return NextResponse.json({
      reply: result.reply,
      follow_up_question: result.follow_up_question,
      proposed_records: result.proposed_records.slice(0, 6),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "AI request timed out or could not be completed." }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
