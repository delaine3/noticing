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

  const { error } = await supabase.from("logs").insert({
    log_type: logType,
    title: title || null,
    notes: notes || null,
    action_date: actionDate || new Date().toISOString().slice(0, 10),
    action_time: actionTime || null,
    category: logType,
    effect: effect || null,
    meal_size: mealSize || null,
    water_amount_ml: waterAmountMl ? Number(waterAmountMl) : null,
    meal_source: mealSource || null,
    mood_score: moodScore ? Number(moodScore) : null,
    energy_score: energyScore ? Number(energyScore) : null,
    intensity_score: intensityScore ? Number(intensityScore) : null,
  });

  if (error) {
    throw new Error(error.message);
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
    <main className="min-h-screen app-bg px-6 py-10 text-stone-950">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-green-700">
          New action
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          Log the thing. Then move.
        </h1>

        <p className="mt-4 text-stone-700">
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
