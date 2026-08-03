import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { PricingTier } from "@prisma/client";

const VALID_TIERS = ["BASIC", "CORE", "PREMIUM"];

/**
 * Stripe calls this on checkout completion and every subscription change.
 * Configure it in the Stripe Dashboard: Developers > Webhooks > Add
 * endpoint, URL <your domain>/api/stripe/webhook, events
 * checkout.session.completed, customer.subscription.updated,
 * customer.subscription.deleted — then set STRIPE_WEBHOOK_SECRET to the
 * endpoint's signing secret.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe is not configured on this deployment." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Missing stripe-signature header");
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const contractorId = session.metadata?.contractorId;
      const tier = session.metadata?.tier;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (contractorId && subscriptionId) {
        await prisma.contractor.update({
          where: { id: contractorId },
          data: {
            stripeSubscriptionId: subscriptionId,
            selectedTier: VALID_TIERS.includes(tier ?? "") ? (tier as PricingTier) : undefined,
            subscriptionStatus: "active",
          },
        });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const contractorId = subscription.metadata?.contractorId;
      const contractor = contractorId
        ? await prisma.contractor.findUnique({ where: { id: contractorId } })
        : await prisma.contractor.findUnique({ where: { stripeSubscriptionId: subscription.id } });
      if (contractor) {
        await prisma.contractor.update({
          where: { id: contractor.id },
          data: { subscriptionStatus: subscription.status },
        });
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
