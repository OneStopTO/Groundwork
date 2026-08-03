import Stripe from "stripe";
import type { PricingTier } from "@prisma/client";

/**
 * Returns null when Stripe isn't configured (no STRIPE_SECRET_KEY set),
 * rather than throwing — callers fall back to label-only tier tracking
 * (the pre-billing behavior) so the app keeps working before a Stripe
 * account is wired up. See .env for the full setup checklist.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export const STRIPE_PRICE_IDS: Record<PricingTier, string | undefined> = {
  BASIC: process.env.STRIPE_PRICE_BASIC,
  CORE: process.env.STRIPE_PRICE_CORE,
  PREMIUM: process.env.STRIPE_PRICE_PREMIUM,
};
