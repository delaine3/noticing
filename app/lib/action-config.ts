export type ConditionalField =
  | "effect"
  | "meal"
  | "water"
  | "mood"
  | "treadmill"
  | "strength"
  | "energy"
  | "intensity"
  | "hygiene";

export type ActionConfig = {
  heading: string;
  instruction: string;
  titleLabel: string;
  titlePlaceholder: string;
  notesPlaceholder: string;
  autoButtons?: string[];
  fields: ConditionalField[];
};

export const actionConfig: Record<string, ActionConfig> = {
  "Daily check-in": {
    heading: "How are you doing today?",
    instruction: "Rate mood, energy and stress. Add a concrete reason, if known. Try to record at a similar time each day.",
    titleLabel: "What affected today? (optional)",
    titlePlaceholder: "Example: slept poorly, completed difficult task, enjoyed garden",
    notesPlaceholder: "What happened? What might help next? Write observations, not predictions.",
    fields: ["mood", "energy", "intensity"],
  },
  "Bedtime": {
    heading: "Record when you went to bed",
    instruction: "This is your bedtime, not proof that you fell asleep immediately. You can record wake-up tomorrow.",
    titleLabel: "Bedtime note (optional)",
    titlePlaceholder: "Example: went to bed around 9:30 PM",
    notesPlaceholder: "Optional: what helped you wind down?",
    fields: [],
  },
  "Sleep": {
    heading: "Record last night's sleep",
    instruction: "Enter the hours you actually slept. Add how rested you feel and whether anything interrupted sleep.",
    titleLabel: "Sleep note",
    titlePlaceholder: "Example: woke twice, slept through the night",
    notesPlaceholder: "Bedtime, wake time, interruptions, and how rested you feel.",
    fields: ["energy", "mood"],
  },
  "Focused work": {
    heading: "Record work with an outcome",
    instruction: "Describe the result, not just time spent. Add the next action, if any.",
    titleLabel: "What did you finish or advance?",
    titlePlaceholder: "Example: fixed login error; sent proposal to Client X",
    notesPlaceholder: "What was delivered? What is blocked? Next step and follow-up date?",
    fields: ["effect", "energy"],
  },
  "Job follow-up": {
    heading: "Track an employer response or follow-up",
    instruction: "Name the company, role, and contact. Record what was sent, received, or agreed.",
    titleLabel: "Employer and role",
    titlePlaceholder: "Example: Developer at Company X",
    notesPlaceholder: "Contact method, response, next step, deadline. Don't include confidential personal data.",
    fields: [],
  },
  "Interview": {
    heading: "Record an interview",
    instruction: "Capture the employer, role, date and next steps.",
    titleLabel: "Employer and role",
    titlePlaceholder: "Example: Frontend Engineer at Company X",
    notesPlaceholder: "Interview stage, topics discussed, follow-up date and outcome.",
    fields: ["effect"],
  },
  "Creative time": {
    heading: "Record time spent making something",
    instruction: "What did you create, practice or enjoy? Not everything needs to be productive.",
    titleLabel: "What did you do?",
    titlePlaceholder: "Example: painted a rose; wrote a short story; sang karaoke",
    notesPlaceholder: "How long? What was satisfying? Would you do it again?",
    fields: ["effect", "mood"],
  },
  "Woke up": {
    heading: "You woke up. Log the start point.",
    instruction: "Record the time. No autobiography required.",
    titleLabel: "Wake-up note",
    titlePlaceholder:
      "Example: woke up late, woke naturally, alarm dragged me out",
    notesPlaceholder: "Anything useful about sleep, dreams, body, or mood?",
    fields: ["energy", "mood"],
  },
  "Job application": {
    heading: "Record a job application",
    instruction: "Record the job.",
    titleLabel: "Job application note",
    titlePlaceholder: "Example: Software Engineer at Company X",
    notesPlaceholder: "Application link, follow-up date, or response received?",
    fields: [],
  },
  "First meal": {
    heading: "Record your first meal",
    instruction:
      "Log what you ate, when, how big it was, and where it came from.",
    titleLabel: "What did you eat?",
    titlePlaceholder: "Example: eggs and toast, leftover pizza, chicken",
    notesPlaceholder: "What time did you eat? How hungry were you beforehand?",
    fields: ["meal", "effect", "energy", "mood"],
  },

  Meal: {
    heading: "Record a meal",
    instruction: "Track the food without turning it into a whole thing.",
    titleLabel: "What did you eat?",
    titlePlaceholder: "Example: rice and chicken, sandwich, fruit and yogurt",
    notesPlaceholder: "Texture, fullness, energy after, anything useful.",
    fields: ["meal", "effect", "energy"],
  },

  "Dessert eaten": {
    heading: "Record what you ate",
    instruction: "No moral drama. Record the facts.",
    titleLabel: "What dessert?",
    titlePlaceholder: "Example: ice cream, cake, chocolate",
    notesPlaceholder: "Worth it? Too sweet? Craving satisfied?",
    fields: ["meal", "effect", "intensity"],
  },

  "Dessert craving": {
    heading: "Record a craving",
    instruction: "Log intensity and trigger. Then decide with a fed brain.",
    titleLabel: "Craving target",
    titlePlaceholder: "Example: ice cream, cookies, something sweet",
    notesPlaceholder:
      "What happened just before the craving? How long did it last?",
    fields: ["intensity", "effect"],
  },

  Water: {
    heading: "Record a drink",
    instruction: "Log the amount.",
    titleLabel: "Water note",
    autoButtons: ["Lemon Water", "Coffee"],
    titlePlaceholder: "Example: rooibos, one glass, bottle refill",
    notesPlaceholder: "Optional. Only note what matters.",
    fields: ["water", "effect"],
  },
  Coffee: {
    heading: "Record coffee",
    instruction: "How much was it?",
    titleLabel: "Coffee note",
    titlePlaceholder: "What kind of coffee?",
    notesPlaceholder: "Optional. Only note what matters.",
    fields: ["water", "effect"],
  },
  Hygiene: {
    heading: "Record hygiene",
    instruction: "What did you do?",
    titleLabel: "Wash-up type",
    titlePlaceholder: "Example: shower, bath, face wash, brushed teeth",
    notesPlaceholder: "Did it improve your state?",
    fields: ["effect", "energy", "mood"],
  },

  Sunlight: {
    heading: "Sunlight logged.",
    instruction: "Track how long and where.",
    titleLabel: "Sunlight type",
    titlePlaceholder: "Example: sat outside, stood by window, walked in sun",
    notesPlaceholder: "How long? Did your mood or body shift?",
    fields: ["effect", "energy", "mood"],
  },

  Movement: {
    heading: "Record movement",
    instruction: "What movement did you do, and for how many minutes?",
    titleLabel: "Movement type",
    titlePlaceholder: "Example: paced house, stretched, quick walk",
    notesPlaceholder: "How long? Did it change your state?",
    fields: ["effect", "energy", "mood"],
  },

  Exercise: {
    heading: "Exercise logged.",
    instruction: "Track what you did and how it affected you.",
    titleLabel: "Exercise type",
    titlePlaceholder: "Example: weights, treadmill, home workout",
    notesPlaceholder: "Duration, intensity, body feel.",
    fields: ["effect", "energy", "intensity"],
  },

  "Treadmill walk": {
    heading: "Record a treadmill session",
    instruction: "Log time and distance. Pace gets calculated automatically.",
    titleLabel: "Treadmill note",
    titlePlaceholder: "Example: incline walk, easy pace, reading walk",
    notesPlaceholder:
      "Incline, book, energy after, anything worth remembering.",
    fields: ["treadmill", "effect", "energy", "intensity"],
  },

  "Strength training": {
    heading: "Strength work.",
    instruction:
      "List the workout, sets, reps, and weight. Volume and records will be calculated.",
    titleLabel: "Workout focus",
    titlePlaceholder: "Example: triceps, legs, full body",
    notesPlaceholder: "Body feel, soreness, form notes, anything useful.",
    fields: ["strength", "effect", "energy", "intensity"],
  },

  Reading: {
    heading: "Record reading",
    instruction: "Log what you read.",
    titleLabel: "Reading note",
    titlePlaceholder: "Example: Kindle, novel, 20 pages",
    notesPlaceholder: "Did it calm you, engage you, or sharpen your brain?",
    fields: ["effect", "mood"],
  },

  "App work": {
    heading: "Record app work",
    instruction: "Track the task.",
    titleLabel: "Task completed",
    titlePlaceholder:
      "Example: fixed form fields, added route, debugged Supabase",
    notesPlaceholder: "What shipped, what is blocked, and what is next?",
    fields: ["effect", "energy"],
  },

  "TikTok used": {
    heading: "Record a TikTok session",
    instruction: "How long did you use it, and how did you feel afterward?",
    titleLabel: "TikTok session",
    titlePlaceholder: "Example: scrolling, random feed",
    notesPlaceholder: "Did it leave you better, neutral, or emptier?",
    fields: ["effect", "intensity", "mood"],
  },

  "TikTok avoided": {
    heading: "Record what you did instead",
    instruction: "Log the win.",
    titleLabel: "Avoidance note",
    titlePlaceholder: "Example: read instead, closed app, didn’t reinstall",
    notesPlaceholder: "What did you do instead?",
    fields: ["effect", "mood"],
  },

  "Plant care": {
    heading: "Plant care logged.",
    instruction: "Track what you did.",
    titleLabel: "Plant care action",
    titlePlaceholder: "Example: changed water, checked roots, repotted Earth",
    notesPlaceholder: "Which plant? What changed?",
    fields: ["effect"],
  },

  "Recurring thought": {
    heading: "Record a recurring thought",
    instruction:
      "Name the repeated thought, rate its intensity, and write down a concrete next action if one exists.",
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
    heading: "Record a rest break",
    instruction: "Track rest so you stop treating it like missing evidence.",
    titleLabel: "Rest type",
    titlePlaceholder: "Example: nap, lay down, bath, no-phone break",
    notesPlaceholder: "How long did you rest, and how did you feel afterward?",
    fields: ["effect", "energy", "mood"],
  },
};

export function getActionConfig(actionType: string): ActionConfig {
  return (
    actionConfig[actionType] ?? {
      heading: "Log the action.",
      instruction: "Record what happened, when, and a measurable detail if available.",
      titleLabel: "Short label",
      titlePlaceholder: "What happened?",
      notesPlaceholder: "What mattered here?",
      fields: ["effect"],
    }
  );
}
