import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../lib/supabase-server";
import { freeCloudConfigured } from "../../lib/free-cloud";
import { SettingsForm, type CoachingSettings } from "./SettingsForm";

export default async function CoachingSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.from("coaching_preferences")
    .select("fluid_goal_ml,fluid_restricted,all_drinks_logged,allow_checkin_invites,cloud_enabled")
    .eq("user_id", user.id).maybeSingle();
  const settings: CoachingSettings = data ? {
    fluid_goal_ml: data.fluid_goal_ml ?? 1800,
    fluid_restricted: data.fluid_restricted ?? null,
    all_drinks_logged: data.all_drinks_logged ?? false,
    allow_checkin_invites: data.allow_checkin_invites ?? true,
    cloud_enabled: data.cloud_enabled ?? false,
  } : {
    fluid_goal_ml: 1800,
    fluid_restricted: null,
    all_drinks_logged: false,
    allow_checkin_invites: true,
    cloud_enabled: false,
  };
  const cloudConfigured = freeCloudConfigured({
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_WORKERS_AI_TOKEN: process.env.CLOUDFLARE_WORKERS_AI_TOKEN,
    CLOUDFLARE_FREE_PLAN_CONFIRMED: process.env.CLOUDFLARE_FREE_PLAN_CONFIRMED,
  });

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--leaf-dark)]">Noticing · Coaching</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">Your preferences</h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Set what matters, how often Noticing offers check-ins, and what information can leave your device.
        </p>
        <div className="mt-4">
          <Link href="/check-in" className="secondary-button">Back to check-in</Link>
        </div>
        {(error?.code === "42P01" || error?.code === "PGRST205") ? (
          <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm">
            The coaching migration needs to be applied in Supabase before preferences can be saved.
          </p>
        ) : null}
        <SettingsForm settings={settings} cloudConfigured={cloudConfigured}/>
      </div>
    </main>
  );
}
