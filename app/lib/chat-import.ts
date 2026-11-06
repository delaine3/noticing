/** Browser-side parsing for ChatGPT's conversations.json export.
 * Never sends transcript text to the server. Only approved, edited drafts are saved.
 */
export type ImportCategory = "body" | "mind" | "work" | "life";
export type ImportType =
  | "Treadmill walk" | "Movement" | "Water" | "Sleep" | "Meal"
  | "Job application" | "Focused work" | "Creative time"
  | "Plant care" | "Reading" | "Home improvement" | "Personal observation";

export const IMPORT_TYPES: { value: ImportType; label: string; area: ImportCategory }[] = [
  { value: "Treadmill walk", label: "Treadmill", area: "body" },
  { value: "Movement", label: "Movement", area: "body" },
  { value: "Water", label: "Drink", area: "body" },
  { value: "Sleep", label: "Sleep", area: "body" },
  { value: "Meal", label: "Food", area: "body" },
  { value: "Job application", label: "Job application", area: "work" },
  { value: "Focused work", label: "Work result", area: "work" },
  { value: "Creative time", label: "Creative activity", area: "life" },
  { value: "Plant care", label: "Plant care", area: "life" },
  { value: "Reading", label: "Reading", area: "mind" },
  { value: "Home improvement", label: "Home improvement", area: "life" },
  { value: "Personal observation", label: "Personal observation", area: "mind" },
];

export type ImportProposal = {
  sourceKey: string;
  conversationTitle: string;
  reportedDate: string;
  eventDate?: string;
  messageExcerpt: string;
  type: ImportType;
  title: string;
  notes: string;
  distanceKm?: number;
  durationMinutes?: number;
  waterMl?: number;
  sleepHours?: number;
};

export type ImportConversation = {
  id: string;
  title: string;
  reportedDate: string;
  messageCount: number;
  proposals: ImportProposal[];
  topicSignals: string[];
};

type Dict = Record<string, unknown>;

function obj(v: unknown): Dict | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? v as Dict : null;
}
function str(v: unknown) { return typeof v === "string" ? v : ""; }
function dateOf(v: unknown): string {
  const n = typeof v === "number" ? v : typeof v === "string" && /^\d+(?:\.\d+)?$/.test(v) ? Number(v) : NaN;
  const timestamp = Number.isFinite(n) ? new Date(n * 1000) : new Date(str(v));
  return Number.isNaN(timestamp.getTime()) ? "" : timestamp.toISOString().slice(0, 10);
}
function safeNumber(v: string, max: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n <= max ? n : null;
}
function clip(v: string, max = 240) {
  const s = v.replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}
function ownExperience(text: string) {
  return /\b(?:I|I've|I’d|I'm|my|we|we've)\b/i.test(text);
}
const exclusion = /\b(?:imagine if|hypothetically|what if|suppose that|let's pretend|for example|could someone|should i|would you)\b/i;
const sensitive = /\b(?:password|passcode|api key|secret key|social security number|bank account|credit card number|suicid|self.harm|sexual assault|diagnos(?:is|ed))\b/i;

function oneMessage(text: string, date: string, key: string, title: string): ImportProposal[] {
  const content = clip(text, 1600);
  if (!ownExperience(content) || exclusion.test(content) || sensitive.test(content)) return [];
  const base = { conversationTitle: title, reportedDate: date, messageExcerpt: clip(content, 320) };
  const output: ImportProposal[] = [];
  const add = (kind: string, type: ImportType, entryTitle: string, notes: string, values: Partial<ImportProposal> = {}) => {
    output.push({ ...base, sourceKey: key + ":" + kind, type, title: clip(entryTitle, 110), notes: clip(notes, 400), ...values });
  };

  const km = content.match(/\b(\d{1,2}(?:\.\d{1,2})?)\s?km\b/i);
  if (km && /\b(?:treadmill|i (?:walked|ran|completed|did|finished)\b)/i.test(content)) {
    const distance = safeNumber(km[1], 100);
    if (distance !== null) {
      const treadmill = /\btreadmill\b/i.test(content);
      const duration = content.match(/\b(?:for|in|took|duration:?|time:?)\s*(\d{1,3})\s*(?:min(?:ute)?s?)\b/i);
      const durationMinutes = duration ? safeNumber(duration[1], 1440) ?? undefined : undefined;
      add("distance", treadmill ? "Treadmill walk" : "Movement",
        (treadmill ? "Treadmill session: " : "Walk/run: ") + distance + " km",
        "Distance explicitly mentioned in a chat message. Check event date and activity before saving.",
        { distanceKm: distance, durationMinutes });
    }
  }

  const drink = content.match(/\b(?:i (?:drank|had)|i've (?:drunk|had))\s+(\d+(?:\.\d+)?)\s*(ml|l(?:itre|iter)?s?)\s+(?:of\s+)?(?:water|tea|coffee)\b/i);
  if (drink) {
    const ml = Number(drink[1]) * (drink[2].toLowerCase().startsWith("l") ? 1000 : 1);
    if (ml > 0 && ml <= 5000) add("drink", "Water", "Drink: " + ml + " ml", "Drink amount explicitly reported.", { waterMl: ml });
  }

  const sleep = content.match(/\b(?:i (?:slept|got)|i've (?:slept|gotten))\s+(?:for\s+)?(\d+(?:\.\d+)?)\s*hours?\b/i);
  if (sleep) {
    const hours = safeNumber(sleep[1], 24);
    if (hours !== null) add("sleep", "Sleep", "Slept " + hours + " hours", "Hours of sleep explicitly reported.", { sleepHours: hours });
  }

  if (/\bi (?:applied (?:to|for)|submitted (?:a|an|my) (?:job )?application)\b/i.test(content) &&
      !/\bi (?:want|plan|hope|intend|need) to apply\b/i.test(content)) {
    add("application", "Job application", "Job application mentioned", "Identify the employer, role and submission date before saving.");
  }
  if (/\bi (?:sent|emailed|submitted) (?:\d+\s+)?(?:proposals?|outreach emails?|pitch emails?)\b/i.test(content)) {
    add("outreach", "Focused work", "Professional outreach sent", "Add the number of messages, recipients and follow-up dates if known.");
  }
  if (/\bi (?:photographed|painted|drew|sketched|wrote a story|recorded a vlog)\b/i.test(content)) {
    add("creative", "Creative time", "Creative activity reported", "Name what you made or photographed and whether you want to repeat it.");
  }
  if (/\bi (?:watered|pruned|repotted|mulched|planted)\b/i.test(content) && /\b(?:roses?|garden|trees?|plants?|avocado)\b/i.test(content)) {
    add("plants", "Plant care", "Garden or plant care", "Specify the plants and work completed.");
  }
  if (/\bi (?:read|finished reading) (?:\d+ pages?|a book|my book)\b/i.test(content)) {
    add("read", "Reading", "Reading session mentioned", "Add the book and pages if available.");
  }
  if (/\bi (?:installed|fixed|repaired|replaced)\b/i.test(content) &&
      /\b(?:dishwasher|door|sink|appliance|faucet|tap|fence|hinge)\b/i.test(content)) {
    add("home", "Home improvement", "Home improvement reported", "Describe what changed and whether it reduced effort or cost.");
  }

  return output.slice(0, 4);
}

const topics: { name: string; pattern: RegExp }[] = [
  { name: "Household friction and time saved", pattern: /\b(?:dishwasher|chores|washing dishes|household|cleaning)\b/i },
  { name: "Professional outreach and follow-through", pattern: /\b(?:applications?|proposals?|outreach|interview|client|follow.up)\b/i },
  { name: "Activities worth repeating", pattern: /\b(?:roses?|gardening|painting|photograph|reading|karaoke|creative)\b/i },
  { name: "Rest and energy", pattern: /\b(?:sleep|slept|rest|tired|energy|treadmill|walked)\b/i },
];

function readMessages(conversation: Dict) {
  const mapping = obj(conversation.mapping);
  const nodes: unknown[] = mapping ? Object.values(mapping) : Array.isArray(conversation.messages) ? conversation.messages : [];
  const output: { id: string; date: string; text: string }[] = [];
  for (const node of nodes) {
    const n = obj(node);
    const m = obj(n?.message ?? node);
    if (!m || obj(m.author)?.role !== "user") continue;
    if (obj(m.metadata)?.is_visually_hidden_from_conversation === true) continue;
    const parts = obj(m.content)?.parts;
    if (!Array.isArray(parts)) continue;
    const text = parts.filter((x): x is string => typeof x === "string").join("\n").trim();
    if (!text || text.length > 16000) continue;
    output.push({
      id: str(m.id) || str(n?.id) || String(output.length),
      date: dateOf(m.create_time) || dateOf(conversation.create_time),
      text,
    });
  }
  return output;
}

function parseCuratedRecords(input: Dict): ImportConversation[] {
  // A compact, explicit, review-first format for hand-curated historical
  // activities, not a reconstructed or fabricated ChatGPT transcript.
  const entries = input.records;
  if (!Array.isArray(entries) || entries.length > 500) {
    throw new Error("Curated Hoolayah files need a records array with 500 or fewer entries.");
  }
  const allowed = new Set<string>(IMPORT_TYPES.map((type) => type.value));
  const areas: Record<string, { title: string; proposals: ImportProposal[] }> = {
    body: { title: "Body & energy · curated records", proposals: [] },
    mind: { title: "Mind & attention · curated records", proposals: [] },
    work: { title: "Work & progress · curated records", proposals: [] },
    life: { title: "Home & people · curated records", proposals: [] },
  };
  const used = new Set<string>();
  for (const [index, raw] of entries.entries()) {
    const item = obj(raw);
    if (!item) continue;
    const type = str(item.log_type);
    const area = str(item.area);
    const id = str(item.id);
    const eventDate = str(item.action_date);
    const reportedDate = str(item.reported_date);
    const title = str(item.title);
    const notes = str(item.notes);
    const evidence = str(item.evidence_summary);
    const metrics = obj(item.metrics) ?? {};
    if (!id || used.has(id) || id.length > 120 || !allowed.has(type) ||
        !Object.prototype.hasOwnProperty.call(areas, area) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) ||
        !title.trim() || title.length > 120 ||
        notes.length > 1500) {
      throw new Error("Invalid curated Hoolayah record at position " + (index + 1) + ".");
    }
    const date = new Date(eventDate + "T12:00:00Z");
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== eventDate) {
      throw new Error("Invalid event date in curated record " + (index + 1) + ".");
    }
    used.add(id);
    const measurement = (key: string, limit: number) => {
      const val = metrics[key];
      return typeof val === "number" && Number.isFinite(val) && val > 0 && val <= limit ? val : undefined;
    };
    areas[area].proposals.push({
      sourceKey: "noticing-curated:" + id,
      conversationTitle: areas[area].title,
      reportedDate: reportedDate || eventDate,
      eventDate,
      messageExcerpt: "Curated paraphrase, not an original chat quote. " + evidence.slice(0, 220),
      type: type as ImportType,
      title,
      notes,
      distanceKm: measurement("distanceKm", 100),
      durationMinutes: measurement("durationMinutes", 1440),
      waterMl: measurement("waterMl", 5000),
      sleepHours: measurement("sleepHours", 24),
    });
  }
  return Object.entries(areas)
    .filter(([, group]) => group.proposals.length)
    .map(([area, group]) => ({
      id: "noticing-curated-" + area,
      title: group.title,
      reportedDate: group.proposals[0]?.reportedDate ?? "",
      messageCount: group.proposals.length,
      proposals: group.proposals,
      topicSignals: [],
    }));
}

export function parseChatExport(input: unknown): ImportConversation[] {
  const structured = obj(input);
  if (structured && structured.format === "noticing-curated-v1") {
    return parseCuratedRecords(structured);
  }
  if (!Array.isArray(input)) throw new Error("Expected a ChatGPT conversations.json array or a Hoolayah curated-v1 JSON file.");
  if (input.length > 100000) throw new Error("This export is too large for an in-browser preview.");
  const result: ImportConversation[] = [];
  for (const [index, value] of input.entries()) {
    const conversation = obj(value);
    if (!conversation) continue;
    const title = clip(str(conversation.title) || "Untitled conversation", 100);
    const id = str(conversation.id) || "conversation-" + index;
    const messages = readMessages(conversation);
    const proposals: ImportProposal[] = [];
    const foundTopics = new Set<string>();
    for (const message of messages) {
      // Topics indicate what to investigate, not a conclusion about the person.
      if (!sensitive.test(message.text)) {
        for (const t of topics) if (t.pattern.test(message.text)) foundTopics.add(t.name);
      }
      proposals.push(...oneMessage(message.text, message.date, id + ":" + message.id, title));
    }
    if (messages.length) {
      result.push({
        id, title,
        reportedDate: dateOf(conversation.create_time),
        messageCount: messages.length,
        proposals: proposals.slice(0, 80),
        topicSignals: [...foundTopics],
      });
    }
  }
  return result.sort((a, b) => b.reportedDate.localeCompare(a.reportedDate));
}
