"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "./prisma";
import { getSession, requireContractor } from "./session";
import { TRIAL_DAYS, isTrialActive } from "./tiers";
import { DEFAULT_PRICE_BOOK } from "./pricing";
import { savePhoto } from "./storage";
import { captureServerEvent } from "./posthog-server";
import { getStripe, STRIPE_PRICE_IDS } from "./stripe";
import type { ProjectType, PricingTier } from "@prisma/client";

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export type ActionState = { error?: string } | undefined;

export async function signupAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password || password.length < 8) {
    return { error: "Enter a valid email and a password of at least 8 characters." };
  }

  const existing = await prisma.contractor.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const contractor = await prisma.contractor.create({
    data: { email, passwordHash, trialEndsAt },
  });

  const session = await getSession();
  session.contractorId = contractor.id;
  await session.save();

  await captureServerEvent(contractor.id, "account_registered", {
    $set: { email: contractor.email },
  });

  redirect("/onboarding");
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const contractor = await prisma.contractor.findUnique({ where: { email } });
  if (!contractor) return { error: "Invalid email or password." };

  const valid = await bcrypt.compare(password, contractor.passwordHash);
  if (!valid) return { error: "Invalid email or password." };

  const session = await getSession();
  session.contractorId = contractor.id;
  await session.save();

  await captureServerEvent(contractor.id, "contractor_logged_in");

  redirect(contractor.onboardedAt ? "/dashboard" : "/onboarding");
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}

export async function completeOnboardingAction(formData: FormData) {
  const contractor = await requireContractor();

  const businessName = String(formData.get("businessName") ?? "").trim();
  const projectTypes = formData.getAll("projectTypes").map(String) as ProjectType[];

  await prisma.contractor.update({
    where: { id: contractor.id },
    data: {
      businessName: businessName || null,
      typicalProjectTypes: JSON.stringify(projectTypes),
      onboardedAt: new Date(),
    },
  });

  const existingCount = await prisma.priceBookItem.count({
    where: { contractorId: contractor.id },
  });
  if (existingCount === 0) {
    await prisma.priceBookItem.createMany({
      data: DEFAULT_PRICE_BOOK.map((item) => ({
        contractorId: contractor.id,
        kind: item.kind,
        name: item.name,
        unit: item.unit,
        unitCost: item.unitCost,
        projectType: item.projectType,
      })),
    });
  }

  await captureServerEvent(contractor.id, "onboarding_completed");

  redirect("/jobs/new");
}

export async function updateBusinessProfileAction(formData: FormData) {
  const contractor = await requireContractor();
  const businessName = String(formData.get("businessName") ?? "").trim();

  await prisma.contractor.update({
    where: { id: contractor.id },
    data: { businessName: businessName || null },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function selectTierAction(formData: FormData) {
  const contractor = await requireContractor();
  const tier = String(formData.get("tier") ?? "") as PricingTier;
  if (!["BASIC", "CORE", "PREMIUM"].includes(tier)) return;

  await prisma.contractor.update({
    where: { id: contractor.id },
    data: { selectedTier: tier },
  });

  await captureServerEvent(contractor.id, "pricing_tier_selected", { tier });

  revalidatePath("/settings");
  revalidatePath("/pricing");
  revalidatePath("/dashboard");
}

/**
 * The real "upgrade" button. Sends the contractor through Stripe Checkout
 * when billing is configured (STRIPE_SECRET_KEY + a price ID for this
 * tier); otherwise falls back to the label-only selectTierAction so the
 * Plan page keeps working before Stripe is wired up.
 */
export async function startCheckoutAction(formData: FormData) {
  const contractor = await requireContractor();
  const tier = String(formData.get("tier") ?? "") as PricingTier;
  if (!["BASIC", "CORE", "PREMIUM"].includes(tier)) return;

  const stripe = getStripe();
  const priceId = STRIPE_PRICE_IDS[tier];
  if (!stripe || !priceId) {
    await selectTierAction(formData);
    return;
  }

  let customerId = contractor.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: contractor.email,
      metadata: { contractorId: contractor.id },
    });
    customerId = customer.id;
    await prisma.contractor.update({
      where: { id: contractor.id },
      data: { stripeCustomerId: customerId },
    });
  }

  // Honor the app's own trial — if it's still running, don't have Stripe
  // start charging until it ends, so "you won't be charged now" (shown on
  // the Plan page during the trial) stays true rather than double-billing
  // on top of the trial the contractor already started.
  const trialEndUnix = Math.floor(new Date(contractor.trialEndsAt).getTime() / 1000);
  const trialStillMeaningful = trialEndUnix > Date.now() / 1000 + 3600;

  const origin = await requestOrigin();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    metadata: { contractorId: contractor.id, tier },
    subscription_data: {
      metadata: { contractorId: contractor.id, tier },
      ...(isTrialActive(contractor) && trialStillMeaningful ? { trial_end: trialEndUnix } : {}),
    },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  redirect(session.url);
}

/** Stripe's hosted self-serve portal — change plan, update card, cancel, see invoices. */
export async function openBillingPortalAction() {
  const contractor = await requireContractor();
  const stripe = getStripe();
  if (!stripe || !contractor.stripeCustomerId) {
    throw new Error("Billing isn't set up on this account yet.");
  }

  const origin = await requestOrigin();
  const session = await stripe.billingPortal.sessions.create({
    customer: contractor.stripeCustomerId,
    return_url: `${origin}/settings`,
  });

  redirect(session.url);
}

export async function updatePriceBookItemAction(formData: FormData) {
  const contractor = await requireContractor();
  const id = String(formData.get("id") ?? "");
  const unitCost = Number(formData.get("unitCost"));
  if (!id || Number.isNaN(unitCost) || unitCost < 0) return;

  await prisma.priceBookItem.updateMany({
    where: { id, contractorId: contractor.id },
    data: { unitCost },
  });

  revalidatePath("/settings");
}

export async function addPriceBookItemAction(formData: FormData) {
  const contractor = await requireContractor();
  const kind = String(formData.get("kind") ?? "") as "MATERIAL" | "LABOR";
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim() || "sqft";
  const unitCost = Number(formData.get("unitCost"));
  const projectTypeRaw = String(formData.get("projectType") ?? "");
  const projectType = projectTypeRaw ? (projectTypeRaw as ProjectType) : null;

  if (!name || (kind !== "MATERIAL" && kind !== "LABOR") || Number.isNaN(unitCost) || unitCost < 0) {
    return;
  }

  await prisma.priceBookItem.create({
    data: {
      contractorId: contractor.id,
      kind,
      name,
      unit,
      unitCost,
      projectType,
    },
  });

  await captureServerEvent(contractor.id, "price_book_item_added", { kind, name });

  revalidatePath("/settings");
}

export async function deletePriceBookItemAction(formData: FormData) {
  const contractor = await requireContractor();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.priceBookItem.deleteMany({
    where: { id, contractorId: contractor.id },
  });

  revalidatePath("/settings");
}

export async function createJobAction(formData: FormData) {
  const contractor = await requireContractor();

  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientEmail = String(formData.get("clientEmail") ?? "").trim() || null;
  const clientPhone = String(formData.get("clientPhone") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const projectType = String(formData.get("projectType") ?? "OTHER") as ProjectType;
  const lengthFt = Number(formData.get("lengthFt"));
  const widthFt = Number(formData.get("widthFt"));
  const areaOverride = formData.get("areaSqft");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const photo = formData.get("photo") as File | null;

  if (!clientName || !lengthFt || !widthFt) {
    throw new Error("Client name, length, and width are required.");
  }

  const areaSqft =
    areaOverride && Number(areaOverride) > 0 ? Number(areaOverride) : lengthFt * widthFt;

  const photoUrl = await savePhoto(photo);

  const job = await prisma.job.create({
    data: {
      contractorId: contractor.id,
      clientName,
      clientEmail,
      clientPhone,
      address,
      projectType,
      lengthFt,
      widthFt,
      areaSqft,
      notes,
      photoUrl,
    },
  });

  await captureServerEvent(contractor.id, "job_created", {
    jobId: job.id,
    projectType,
  });

  redirect(`/jobs/${job.id}/design`);
}

export async function saveShapesAction(jobId: string, shapes: unknown) {
  const contractor = await requireContractor();
  const job = await prisma.job.findFirst({ where: { id: jobId, contractorId: contractor.id } });
  if (!job) throw new Error("Job not found.");

  const parsed = shapes as Array<{
    type: string;
    material: string;
    label?: string;
    points: Array<{ x: number; y: number }>;
    heightFt?: number | null;
    baseLayers?: Array<{ material: string; depthIn: number }>;
  }>;

  await prisma.$transaction([
    prisma.designShape.deleteMany({ where: { jobId } }),
    prisma.designShape.createMany({
      data: parsed
        .filter((s) => s.points.length >= 3)
        .map((s, i) => {
          const validLayers = (s.baseLayers ?? []).filter((l) => l.material && l.depthIn > 0);
          return {
            jobId,
            type: s.type as never,
            material: s.material,
            label: s.label || null,
            points: JSON.stringify(s.points),
            heightFt: s.type === "WALL" ? s.heightFt ?? null : null,
            baseLayers: validLayers.length > 0 ? JSON.stringify(validLayers) : null,
            sortOrder: i,
          };
        }),
    }),
  ]);

  await prisma.job.update({
    where: { id: jobId },
    data: { status: "DESIGNED" },
  });

  await captureServerEvent(contractor.id, "design_saved", {
    jobId,
    shapeCount: parsed.length,
  });

  revalidatePath(`/jobs/${jobId}/design`);
  revalidatePath(`/jobs/${jobId}/quote`);
}

export async function saveQuoteAction(jobId: string, payload: unknown) {
  const contractor = await requireContractor();
  const job = await prisma.job.findFirst({ where: { id: jobId, contractorId: contractor.id } });
  if (!job) throw new Error("Job not found.");

  const data = payload as {
    lineItems: Array<{
      kind: "MATERIAL" | "LABOR" | "MARGIN";
      description: string;
      quantity: number;
      unit: string;
      unitCost: number;
    }>;
    marginPct: number;
    proposalHeadline: string;
    proposalMessage: string;
    proposalClosingCta: string;
    roiLowPct: number;
    roiHighPct: number;
    options?: Array<{ name: string; description: string; priceDelta: number }>;
  };

  const options = (data.options ?? []).filter((o) => o.name.trim().length > 0);

  const lineItems = data.lineItems.map((li) => ({
    ...li,
    lineTotal: Math.round(li.quantity * li.unitCost * 100) / 100,
  }));

  const materialTotal = lineItems
    .filter((l) => l.kind === "MATERIAL")
    .reduce((s, l) => s + l.lineTotal, 0);
  const laborTotal = lineItems
    .filter((l) => l.kind === "LABOR")
    .reduce((s, l) => s + l.lineTotal, 0);
  const marginAmount = lineItems
    .filter((l) => l.kind === "MARGIN")
    .reduce((s, l) => s + l.lineTotal, 0);
  const subtotal = materialTotal + laborTotal;
  const total = subtotal + marginAmount;

  await prisma.quote.upsert({
    where: { jobId },
    create: {
      jobId,
      marginPct: data.marginPct,
      materialTotal,
      laborTotal,
      subtotal,
      total,
      roiLowPct: data.roiLowPct,
      roiHighPct: data.roiHighPct,
      proposalHeadline: data.proposalHeadline,
      proposalMessage: data.proposalMessage,
      proposalClosingCta: data.proposalClosingCta,
      lineItems: {
        create: lineItems.map((li, i) => ({ ...li, sortOrder: i })),
      },
      options: {
        create: options.map((o, i) => ({ ...o, sortOrder: i })),
      },
    },
    update: {
      marginPct: data.marginPct,
      materialTotal,
      laborTotal,
      subtotal,
      total,
      roiLowPct: data.roiLowPct,
      roiHighPct: data.roiHighPct,
      proposalHeadline: data.proposalHeadline,
      proposalMessage: data.proposalMessage,
      proposalClosingCta: data.proposalClosingCta,
      lineItems: {
        deleteMany: {},
        create: lineItems.map((li, i) => ({ ...li, sortOrder: i })),
      },
      options: {
        deleteMany: {},
        create: options.map((o, i) => ({ ...o, sortOrder: i })),
      },
    },
  });

  await prisma.job.update({ where: { id: jobId }, data: { status: "QUOTED" } });

  await captureServerEvent(contractor.id, "quote_saved", {
    jobId,
    total,
    optionCount: options.length,
  });

  revalidatePath(`/jobs/${jobId}/quote`);
}

export async function markSentAction(jobId: string) {
  const contractor = await requireContractor();
  await prisma.job.updateMany({
    where: { id: jobId, contractorId: contractor.id },
    data: { status: "SENT" },
  });
  await captureServerEvent(contractor.id, "proposal_marked_sent", { jobId });
  revalidatePath(`/jobs/${jobId}/quote`);
  revalidatePath("/dashboard");
}

export async function acceptProposalAction(formData: FormData) {
  const shareToken = String(formData.get("shareToken") ?? "");
  if (!shareToken) return;
  const optionName = String(formData.get("optionName") ?? "") || null;
  const totalRaw = formData.get("acceptedTotal");
  const acceptedTotal = totalRaw ? Number(totalRaw) : null;

  await prisma.job.updateMany({
    where: { shareToken },
    data: {
      status: "ACCEPTED",
      acceptedOptionName: optionName,
      acceptedTotal: acceptedTotal && !Number.isNaN(acceptedTotal) ? acceptedTotal : null,
    },
  });

  // Public, unauthenticated action — the recipient has no stable non-PII
  // identity, so this is captured as a one-off anonymous event rather than
  // attributed to a person.
  await captureServerEvent(crypto.randomUUID(), "proposal_accepted", {
    shareToken,
    optionName,
    acceptedTotal,
    $process_person_profile: false,
  });

  revalidatePath(`/proposal/${shareToken}`);
}
