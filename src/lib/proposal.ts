import type { ProjectType } from "@prisma/client";
import { PROJECT_TYPE_LABELS, ROI_RANGES } from "./pricing";

export function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function roiEstimate(projectType: ProjectType, total: number) {
  const range = ROI_RANGES[projectType];
  return {
    low: Math.round(total * range.low),
    high: Math.round(total * range.high),
    lowPct: range.low,
    highPct: range.high,
  };
}

/** Built-in default proposal template copy — editable per-quote by the contractor. */
export function defaultProposalCopy(
  businessName: string | null,
  projectType: ProjectType,
  clientName: string,
  total: number
) {
  const label = PROJECT_TYPE_LABELS[projectType].toLowerCase();
  const roi = roiEstimate(projectType, total);
  const company = businessName || "Your Contractor";

  return {
    headline: `A ${formatCurrency(total)} Investment in Your Property`,
    message: `${company} has designed a ${label} project for ${clientName} that goes beyond a simple cost — it's an upgrade to how you'll use and enjoy this property, and to what it's worth. Based on typical resale outcomes for ${label} projects, homeowners recoup an estimated ${formatCurrency(
      roi.low
    )}–${formatCurrency(roi.high)} of this investment in added property value, on top of the everyday enjoyment the space adds starting the day it's finished.`,
    closingCta: `Ready to move forward? Reply to this proposal or contact ${company} to schedule your project.`,
  };
}
