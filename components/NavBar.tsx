"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Encounter Form" },
  { href: "/data", label: "Data" },
  { href: "/recommendation", label: "Recommendation" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-4xl items-center gap-1 px-4">
        <span className="mr-4 py-3 text-sm font-semibold text-teal-700 dark:text-teal-400">
          Rx Call Aide
        </span>
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`border-b-2 px-3 py-3 text-sm font-medium ${
                active
                  ? "border-teal-600 text-teal-700 dark:text-teal-400"
                  : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
