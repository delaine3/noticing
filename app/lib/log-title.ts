/**
 * Derive a useful factual label from structured fields. Do not invent the
 * activity's content or infer that a person actually slept just because
 * they reported getting into bed.
 */
export type LogTitleFields = {
  log_type: string;
  title?: string | null;
  action_time?: string | null;
  water_amount_ml?: number | null;
  treadmill_distance_km?: number | null;
  workout_name?: string | null;
  notes?: string | null;
};

function clock(time?: string | null) {
  return time && /^\d{2}:\d{2}/.test(time) ? " at " + time.slice(0, 5) : "";
}

export function getLogDisplayTitle(log: LogTitleFields): string {
  const existing = log.title?.trim();
  if (existing) return existing;
  const time = clock(log.action_time);
  switch (log.log_type) {
    case "Bedtime": return "Getting ready for bed" + time;
    case "Woke up": return "Woke up" + time;
    case "Sleep": return "Sleep recorded" + time;
    case "Coffee": return (log.water_amount_ml != null ? "Coffee · " + log.water_amount_ml + " ml" : "Had coffee") + time;
    case "Water": return (log.water_amount_ml != null ? "Drank " + log.water_amount_ml + " ml" : "Drank water") + time;
    case "Meal": return "Had a meal" + time;
    case "First meal": return "First meal" + time;
    case "Treadmill walk": return "Treadmill walk" + (log.treadmill_distance_km != null ? " · " + log.treadmill_distance_km + " km" : "") + time;
    case "Strength training": return log.workout_name?.trim() || "Strength training" + time;
    case "Daily check-in": return "Daily check-in" + time;
    case "Plant care": return "Cared for plants" + time;
    case "Job application": case "Applied to Job": return "Job application recorded";
    case "Focused work": return "Work session" + time;
    default: return log.log_type.trim() ? log.log_type + time : "Activity recorded" + time;
  }
}
