export type ConditionalField =
  | "effect"
  | "meal"
  | "water"
  | "mood"
  | "treadmill"
  | "strength"
  | "energy"
  | "intensity";

export type ActionConfig = {
  heading: string;
  instruction: string;
  titleLabel: string;
  titlePlaceholder: string;
  notesPlaceholder: string;
  fields: ConditionalField[];
};

export const actionConfig: Record<string, ActionConfig> = {
  "Woke up": {
    heading: "You woke up. Log the start point.",
    instruction: "Record the time. No autobiography required.",
    titleLabel: "Wake-up note",
    titlePlaceholder:
      "Example: woke up late, woke naturally, alarm dragged me out",
    notesPlaceholder: "Anything useful about sleep, dreams, body, or mood?",
    fields: ["energy", "mood"],
  },

  "First meal": {
    heading: "Good. Feed the body.",
    instruction:
      "Log what you ate, when, how big it was, and where it came from.",
    titleLabel: "What did you eat?",
    titlePlaceholder: "Example: eggs and toast, leftover pizza, chicken patty",
    notesPlaceholder: "Did it help? Did it feel like enough?",
    fields: ["meal", "effect", "energy"],
  },

  Meal: {
    heading: "Meal logged. Data collected.",
    instruction: "Track the food without turning it into a whole courtroom.",
    titleLabel: "What did you eat?",
    titlePlaceholder: "Example: rice and chicken, sandwich, fruit and yogurt",
    notesPlaceholder: "Texture, fullness, energy after, anything useful.",
    fields: ["meal", "effect", "energy"],
  },

  "Dessert eaten": {
    heading: "Dessert happened. Log it and move.",
    instruction: "No moral drama. Record the facts.",
    titleLabel: "What dessert?",
    titlePlaceholder: "Example: ice cream, cake, chocolate",
    notesPlaceholder: "Worth it? Too sweet? Craving satisfied?",
    fields: ["meal", "effect", "intensity"],
  },

  "Dessert craving": {
    heading: "Craving detected. Do not let it drive the bus.",
    instruction: "Log intensity and trigger. Then decide with a fed brain.",
    titleLabel: "Craving target",
    titlePlaceholder: "Example: ice cream, cookies, something sweet",
    notesPlaceholder:
      "What triggered it? Boredom, hunger, sadness, TikTok, fatigue?",
    fields: ["intensity", "effect"],
  },

  Water: {
    heading: "Water. Basic maintenance.",
    instruction: "Log the amount. The body likes receipts.",
    titleLabel: "Water note",
    titlePlaceholder: "Example: rooibos, one glass, bottle refill",
    notesPlaceholder: "Optional. Only note what matters.",
    fields: ["water", "effect"],
  },
  "Wash Up": {
    heading: "Washed up. Excellent. System reset.",
    instruction: "Track the reset action.",
    titleLabel: "Wash-up type",
    titlePlaceholder: "Example: shower, bath, face wash, brushed teeth",
    notesPlaceholder: "Did it improve your state?",
    fields: ["effect", "energy", "mood"],
  },

  Sunlight: {
    heading: "Sunlight logged. Mammal protocol engaged.",
    instruction: "Track how long and where.",
    titleLabel: "Sunlight type",
    titlePlaceholder: "Example: sat outside, stood by window, walked in sun",
    notesPlaceholder: "How long? Did your mood or body shift?",
    fields: ["effect", "energy", "mood"],
  },

  Movement: {
    heading: "Movement counts. Tiny is valid.",
    instruction: "Track the movement. No fitness theatrics required.",
    titleLabel: "Movement type",
    titlePlaceholder: "Example: paced house, stretched, quick walk",
    notesPlaceholder: "How long? Did it change your state?",
    fields: ["effect", "energy", "mood"],
  },

  Exercise: {
    heading: "Exercise logged. Evidence secured.",
    instruction: "Track what you did and how it affected you.",
    titleLabel: "Exercise type",
    titlePlaceholder: "Example: weights, treadmill, home workout",
    notesPlaceholder: "Duration, intensity, body feel.",
    fields: ["effect", "energy", "intensity"],
  },

  "Treadmill walk": {
    heading: "Treadmill rep. Count it properly.",
    instruction: "Log time and distance. Pace gets calculated automatically.",
    titleLabel: "Treadmill note",
    titlePlaceholder: "Example: incline walk, easy pace, reading walk",
    notesPlaceholder:
      "Incline, book, energy after, anything worth remembering.",
    fields: ["treadmill", "effect", "energy", "intensity"],
  },

  "Strength training": {
    heading: "Strength work. Receipts required.",
    instruction:
      "List the workout, sets, reps, and weight. Volume and records will be calculated.",
    titleLabel: "Workout focus",
    titlePlaceholder: "Example: triceps, legs, full body",
    notesPlaceholder: "Body feel, soreness, form notes, anything useful.",
    fields: ["strength", "effect", "energy", "intensity"],
  },

  Reading: {
    heading: "Reading counts. Attention reclaimed.",
    instruction: "Log what you read.",
    titleLabel: "Reading note",
    titlePlaceholder: "Example: Kindle, novel, 20 pages",
    notesPlaceholder: "Did it calm you, engage you, or sharpen your brain?",
    fields: ["effect", "mood"],
  },

  "App work": {
    heading: "App work counts as work.",
    instruction: "Track the task. Keep the receipt.",
    titleLabel: "Task completed",
    titlePlaceholder:
      "Example: fixed form fields, added route, debugged Supabase",
    notesPlaceholder: "What changed? What should future you know?",
    fields: ["effect", "energy"],
  },

  "TikTok used": {
    heading: "TikTok used. Log the cost.",
    instruction: "No denial. Record duration, trigger, and effect.",
    titleLabel: "TikTok session",
    titlePlaceholder: "Example: couples content, scrolling, random feed",
    notesPlaceholder: "Did it leave you better, neutral, or emptier?",
    fields: ["effect", "intensity", "mood"],
  },

  "TikTok avoided": {
    heading: "TikTok avoided. Good. Attention protected.",
    instruction: "Log the win.",
    titleLabel: "Avoidance note",
    titlePlaceholder: "Example: read instead, closed app, didn’t reinstall",
    notesPlaceholder: "What did you do instead?",
    fields: ["effect", "mood"],
  },

  "Plant care": {
    heading: "Plant care logged. The green citizens are handled.",
    instruction: "Track what you did.",
    titleLabel: "Plant care action",
    titlePlaceholder: "Example: changed water, checked roots, repotted Earth",
    notesPlaceholder: "Which plant? What changed?",
    fields: ["effect"],
  },

  "Recurring thought": {
    heading: "Thought loop detected. Do not spiral for free.",
    instruction:
      "Log the thought, rate intensity, then return to body maintenance.",
    titleLabel: "Thought label",
    titlePlaceholder: "Example: money worry, family worry, future panic",
    notesPlaceholder:
      "What triggered it? Is there an action, or is this a loop?",
    fields: ["intensity", "mood"],
  },

  "Social interaction": {
    heading: "Social contact logged.",
    instruction: "Track whether it nourished, drained, or annoyed you.",
    titleLabel: "Interaction",
    titlePlaceholder: "Example: talked to mom, texted friend, family chat",
    notesPlaceholder: "What was the impact?",
    fields: ["effect", "mood", "energy"],
  },

  Rest: {
    heading: "Rest logged. Recovery is not a crime.",
    instruction: "Track rest so you stop treating it like missing evidence.",
    titleLabel: "Rest type",
    titlePlaceholder: "Example: nap, lay down, bath, no-phone break",
    notesPlaceholder: "Did it restore you?",
    fields: ["effect", "energy", "mood"],
  },
};

export function getActionConfig(actionType: string): ActionConfig {
  return (
    actionConfig[actionType] ?? {
      heading: "Log the action.",
      instruction: "Record what happened and keep moving.",
      titleLabel: "Short label",
      titlePlaceholder: "What happened?",
      notesPlaceholder: "What mattered here?",
      fields: ["effect"],
    }
  );
}
