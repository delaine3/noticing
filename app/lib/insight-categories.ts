import type { InsightLog } from "./log-types";

export const insightAreas = [
  {
    id: "body",
    title: "Body & energy",
    question: "How are sleep, food, drinks and movement showing up in my records?",
    description: "Sleep, meals, drinks, rest, exercise and time outside.",
    logType: "Sleep",
    recordPrompt: "Record sleep, a meal time, movement duration or drink quantity.",
    types: [
      "Sleep", "Woke up", "First meal", "Meal", "Dessert eaten", "Dessert craving",
      "Water", "Coffee", "Hygiene", "Sunlight", "Movement", "Exercise",
      "Treadmill walk", "Strength training", "Rest",
    ],
  },
  {
    id: "mind",
    title: "Mind & attention",
    question: "When am I feeling better or worse, and what might be connected?",
    description: "Mood, energy, stress, recurring thoughts, reading and scrolling.",
    logType: "Daily check-in",
    recordPrompt: "Rate mood, energy and stress, then name one concrete factor.",
    types: [
      "Daily check-in", "Reading", "TikTok used", "TikTok avoided",
      "Recurring thought",
    ],
  },
  {
    id: "work",
    title: "Work & progress",
    question: "What did I finish, send or follow up on?",
    description: "Deliverables, applications, follow-ups and interviews.",
    logType: "Focused work",
    recordPrompt: "Record the deliverable or application, plus a next step.",
    types: [
      "Job application", "Applied to Job", "Job follow-up", "Interview",
      "Updated Resume", "App work", "Focused work",
    ],
  },
  {
    id: "life",
    title: "Home & people",
    question: "What is improving daily life, my environment and my relationships?",
    description: "Household tasks, garden care, social time and creative activities.",
    logType: "Social interaction",
    recordPrompt: "Record a specific activity and how it affected your day.",
    types: [
      "Cook", "Wash Dishes", "Clean", "Yard Work", "Plant care",
      "Social interaction", "Family system", "Creative time",
    ],
  },
] as const;

export type InsightAreaId = (typeof insightAreas)[number]["id"];
export type InsightArea = (typeof insightAreas)[number];

export function getInsightArea(id: string) {
  return insightAreas.find((area) => area.id === id);
}

export function getInsightAreaLogs(logs: InsightLog[], id: InsightAreaId) {
  const area = getInsightArea(id);
  if (!area) return [];
  const types: readonly string[] = area.types;
  return logs.filter((log) => types.includes(log.log_type));
}

export function getLogDate(log: InsightLog) {
  return log.action_date || log.occurred_at.slice(0, 10);
}

export function formatLogDate(date: string) {
  // Noon avoids timezone rollover when formatting a YYYY-MM-DD date.
  return new Date(date + "T12:00:00").toLocaleDateString("en", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function getLoggedDays(logs: InsightLog[]) {
  return new Set(logs.map(getLogDate)).size;
}
