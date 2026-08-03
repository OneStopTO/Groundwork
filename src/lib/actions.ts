"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { getSession, requireContractor } from "./session";
import { TRIAL_DAYS } from "./tiers";
import { DEFAULT_PRICE_BOOK } from "./pricing";
import { savePhoto } from "./storage";
import type { ProjectType, PricingTier } from "@prisma/client";

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

  revalidatePath("/settings");
  revalidatePath("/pricing");
  revalidatePath("/dashboard");
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
        .map((s) => {
          const validLayers = (s.baseLayers ?? []).filter((l) => l.material && l.depthIn > 0);
          return {
            jobId,
            type: s.type as never,
            material: s.material,
            label: s.label || null,
            points: JSON.stringify(s.points),
            heightFt: s.type === "WALL" ? s.heightFt ?? null : null,
            baseLayers: validLayers.length > 0 ? JSON.stringify(validLayers) : null,
          };
        }),
    }),
  ]);

  await prisma.job.update({
    where: { id: jobId },
    data: { status: "DESIGNED" },
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
  };

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
    },
  });

  await prisma.job.update({ where: { id: jobId }, data: { status: "QUOTED" } });

  revalidatePath(`/jobs/${jobId}/quote`);
}

export async function markSentAction(jobId: string) {
  const contractor = await requireContractor();
  await prisma.job.updateMany({
    where: { id: jobId, contractorId: contractor.id },
    data: { status: "SENT" },
  });
  revalidatePath(`/jobs/${jobId}/quote`);
  revalidatePath("/dashboard");
}

export async function acceptProposalAction(formData: FormData) {
  const shareToken = String(formData.get("shareToken") ?? "");
  if (!shareToken) return;
  await prisma.job.updateMany({
    where: { shareToken },
    data: { status: "ACCEPTED" },
  });
  revalidatePath(`/proposal/${shareToken}`);
}
