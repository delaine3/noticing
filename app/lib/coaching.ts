/**
 * Factual, deterministic coaching. Language models may interpret text,
 * but must not invent health targets, diagnoses or clinical interventions.
 */
export type ThoughtTopic =
  "work" | "worries" | "planning" | "relationships" |
  "enjoyment" | "everyday" | "other" | "prefer_not_to_say";

export type CheckInValues = {
  energy: number;
  mood: number;
  stress: number;
  thought_topic: ThoughtTopic;
  thought_detail?: string | null;
  recently_ate: boolean | null;
  thirsty: boolean | null;
  physical_discomfort: boolean | null;
  overwhelmed: boolean | null;
  thought_actionable: boolean | null;
  rested: boolean | null;
};

export type QuestionKey = "recently_ate" | "thirsty" | "physical_discomfort" |
  "overwhelmed" | "thought_actionable" | "rested";

export type AdaptiveQuestion = { key: QuestionKey; prompt: string; reason: string };

const questions: Record<QuestionKey, AdaptiveQuestion> = {
  recently_ate: {
    key: "recently_ate",
    prompt: "Have you eaten in the last few hours?",
    reason: "Food timing may matter when your energy is low.",
  },
  thirsty: {
    key: "thirsty",
    prompt: "Are you feeling thirsty?",
    reason: "Thirst can help you decide whether to have a drink.",
  },
  physical_discomfort: {
    key: "physical_discomfort",
    prompt: "Any physical discomfort right now?",
    reason: "Physical symptoms can matter more than an ordinary productivity suggestion.",
  },
  overwhelmed: {
    key: "overwhelmed",
    prompt: "Does everything feel like too much right now?",
    reason: "A smaller next step may be more useful during overwhelm.",
  },
  thought_actionable: {
    key: "thought_actionable",
    prompt: "Is there one thing you can do about what's on your mind?",
    reason: "This distinguishes a practical next step from repetitive thinking.",
  },
  rested: {
    key: "rested",
    prompt: "Did you wake up feeling rested?",
    reason: "Poor rest may explain why a demanding task feels difficult.",
  },
};

export function getAdaptiveQuestions(values: CheckInValues): AdaptiveQuestion[] {
  const order: QuestionKey[] = [];
  if (values.energy <= 2) order.push("recently_ate", "rested", "thirsty", "physical_discomfort");
  if (values.stress >= 4 || values.thought_topic === "worries")
    order.push("thought_actionable", "overwhelmed");
  if (values.mood <= 2) order.push("overwhelmed", "physical_discomfort");
  const keys = [...new Set(order)].filter((key) => values[key] === null);
  return keys.slice(0, 3).map((key) => questions[key]);
}

export type CoachingActionCode =
  "eat" | "drink" | "rest" | "pause" | "small_task" | "movement" | "reflect" | "maintain";

export type CoachingRecommendation = {
  code: CoachingActionCode;
  title: string;
  benefit: string;
  next: string;
};

export function recommendNextAction(
  v: CheckInValues,
  context: { fluidRestricted?: boolean | null } = {},
): CoachingRecommendation {
  if (v.physical_discomfort === true && v.energy <= 2) {
    return {
      code: "rest",
      title: "Give your body a break",
      benefit: "Taking a break from effort is sensible when you're uncomfortable. If symptoms are severe, new, or worsening, seek medical advice rather than relying on an app.",
      next: "Sit somewhere comfortable and reassess how you feel.",
    };
  }
  if (v.thirsty === true && context.fluidRestricted === true) {
    return {
      code: "reflect", title: "Follow your fluid plan",
      benefit: "If a clinician has limited your fluids, follow that plan even if your general intake goal differs.",
      next: "Check the guidance you were given about thirst and your fluid allowance.",
    };
  }
  if (v.thirsty === true) {
    return {
      code: "drink", title: "Have some water",
      benefit: "Water supports normal temperature regulation and circulation. Your thirst is a useful cue.",
      next: "Have a glass of water if you have no medical fluid restriction.",
    };
  }
  if (v.energy <= 2 && v.recently_ate === false) {
    return {
      code: "eat", title: "Eat something first",
      benefit: "When you've gone several hours without eating, food may help with low energy and concentration.",
      next: "Have a meal or snack, then decide which task matters most.",
    };
  }
  if (v.stress >= 4 && v.thought_actionable === true) {
    return {
      code: "small_task", title: "Make one problem smaller",
      benefit: "A limited, concrete next step is often easier to tackle than an entire stressful situation.",
      next: "Pick a single action you can finish in 10–20 minutes.",
    };
  }
  if (v.stress >= 4 || v.overwhelmed === true) {
    return {
      code: "pause", title: "Give yourself a short pause",
      benefit: "Brief breaks can interrupt sustained cognitive effort and help you return more deliberately.",
      next: "Step away for five minutes. Then decide whether to continue or change tasks.",
    };
  }
  if (v.energy <= 2 && v.rested === false) {
    return {
      code: "rest", title: "Plan some rest",
      benefit: "Sleep supports attention, emotional regulation and physical recovery.",
      next: "Reduce non-urgent demands and protect time for sleep tonight.",
    };
  }
  if (v.energy >= 4 && v.mood >= 3 && v.stress <= 2) {
    return {
      code: "maintain", title: "Make use of the energy you have",
      benefit: "Recording what helped today can help you repeat a routine you find worthwhile.",
      next: "Do one meaningful activity, or enjoy the time without adding tasks.",
    };
  }
  return {
    code: "reflect", title: "Pick the next useful thing",
    benefit: "One realistic action is easier to evaluate than trying to change several things at once.",
    next: "What would make the next hour a little better?",
  };
}

export function validateCheckIn(value: unknown): value is CheckInValues {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  if (!["energy", "mood", "stress"].every((key) =>
    typeof v[key] === "number" && Number.isInteger(v[key]) && (v[key] as number) >= 1 && (v[key] as number) <= 5)) return false;
  if (!["work", "worries", "planning", "relationships", "enjoyment", "everyday", "other", "prefer_not_to_say"].includes(String(v.thought_topic))) return false;
  if (v.thought_detail !== null && v.thought_detail !== undefined &&
      (typeof v.thought_detail !== "string" || v.thought_detail.length > 600)) return false;
  return (["recently_ate", "thirsty", "physical_discomfort", "overwhelmed", "thought_actionable", "rested"] as const)
    .every((key) => v[key] === null || v[key] === true || v[key] === false);
}

export type HydrationAssessment = {
  loggedMl: number; goalMl: number; fraction: number;
  headline: string; guidance: string; caution: string;
};

export function assessHydration(
  loggedMl: number, goalMl = 1800, hour = 12,
  fluidRestricted: boolean | null = null,
  allDrinksLogged = false,
): HydrationAssessment {
  const total = Math.max(0, Math.round(Number.isFinite(loggedMl) ? loggedMl : 0));
  const goal = Number.isFinite(goalMl) && goalMl >= 1200 && goalMl <= 4000 ? goalMl : 1800;
  const fraction = Math.min(1, total / goal);
  let guidance: string;
  if (fluidRestricted === true) {
    guidance = "Follow the fluid limit set by your clinician. Noticing won't suggest extra drinks.";
  } else if (total >= goal) {
    guidance = "You've reached your daily drink goal. Continue to use thirst and your circumstances as guides.";
  } else if (hour < 11) {
    guidance = "Start the day with a drink and keep fluids available as you go.";
  } else if (hour >= 17 && total < goal * 0.65) {
    guidance = allDrinksLogged
      ? "Your fluid intake is below your daily goal this evening. Have a glass of water if you can drink normally, then sip as needed."
      : "If this is most of what you've drunk, more water would be sensible this evening. Start with a glass, not a large catch-up amount.";
  } else if (total < goal * 0.45 && hour >= 12) {
    guidance = "Have a drink now if you're able to, and keep water nearby this afternoon.";
  } else {
    guidance = "Keep drinking regularly. Extra fluid may be useful during heat, illness or extended exercise.";
  }
  return {
    loggedMl: total, goalMl: goal, fraction,
    headline: total.toLocaleString("en-US") + " ml",
    guidance,
    caution: fluidRestricted === null
      ? "Targets are general guides. Set yours for your circumstances, especially if you have a medical fluid restriction."
      : "",
  };
}
