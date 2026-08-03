import { notFound } from "next/navigation";
import Link from "next/link";
import { requireContractor } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/TopNav";
import { PrintButton } from "@/components/PrintButton";
import { materialsTakeoff, type TakeoffLine } from "@/lib/quote";
import type { Point, BaseLayer } from "@/lib/geometry";

export default async function MaterialsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const contractor = await requireContractor();

  const job = await prisma.job.findFirst({
    where: { id: jobId, contractorId: contractor.id },
    include: { shapes: true },
  });
  if (!job) notFound();

  const priceBook = await prisma.priceBookItem.findMany({
    where: { contractorId: contractor.id, kind: "MATERIAL" },
  });

  const shapes = job.shapes.map((s) => ({
    type: s.type,
    material: s.material,
    points: JSON.parse(s.points) as Point[],
    heightFt: s.heightFt,
    baseLayers: s.baseLayers ? (JSON.parse(s.baseLayers) as BaseLayer[]) : [],
  }));

  const takeoff = materialsTakeoff(shapes, priceBook);

  return (
    <>
      <TopNav contractor={contractor} />
      <main className="flex-1 mx-auto max-w-2xl w-full px-6 py-8">
        <div className="flex items-center justify-between mb-2 print:hidden">
          <Link
            href={`/jobs/${job.id}/design`}
            className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            ← Back to design
          </Link>
          <PrintButton />
        </div>

        <h1 className="font-display text-2xl mb-1">Materials list</h1>
        <p className="text-sm mb-8" style={{ color: "var(--ink-muted)" }}>
          {job.clientName}
          {job.address ? ` · ${job.address}` : ""} — no pricing, just
          quantities to bring to the supplier or hand to the crew.
        </p>

        {shapes.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            No design elements yet — add shapes on the design page first.
          </p>
        ) : (
          <div className="space-y-8">
            <TakeoffTable title="Surface materials" lines={takeoff.surface} />
            <TakeoffTable title="Base prep materials" lines={takeoff.base} />
          </div>
        )}
      </main>
    </>
  );
}

function TakeoffTable({ title, lines }: { title: string; lines: TakeoffLine[] }) {
  if (lines.length === 0) return null;
  return (
    <section>
      <h2 className="font-display text-lg mb-3">{title}</h2>
      <div
        className="rounded-lg border divide-y"
        style={{ borderColor: "var(--stone-border)" }}
      >
        {lines.map((line) => (
          <div
            key={line.material}
            className="flex items-center justify-between px-4 py-3 text-sm"
            style={{ borderColor: "var(--stone-border)" }}
          >
            <span>{line.material}</span>
            <span className="font-mono">
              {line.quantity.toLocaleString()} {line.unit}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
