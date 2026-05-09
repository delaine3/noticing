import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/logs", label: "Logs" },
  { href: "/logs/new", label: "New Log" },
  { href: "/insights", label: "Insights" },
];

export function AppNav() {
  return (
    <header className="border-b border-stone-200 bg-stone-50/90 px-6 py-4 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-stone-950"
        >
          Noticing
        </Link>

        <div className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-950"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
