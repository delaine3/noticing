export type ThoughtRecord = {
  id: string;
  kind: "checkin" | "journal";
  title: string;
  body: string;
  entryDate: string;
  recordedAt: string;
  topic: string;
  status: "saved" | "draft";
  mood?: number | null;
  energy?: number | null;
  stress?: number | null;
};

export type Flower = {
  id: string;
  color: string;
  center: string;
  label: string;
  excerpt?: string;
  petals: number;
  tilt: number;
};

const palette: Record<string, [string, string]> = {
  work: ["#eaa18c", "#8b4c3e"],
  worries: ["#a99bd0", "#65558f"],
  planning: ["#b3c4e5", "#566fa5"],
  relationships: ["#eb9cb2", "#9d4c6a"],
  enjoyment: ["#f2c578", "#ad7c3e"],
  everyday: ["#a6c9a2", "#538253"],
  other: ["#cfadd0", "#825488"],
  prefer_not_to_say: ["#d7d2c5", "#746b61"],
  journal: ["#f4b7ae", "#8b5d82"],
};

export function safeMonth(value: string | undefined, fallback: string) {
  if (!value || !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(value)) return fallback;
  const year = Number(value.slice(0, 4));
  return year >= 2000 && year <= 2100 ? value : fallback;
}
export function monthBounds(key: string) {
  const [y, m] = key.split("-").map(Number);
  const start = key + "-01";
  const next = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
  return { start, next };
}
export function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}
export function monthIsComplete(month: string, today: string) {
  const current = today.slice(0, 7);
  if (month < current) return true;
  if (month > current) return false;
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Number(today.slice(8, 10)) === last;
}
export function flowerForThought(item: Pick<ThoughtRecord, "id" | "topic">): Flower {
  let seed = 0;
  for (const character of item.id) seed = (Math.imul(seed, 31) + character.charCodeAt(0)) >>> 0;
  const [color, center] = palette[item.topic] ?? palette.other;
  return {
    id: item.id, color, center, label: item.topic.replaceAll("_", " "),
    petals: 5 + (seed % 4), tilt: (seed % 31) - 15,
  };
}
export function bouquetThoughts(entries: ThoughtRecord[], max = 9) {
  // One flower per saved written thought. No AI-generated interpretation.
  return entries.filter((entry) => entry.body.trim() && entry.status === "saved")
    .sort((a, b) => a.entryDate.localeCompare(b.entryDate) || a.id.localeCompare(b.id))
    .slice(-max).map((entry) => ({
      ...flowerForThought(entry),
      excerpt: entry.body.replace(/\s+/g, " ").trim().slice(0, 110),
    }));
}
