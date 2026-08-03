import Link from "next/link";
import type { Contractor } from "@prisma/client";
import { effectiveTierLabel, isTrialActive } from "@/lib/tiers";
import { PostHogIdentify } from "./PostHogIdentify";
import { LogoutButton } from "./LogoutButton";

const NAV_LINKS = [
  { href: "/dashboard", label: "Jobs" },
  { href: "/pricing", label: "Plan" },
  { href: "/settings", label: "Settings" },
];

export function TopNav({ contractor }: { contractor: Contractor }) {
  return (
    <header className="border-b" style={{ borderColor: "var(--stone-border)" }}>
      <PostHogIdentify contractorId={contractor.id} email={contractor.email} />
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-display text-lg">
            GroundWork
          </Link>
          <nav
            className="hidden sm:flex items-center gap-4 text-sm"
            style={{ color: "var(--ink-muted)" }}
          >
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-current">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              isTrialActive(contractor)
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
            }`}
          >
            {effectiveTierLabel(contractor)}
          </span>
          <LogoutButton />
        </div>
      </div>
      {/* Mobile: the row above hides the nav links to save space, so repeat
          them here — otherwise Settings/Plan become unreachable on phones. */}
      <nav
        className="flex sm:hidden items-center gap-5 px-6 pb-3 text-sm border-t"
        style={{ color: "var(--ink-muted)", borderColor: "var(--stone-border)" }}
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="min-h-[44px] flex items-center hover:text-current"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
