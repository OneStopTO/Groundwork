import Link from "next/link";
import { getCurrentContractor } from "@/lib/session";
import { TopNav } from "@/components/TopNav";
import { TIERS, isTrialActive, trialDaysLeft } from "@/lib/tiers";
import { startCheckoutAction } from "@/lib/actions";

const FAQ = [
  {
    q: "Do I need a credit card to start the trial?",
    a: "No. The 14-day trial unlocks every feature, including the design tool and client proposals, with no card on file.",
  },
  {
    q: "What happens when my trial ends?",
    a: "You'll be asked to pick a plan to keep going. Nothing is deleted — your jobs, designs, and price book are waiting whichever plan you land on.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes, anytime from this page. Downgrading from Core or White-Glove disables the design tool and client proposals but keeps your data intact.",
  },
];

export default async function PricingPage() {
  const contractor = await getCurrentContractor();

  return (
    <>
      {contractor && <TopNav contractor={contractor} />}
      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-12">
        <p className="font-mono text-xs tracking-[0.18em] uppercase text-emerald-700 dark:text-emerald-400 mb-3">
          Plans
        </p>
        <h1 className="font-display text-3xl mb-2">Pick the plan that fits</h1>
        <p className="mb-10" style={{ color: "var(--ink-muted)" }}>
          {contractor
            ? isTrialActive(contractor)
              ? `You're on a free trial with full access — ${trialDaysLeft(
                  contractor
                )} day(s) left. Pick the plan you'll move to after the trial; you won't be charged now.`
              : "Change your plan anytime."
            : "Start on a 14-day free trial with full access to every feature, then choose the plan that fits."}
        </p>

        <div className="grid sm:grid-cols-3 gap-6 mb-16">
          {TIERS.map((tier) => {
            const isCurrent = contractor?.selectedTier === tier.id;
            return (
              <div
                key={tier.id}
                className={`rounded-xl border p-7 flex flex-col ${
                  tier.highlight ? "shadow-lg shadow-black/5 sm:scale-[1.02]" : ""
                }`}
                style={{
                  borderColor: tier.highlight ? "var(--foreground)" : "var(--stone-border)",
                  borderWidth: tier.highlight ? 1.5 : 1,
                  background: "var(--background-raised)",
                }}
              >
                {tier.highlight && (
                  <span className="font-mono text-[11px] font-semibold tracking-wide text-amber-800 dark:text-amber-300 mb-2">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="font-display text-xl">{tier.name}</h3>
                <p className="font-mono text-2xl mt-2 mb-1">{tier.price}</p>
                <p className="text-sm mb-5" style={{ color: "var(--ink-muted)" }}>
                  {tier.tagline}
                </p>
                <ul className="text-sm space-y-2.5 flex-1 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {contractor ? (
                  isCurrent ? (
                    <span
                      className="text-center text-sm font-medium py-2.5 rounded-md"
                      style={{ background: "var(--stone-border)" }}
                    >
                      Current selection
                    </span>
                  ) : (
                    <form action={startCheckoutAction}>
                      <input type="hidden" name="tier" value={tier.id} />
                      <button
                        type="submit"
                        className="w-full rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ borderColor: "var(--stone-border)" }}
                      >
                        {tier.ctaLabel}
                      </button>
                    </form>
                  )
                ) : (
                  <Link
                    href="/signup"
                    className="text-center rounded-md bg-emerald-700 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-800"
                  >
                    {tier.ctaLabel}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div className="max-w-2xl">
          <h2 className="font-display text-xl mb-5">Questions</h2>
          <div className="space-y-5">
            {FAQ.map((item) => (
              <div key={item.q}>
                <p className="font-medium text-sm mb-1">{item.q}</p>
                <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
