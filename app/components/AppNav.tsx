"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LoadingLink from "./LoadingLink";
import { useEffect, useState } from "react";
import ProfileDropdown from "./ProfileDropdown";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const navItems = [
  { href: "/", label: "Today" },
  { href: "/logs", label: "Logs" },
  { href: "/insights", label: "Insights" },
];
type UserProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};
export function AppNav() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const displayName = profile?.username ?? profile?.full_name ?? userEmail;
  const initial = displayName?.charAt(0).toUpperCase() ?? "?";
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }
  async function getUserAndProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUserEmail(user?.email ?? null);

    if (!user) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .eq("id", user.id)
      .eq("id", user.id)
      .single();

    if (error) {
      console.error(error.message);
      setProfile(null);
      return;
    }

    setProfile(data);
  }

  useEffect(() => {
    getUserAndProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getUserAndProfile();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);
  return (
    <header className="app-bg sticky top-0 z-40 h-16 border-b border-[rgba(36,81,61,0.14)] backdrop-blur-xl">
      <nav className="flex h-full w-full items-stretch justify-between">
        <Link
          href="/"
          className="flex h-full items-center gap-2 px-4 transition hover:bg-white/30 sm:px-6"
        >
          <span className="flex h-8 w-8 items-center justify-center  border border-[rgba(36,81,61,0.16)] bg-[rgba(255,250,243,0.55)] text-base">
            🌿
          </span>

          <div className="leading-tight">
            <span className="block text-base font-semibold tracking-tight text-[var(--ink)]">
              Noticing
            </span>
            <span className="block text-xs font-medium text-[var(--ink-soft)]">
              run the day
            </span>
          </div>
        </Link>
        {userEmail ? (
          <div className="flex h-full items-stretch border-l border-[rgba(36,81,61,0.14)]">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex h-full items-center border-r border-[rgba(36,81,61,0.14)] px-4 text-md font-medium transition sm:px-5 ${
                    isActive
                      ? "bg-white/40 text-[var(--leaf-dark)]"
                      : "text-[var(--ink-soft)] hover:bg-white/35 hover:text-[var(--ink)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/logs/new"
              className="flex h-full items-center bg-[rgba(63,127,99,0.88)] px-4 text-md font-semibold text-white transition hover:bg-[rgba(36,81,61,0.94)] sm:px-5"
            >
              New log
            </Link>{" "}
            <ProfileDropdown
              displayName={displayName}
              userEmail={userEmail}
              avatarUrl={profile?.avatar_url ?? null}
              initial={initial}
              onLogout={handleLogout}
              showMobileLinks
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <LoadingLink href="/login" className="text-sm text-white">
              Login
            </LoadingLink>

            <LoadingLink
              href="/signup"
              className="rounded bg-white px-3 py-2 text-sm font-semibold text-[#455411]"
            >
              Sign up
            </LoadingLink>
          </div>
        )}
      </nav>
    </header>
  );
}
