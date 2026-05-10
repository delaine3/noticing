"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Today" },
  { href: "/logs", label: "Logs" },
  { href: "/insights", label: "Insights" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[rgba(36,81,61,0.14)] bg-[linear-gradient(90deg,_#ffa9b7_0%,_#fffaf3_45%,_#e4faef_75%,_#d1f7f2_100%)] backdrop-blur-xl">
      <nav className="flex h-full w-full items-stretch justify-between">
        <Link
          href="/"
          className="flex h-full items-center gap-2 px-4 transition hover:bg-white/30 sm:px-6"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded border border-[rgba(36,81,61,0.16)] bg-[rgba(255,250,243,0.55)] text-base">
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

        <div className="flex h-full items-stretch overflow-x-auto border-l border-[rgba(36,81,61,0.14)]">
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
          </Link>
        </div>
      </nav>
    </header>
  );
}
