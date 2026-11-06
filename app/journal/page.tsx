import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../lib/supabase-server";
import { dayInTimeZone } from "../lib/local-day";
import { safeMonth } from "../lib/thought-garden";
import { VaultDesk } from "./VaultDesk";

export const dynamic = "force-dynamic";

export default async function JournalPage({ searchParams }: {
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const zone = (await cookies()).get("hoolayah_timezone")?.value;
  const today = dayInTimeZone(zone);
  const query = await searchParams;
  const month = safeMonth(typeof query.month === "string" ? query.month : undefined, today.slice(0, 7));
  // Never fetch plaintext reflections in a server component.
  // Only the user's browser requests ciphertext via RLS and decrypts it in memory.
  return <VaultDesk today={today} initialMonth={month} />;
}
