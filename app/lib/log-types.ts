export type DailyLog = {
  id: number;
  log_type: string;
  title: string | null;
  notes: string | null;
  effect: string | null;
  action_date: string | null;
  action_time: string | null;
  mood_score: number | null;
  energy_score: number | null;
  intensity_score: number | null;
  meal_size: string | null;
  meal_source: string | null;
  water_amount_ml: number | null;
  occurred_at: string;
  treadmill_duration_minutes: number | null;
  treadmill_distance_km: number | null;
  treadmill_pace_min_per_km: number | null;
  workout_name: string | null;
  wash_up: string | null;
};
export const actionTypes = [
  "First meal",
  "Job application",
  "Woke up",
  "Cook",
  "Wash Dishes",
  "Clean",
  "Meal",
  "Updated Resume",
  "Applied to Job",
  "Dessert eaten",
  "Dessert craving",
  "Water",
  "Coffee",
  "Wash Up",
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
  "Family system",
] as const;
export type InsightLog = {
  id: number;
  log_type: string;
  title: string | null;
  notes: string | null;
  effect: string | null;
  action_date: string | null;
  action_time: string | null;
  mood_score: number | null;
  energy_score: number | null;
  intensity_score: number | null;
  meal_size: string | null;
  meal_source: string | null;
  occurred_at: string;
  water_amount_ml: number | null;
  treadmill_duration_minutes: number | null;
  treadmill_distance_km: number | null;
  treadmill_pace_min_per_km: number | null;
  workout_name: string | null;
};
export const effects = [
  "restorative",
  "helpful",
  "neutral",
  "unhelpful",
  "harmful",
  "detrimental",
] as const;
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
