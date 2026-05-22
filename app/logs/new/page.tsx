import { redirect } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { actionTypes } from "../../lib/log-types";
import { NewActionForm } from "./components/NewActionForm";

type NewLogPageProps = {
  searchParams?: Promise<{
    type?: string;
  }>;
};

async function createLog(formData: FormData) {
  "use server";

  const logType = String(formData.get("log_type") || "");
  const title = String(formData.get("title") || "");
  const notes = String(formData.get("notes") || "");
  const actionDate = String(formData.get("action_date") || "");
  const actionTime = String(formData.get("action_time") || "");
  const effect = String(formData.get("effect") || "");
  const mealSize = String(formData.get("meal_size") || "");
  const mealSource = String(formData.get("meal_source") || "");
  const moodScore = formData.get("mood_score");
  const energyScore = formData.get("energy_score");
  const intensityScore = formData.get("intensity_score");
  const waterAmountMl = formData.get("water_amount_ml");
  const treadmillDurationMinutes = formData.get("treadmill_duration_minutes");
  const treadmillDistanceKm = formData.get("treadmill_distance_km");
  const workoutName = String(formData.get("workout_name") || "");

  const exerciseNames = formData.getAll("exercise_name").map(String);
  const repsList = formData.getAll("reps").map(String);
  const weightKgList = formData.getAll("weight_kg").map(String);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: insertedLog, error } = await supabase
    .from("logs")
    .insert({
      user_id: user.id,

      log_type: logType,
      title: title || null,
      notes: notes || null,
      action_date: actionDate || new Date().toISOString().slice(0, 10),
      action_time: actionTime || null,
      category: logType,
      effect: effect || null,
      meal_size: mealSize || null,
      meal_source: mealSource || null,
      water_amount_ml: waterAmountMl ? Number(waterAmountMl) : null,
      treadmill_duration_minutes: treadmillDurationMinutes
        ? Number(treadmillDurationMinutes)
        : null,
      treadmill_distance_km: treadmillDistanceKm
        ? Number(treadmillDistanceKm)
        : null,
      workout_name: workoutName || null,
      mood_score: moodScore ? Number(moodScore) : null,
      energy_score: energyScore ? Number(energyScore) : null,
      intensity_score: intensityScore ? Number(intensityScore) : null,
    })
    .select("id")
    .eq("user_id", user.id)

    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (logType === "Strength training" && insertedLog) {
    const strengthSets = exerciseNames
      .map((exerciseName, index) => ({
        user_id: user.id,
        log_id: insertedLog.id,
        exercise_name: exerciseName.trim(),
        set_number: index + 1,
        reps: Number(repsList[index]),
        weight_kg: Number(weightKgList[index]),
      }))
      .filter(
        (set) =>
          set.exercise_name &&
          Number.isFinite(set.reps) &&
          set.reps > 0 &&
          Number.isFinite(set.weight_kg) &&
          set.weight_kg >= 0,
      );

    if (strengthSets.length) {
      const { error: strengthError } = await supabase
        .from("strength_sets")
        .insert(strengthSets);

      if (strengthError) {
        throw new Error(strengthError.message);
      }
    }
  }

  redirect("/logs");
}

export default async function NewLogPage({ searchParams }: NewLogPageProps) {
  const params = await searchParams;
  const requestedType = params?.type;

  type ActionType = (typeof actionTypes)[number];

  const selectedType: ActionType = actionTypes.includes(
    requestedType as ActionType,
  )
    ? (requestedType as ActionType)
    : actionTypes[0];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen px-6 py-10 text-black-950">
      <section className="mx-auto max-w-3xl">
        <p className="text-md font-medium uppercase tracking-[0.25em] text-green-700">
          New action
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          Log the thing. Then move.
        </h1>

        <p className="mt-4 text-black-700">
          Pick the action. The form will stop showing irrelevant nonsense.
        </p>

        <NewActionForm
          selectedType={selectedType}
          today={today}
          createLog={createLog}
        />
      </section>
    </main>
  );
}
