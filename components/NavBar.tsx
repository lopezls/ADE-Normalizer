"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Patient Encounter" },
  { href: "/data", label: "Data" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-7xl items-center gap-1 rounded-2xl bg-white px-5 py-2 dark:bg-zinc-900">
      <span className="mr-6 text-sm font-semibold">Rx Call Aide</span>
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              active
                ? "bg-lime-100 text-zinc-900 dark:bg-zinc-800 dark:text-lime-200"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
