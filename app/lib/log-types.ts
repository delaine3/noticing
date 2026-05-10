export const actionTypes = [
  "Woke up",
  "First meal",
  "Meal",
  "Dessert eaten",
  "Dessert craving",
  "Water",
  "Shower",
  "Sunlight",
  "Movement",
  "Exercise",
  "Treadmill walk",
  "Strength training",
  "Reading",
  "App work",
  "TikTok used",
  "TikTok avoided",
  "Plant care",
  "Recurring thought",
  "Social interaction",
  "Rest",
] as const;

export const effects = ["helpful", "neutral", "harmful"] as const;

export const mealSizes = ["small", "medium", "large"] as const;

export const mealSources = [
  "cooked",
  "leftovers",
  "takeaway",
  "snack",
  "assembled",
  "other",
] as const;

export type ActionType = (typeof actionTypes)[number];
export type Effect = (typeof effects)[number];
export type MealSize = (typeof mealSizes)[number];
export type MealSource = (typeof mealSources)[number];
