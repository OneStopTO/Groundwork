import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PROJECT_TYPE_LABELS } from "@/lib/pricing";
import { acceptProposalAction } from "@/lib/actions";

function formatCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  const job = await prisma.job.findUnique({
    where: { shareToken },
    include: {
      contractor: true,
      quote: { include: { lineItems: { orderBy: { sortOrder: "asc" } } } },
    },
  });

  if (!job) notFound();
  if (!job.quote) {
    return (
      <main className="flex-1 flex items-center justify-center px-6 py-24 text-center">
        <p style={{ color: "var(--ink-muted)" }}>
          This proposal isn&apos;t ready yet. Please check back soon.
        </p>
      </main>
    );
  }

  const { quote } = job;
  const materialLines = quote.lineItems.filter((l) => l.kind === "MATERIAL");
  const laborLines = quote.lineItems.filter((l) => l.kind === "LABOR");
  const marginLine = quote.lineItems.find((l) => l.kind === "MARGIN");

  const roiLow = Math.round(quote.total * quote.roiLowPct);
  const roiHigh = Math.round(quote.total * quote.roiHighPct);

  return (
    <main className="flex-1 contour-field">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="animate-rise-in font-mono text-xs tracking-[0.18em] uppercase text-emerald-700 dark:text-emerald-400 mb-3">
          {job.contractor.businessName || "Property Investment Proposal"}
        </p>
        <h1
          className="animate-rise-in text-4xl sm:text-5xl leading-[1.08] mb-4"
          style={{ animationDelay: "60ms" }}
        >
          {quote.proposalHeadline}
        </h1>
        <p
          className="animate-rise-in mb-9"
          style={{ color: "var(--ink-muted)", animationDelay: "110ms" }}
        >
          Prepared for {job.clientName}
          {job.address ? ` · ${job.address}` : ""} ·{" "}
          {PROJECT_TYPE_LABELS[job.projectType]}
        </p>

        {job.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={job.photoUrl}
            alt="Property"
            className="w-full rounded-xl mb-8 border"
            style={{ borderColor: "var(--stone-border)" }}
          />
        )}

        <div
          className="animate-rise-in rounded-2xl text-white px-7 py-7 mb-9 shadow-lg shadow-black/10"
          style={{ background: "#7a3a1d", animationDelay: "160ms" }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.14em] mb-2" style={{ color: "#f1d9c5" }}>
            Estimated property value impact
          </p>
          <p className="font-mono text-3xl mb-3">
            {formatCurrency(roiLow)} – {formatCurrency(roiHigh)}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#f1d9c5" }}>
            Based on typical resale value recouped for{" "}
            {PROJECT_TYPE_LABELS[job.projectType].toLowerCase()} projects (
            {Math.round(quote.roiLowPct * 100)}–{Math.round(quote.roiHighPct * 100)}% of
            project cost), on top of the everyday enjoyment this space adds.
          </p>
        </div>

        <p className="leading-relaxed mb-10 whitespace-pre-line" style={{ color: "var(--foreground)", opacity: 0.85 }}>
          {quote.proposalMessage}
        </p>

        <div
          className="rounded-xl border p-6 mb-8"
          style={{ borderColor: "var(--stone-border)", background: "var(--background-raised)" }}
        >
          <h2 className="font-display text-xl mb-4">Your investment, itemized</h2>

          {materialLines.length > 0 && (
            <div className="mb-4">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--ink-muted)" }}>
                Materials
              </p>
              {materialLines.map((l) => (
                <div key={l.id} className="flex justify-between text-sm py-1.5">
                  <span>
                    {l.description} ({l.quantity} {l.unit})
                  </span>
                  <span className="font-mono">{formatCurrency(l.lineTotal)}</span>
                </div>
              ))}
            </div>
          )}

          {laborLines.length > 0 && (
            <div className="mb-4">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--ink-muted)" }}>
                Labor
              </p>
              {laborLines.map((l) => (
                <div key={l.id} className="flex justify-between text-sm py-1.5">
                  <span>{l.description}</span>
                  <span className="font-mono">{formatCurrency(l.lineTotal)}</span>
                </div>
              ))}
            </div>
          )}

          {marginLine && (
            <div className="flex justify-between text-sm py-1.5" style={{ color: "var(--ink-muted)" }}>
              <span>Project management &amp; overhead</span>
              <span className="font-mono">{formatCurrency(marginLine.lineTotal)}</span>
            </div>
          )}

          <div
            className="flex justify-between text-lg font-semibold border-t mt-3 pt-3"
            style={{ borderColor: "var(--stone-border)" }}
          >
            <span className="font-display">Total investment</span>
            <span className="font-mono">{formatCurrency(quote.total)}</span>
          </div>
        </div>

        <p className="mb-6" style={{ color: "var(--foreground)", opacity: 0.8 }}>{quote.proposalClosingCta}</p>

        {job.status === "ACCEPTED" ? (
          <div className="rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-4 py-3 text-sm font-medium">
            ✓ Proposal accepted — {job.contractor.businessName || "your contractor"} will be in
            touch to schedule.
          </div>
        ) : (
          <form action={acceptProposalAction}>
            <input type="hidden" name="shareToken" value={shareToken} />
            <button
              type="submit"
              className="rounded-md bg-emerald-700 text-white px-6 py-3 font-medium hover:bg-emerald-800"
            >
              Accept this proposal
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
