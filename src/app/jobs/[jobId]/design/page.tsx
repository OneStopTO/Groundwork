import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireContractor } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/TopNav";
import { hasDesignAccess } from "@/lib/tiers";
import { isVolumeUnit } from "@/lib/pricing";
import { DesignEditor } from "@/components/DesignEditor";

export default async function DesignPage({
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

  if (!hasDesignAccess(contractor)) {
    redirect(`/jobs/${jobId}/quote`);
  }

  const materials = await prisma.priceBookItem.findMany({
    where: { contractorId: contractor.id, kind: "MATERIAL" },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <TopNav contractor={contractor} />
      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">
              Design — {job.clientName}
            </h1>
            <p className="text-sm text-black/60 dark:text-white/60">
              Property: {job.lengthFt}ft × {job.widthFt}ft (
              {job.areaSqft.toLocaleString()} sqft)
            </p>
          </div>
          <Link
            href={`/jobs/${job.id}/materials`}
            className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
          >
            Materials list →
          </Link>
        </div>
        <DesignEditor
          job={job}
          initialShapes={job.shapes}
          materialNames={materials.filter((m) => !isVolumeUnit(m.unit)).map((m) => m.name)}
          baseMaterialNames={materials.filter((m) => isVolumeUnit(m.unit)).map((m) => m.name)}
        />
      </main>
    </>
  );
}
