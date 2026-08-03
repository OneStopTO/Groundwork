import Link from "next/link";
import { getCurrentContractor } from "@/lib/session";
import { TopNav } from "@/components/TopNav";
import { TIERS, isTrialActive, trialDaysLeft } from "@/lib/tiers";
import { selectTierAction } from "@/lib/actions";

export default async function PricingPage() {
  const contractor = await getCurrentContractor();

  return (
    <>
      {contractor && <TopNav contractor={contractor} />}
      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-12">
        <h1 className="text-2xl font-semibold mb-2">Plans</h1>
        <p className="text-black/60 dark:text-white/60 mb-8">
          {contractor
            ? isTrialActive(contractor)
              ? `You're on a free trial with full access — ${trialDaysLeft(
                  contractor
                )} day(s) left. Pick the plan you'll move to after the trial; you won't be charged now.`
              : "Change your plan anytime."
            : "Start on a 14-day free trial with full access to every feature, then choose the plan that fits."}
        </p>

        <div className="grid sm:grid-cols-3 gap-6">
          {TIERS.map((tier) => {
            const isCurrent = contractor?.selectedTier === tier.id;
            return (
              <div
                key={tier.id}
                className={`rounded-xl border p-6 flex flex-col ${
                  tier.highlight
                    ? "border-emerald-600 shadow-lg shadow-emerald-900/5"
                    : "border-black/10 dark:border-white/10"
                }`}
              >
                {tier.highlight && (
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-xl font-semibold">{tier.name}</h3>
                <p className="text-2xl font-bold mt-1 mb-1">{tier.price}</p>
                <p className="text-sm text-black/60 dark:text-white/60 mb-4">
                  {tier.tagline}
                </p>
                <ul className="text-sm space-y-2 flex-1 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {contractor ? (
                  isCurrent ? (
                    <span className="text-center text-sm font-medium py-2.5 rounded-md bg-black/5 dark:bg-white/10">
                      Current selection
                    </span>
                  ) : (
                    <form action={selectTierAction}>
                      <input type="hidden" name="tier" value={tier.id} />
                      <button
                        type="submit"
                        className="w-full rounded-md border border-black/15 dark:border-white/20 px-4 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
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
      </main>
    </>
  );
}
