import { notFound } from "next/navigation";
import Link from "next/link";
import { requireContractor } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/TopNav";
import { hasDesignAccess } from "@/lib/tiers";
import { computeQuote } from "@/lib/quote";
import { defaultProposalCopy, roiEstimate } from "@/lib/proposal";
import { QuoteWorkspace } from "@/components/QuoteWorkspace";

export default async function QuotePage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const contractor = await requireContractor();

  const job = await prisma.job.findFirst({
    where: { id: jobId, contractorId: contractor.id },
    include: {
      shapes: true,
      quote: { include: { lineItems: true, options: { orderBy: { sortOrder: "asc" } } } },
    },
  });
  if (!job) notFound();

  // If the design was edited after the quote was last saved, the saved
  // material/labor lines are stale — recompute from the current shapes
  // instead of silently showing numbers that no longer match the layout.
  const latestShapeChange = job.shapes.length
    ? Math.max(...job.shapes.map((s) => s.createdAt.getTime()))
    : null;
  const designChangedSinceQuote =
    job.quote != null &&
    latestShapeChange != null &&
    latestShapeChange > job.quote.updatedAt.getTime();

  const priceBook = await prisma.priceBookItem.findMany({
    where: { contractorId: contractor.id },
  });

  const parsedShapes = job.shapes.map((s) => ({
    type: s.type,
    material: s.material,
    points: JSON.parse(s.points) as Array<{ x: number; y: number }>,
    heightFt: s.heightFt,
    baseLayers: s.baseLayers
      ? (JSON.parse(s.baseLayers) as Array<{ material: string; depthIn: number }>)
      : [],
  }));

  let initialLineItems: Array<{
    id: string;
    kind: "MATERIAL" | "LABOR";
    description: string;
    quantity: number;
    unit: string;
    unitCost: number;
  }>;
  if (job.quote && !designChangedSinceQuote) {
    initialLineItems = job.quote.lineItems
      .filter((l) => l.kind !== "MARGIN")
      .map((l) => ({
        id: l.id,
        kind: l.kind as "MATERIAL" | "LABOR",
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unitCost: l.unitCost,
      }));
  } else if (job.shapes.length > 0) {
    const computed = computeQuote(parsedShapes, priceBook, job.projectType);
    initialLineItems = computed.lineItems
      .filter((l) => l.kind !== "MARGIN")
      .map((l, i) => ({
        id: `computed-${i}`,
        kind: l.kind as "MATERIAL" | "LABOR",
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unitCost: l.unitCost,
      }));
  } else {
    initialLineItems = [];
  }

  const previewTotalForCopy =
    job.quote && !designChangedSinceQuote
      ? job.quote.total
      : job.shapes.length > 0
        ? computeQuote(parsedShapes, priceBook, job.projectType).total
        : 0;
  const copy =
    job.quote && !designChangedSinceQuote
      ? {
          headline: job.quote.proposalHeadline,
          message: job.quote.proposalMessage,
          closingCta: job.quote.proposalClosingCta,
        }
      : defaultProposalCopy(
          contractor.businessName,
          job.projectType,
          job.clientName,
          previewTotalForCopy
        );

  const roi = roiEstimate(job.projectType, previewTotalForCopy);

  return (
    <>
      <TopNav contractor={contractor} />
      <main className="flex-1 mx-auto max-w-4xl w-full px-6 py-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold">Quote — {job.clientName}</h1>
          <div className="flex items-center gap-4">
            <Link
              href={`/jobs/${job.id}/materials`}
              className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Materials list →
            </Link>
            {hasDesignAccess(contractor) && (
              <Link
                href={`/jobs/${job.id}/design`}
                className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                ← Back to design
              </Link>
            )}
          </div>
        </div>
        {designChangedSinceQuote && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-2 text-sm text-amber-900 dark:text-amber-200">
            The design changed since this quote was last saved — the numbers
            below reflect the current layout. Save again to update the
            client&apos;s proposal.
          </div>
        )}
        <p className="text-sm text-black/60 dark:text-white/60 mb-6">
          {job.areaSqft.toLocaleString()} sqft ·{" "}
          {job.shapes.length > 0
            ? `${job.shapes.length} design element(s)`
            : "No design elements — add line items manually below"}
        </p>

        <QuoteWorkspace
          jobId={job.id}
          shareToken={job.shareToken}
          jobStatus={job.status}
          materialNames={priceBook
            .filter((p) => p.kind === "MATERIAL")
            .map((p) => p.name)}
          initialLineItems={initialLineItems}
          initialMarginPct={job.quote?.marginPct ?? 0.2}
          initialCopy={copy}
          roiLowPct={roi.lowPct}
          roiHighPct={roi.highPct}
          hasSavedQuote={Boolean(job.quote)}
          businessName={contractor.businessName}
          projectType={job.projectType}
          clientName={job.clientName}
          initialOptions={(job.quote?.options ?? []).map((o) => ({
            id: o.id,
            name: o.name,
            description: o.description,
            priceDelta: o.priceDelta,
          }))}
          acceptedOptionName={job.acceptedOptionName}
          acceptedTotal={job.acceptedTotal}
        />
      </main>
    </>
  );
}
