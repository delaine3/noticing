import { redirect, notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { EditLogForm } from "./EditLogForm";
import { createSupabaseServerClient } from "@/app/lib/supabase-server";

type EditLogPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export type EditableLog = {
  id: number;
  log_type: string;
  title: string | null;
  notes: string | null;
  action_date: string | null;
  action_time: string | null;
  effect: string | null;
  meal_size: string | null;
  meal_source: string | null;
  water_amount_ml: number | null;
  washup_types: string[] | null;
  treadmill_duration_minutes: number | null;
  treadmill_distance_km: number | null;
  workout_name: string | null;
  mood_score: number | null;
  energy_score: number | null;
  intensity_score: number | null;
};

async function updateLog(formData: FormData) {
  "use server";
  const supabase = await createSupabaseServerClient();

  const id = Number(formData.get("id"));
  const logType = String(formData.get("log_type") || "");
  const title = String(formData.get("title") || "");
  const notes = String(formData.get("notes") || "");
  const actionDate = String(formData.get("action_date") || "");
  const actionTime = String(formData.get("action_time") || "");
  const effect = String(formData.get("effect") || "");
  const mealSize = String(formData.get("meal_size") || "");
  const mealSource = String(formData.get("meal_source") || "");
  const waterAmountMl = formData.get("water_amount_ml");
  const washupTypes = formData.getAll("washup_types").map(String);
  const treadmillDurationMinutes = formData.get("treadmill_duration_minutes");
  const treadmillDistanceKm = formData.get("treadmill_distance_km");
  const workoutName = String(formData.get("workout_name") || "");
  const moodScore = formData.get("mood_score");
  const energyScore = formData.get("energy_score");
  const intensityScore = formData.get("intensity_score");

  if (!Number.isFinite(id)) {
    throw new Error("Invalid log id");
  }

  const { error } = await supabase
    .from("logs")
    .update({
      log_type: logType,
      category: logType,
      title: title || null,
      notes: notes || null,
      action_date: actionDate || null,
      action_time: actionTime || null,
      effect: effect || null,
      meal_size: mealSize || null,
      meal_source: mealSource || null,
      water_amount_ml: waterAmountMl ? Number(waterAmountMl) : null,
      washup_types: washupTypes.length ? washupTypes : [],
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
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/logs");
}

export default async function EditLogPage({ params }: EditLogPageProps) {
  const { id } = await params;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: log, error } = await supabase
    .from("logs")
    .select("*")
    .eq("id", user.id)

    .eq("id", Number(id))
    .single();

  if (error || !log) {
    notFound();
  }

  return <EditLogForm editableLog={log as EditableLog} updateLog={updateLog} />;
}
