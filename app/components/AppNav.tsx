"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Today" },
  { href: "/dashboard", label: "Stats" },
  { href: "/logs", label: "Logs" },
  { href: "/insights", label: "Insights" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-soft)] bg-[rgba(255,250,243,0.82)] backdrop-blur-xl">
      <nav className="flex w-full items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border-soft)] bg-[var(--mint)] text-base">
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

        <div className="flex items-center gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-[var(--mint)] text-[var(--leaf-dark)]"
                    : "text-[var(--ink-soft)] hover:bg-[var(--blush)] hover:text-[var(--ink)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/logs/new"
            className="whitespace-nowrap rounded-md bg-[var(--leaf)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--leaf-dark)]"
          >
            New log
          </Link>
        </div>
      </nav>
    </header>
  );
}
