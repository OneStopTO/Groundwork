import type { Contractor } from "@prisma/client";

export const TRIAL_DAYS = 14;

export interface TierDefinition {
  id: "BASIC" | "CORE" | "PREMIUM";
  name: string;
  price: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
  ctaLabel: string;
}

export const TIERS: TierDefinition[] = [
  {
    id: "BASIC",
    name: "Basic",
    price: "$49/mo",
    tagline: "Quoting only, no frills.",
    features: [
      "Itemized material + labor quotes",
      "Manual line-item entry",
      "1 price book",
      "No visual design tool",
      "No client-facing investment proposal",
    ],
    ctaLabel: "Start with Basic",
  },
  {
    id: "CORE",
    name: "Core",
    price: "$149/mo",
    tagline: "The full workflow: design, quote, and sell the investment.",
    features: [
      "Everything in Basic",
      "Visual 2D design & layout editor",
      "Client-facing “investment in your property” proposals",
      "Property value / ROI impact framing, built in",
      "Shareable proposal links",
    ],
    highlight: true,
    ctaLabel: "Start with Core",
  },
  {
    id: "PREMIUM",
    name: "White-Glove",
    price: "$399/mo",
    tagline: "We set it up for you.",
    features: [
      "Everything in Core",
      "Done-for-you onboarding call",
      "Custom material price sheet built from your real supplier costs",
      "Priority support",
    ],
    ctaLabel: "Start with White-Glove",
  },
];

export function isTrialActive(contractor: Pick<Contractor, "trialEndsAt">) {
  return new Date(contractor.trialEndsAt).getTime() > Date.now();
}

export function trialDaysLeft(contractor: Pick<Contractor, "trialEndsAt">) {
  const ms = new Date(contractor.trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"];

/**
 * A contractor whose subscriptionStatus is still null has never gone
 * through Stripe Checkout — either billing isn't configured yet, or they
 * haven't upgraded. Once it's set, it's the source of truth: a canceled or
 * past-due subscription loses access even if selectedTier still says
 * CORE/PREMIUM from before.
 */
function hasPaidTierAccess(
  contractor: Pick<Contractor, "selectedTier" | "subscriptionStatus">
) {
  const tierAllows = contractor.selectedTier === "CORE" || contractor.selectedTier === "PREMIUM";
  if (contractor.subscriptionStatus == null) return tierAllows;
  return tierAllows && ACTIVE_SUBSCRIPTION_STATUSES.includes(contractor.subscriptionStatus);
}

/** Design tool + client proposals are Core/Premium features, but the trial unlocks everything. */
export function hasDesignAccess(
  contractor: Pick<Contractor, "trialEndsAt" | "selectedTier" | "subscriptionStatus">
) {
  if (isTrialActive(contractor)) return true;
  return hasPaidTierAccess(contractor);
}

export function effectiveTierLabel(
  contractor: Pick<Contractor, "trialEndsAt" | "selectedTier" | "subscriptionStatus">
) {
  if (isTrialActive(contractor)) {
    return `Free trial (full access) — ${trialDaysLeft(contractor)} day${
      trialDaysLeft(contractor) === 1 ? "" : "s"
    } left`;
  }
  const tier = TIERS.find((t) => t.id === contractor.selectedTier);
  const name = tier ? tier.name : contractor.selectedTier;
  if (contractor.subscriptionStatus && !ACTIVE_SUBSCRIPTION_STATUSES.includes(contractor.subscriptionStatus)) {
    return `${name} (${contractor.subscriptionStatus})`;
  }
  return name;
}
