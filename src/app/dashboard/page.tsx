import Link from "next/link";
import { redirect } from "next/navigation";
import { requireContractor } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/TopNav";
import { PROJECT_TYPE_LABELS } from "@/lib/pricing";
import { isTrialActive, trialDaysLeft } from "@/lib/tiers";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  DESIGNED: "Designed",
  QUOTED: "Quoted",
  SENT: "Sent to client",
  ACCEPTED: "Accepted",
};

export default async function DashboardPage() {
  const contractor = await requireContractor();
  if (!contractor.onboardedAt) redirect("/onboarding");

  const jobs = await prisma.job.findMany({
    where: { contractorId: contractor.id },
    orderBy: { createdAt: "desc" },
    include: { quote: true },
  });

  const pipelineJobs = jobs.filter((j) => j.quote && (j.status === "QUOTED" || j.status === "SENT"));
  const wonJobs = jobs.filter((j) => j.quote && j.status === "ACCEPTED");
  const pipelineValue = pipelineJobs.reduce((s, j) => s + (j.quote?.total ?? 0), 0);
  const wonValue = wonJobs.reduce((s, j) => s + (j.acceptedTotal ?? j.quote?.total ?? 0), 0);

  return (
    <>
      <TopNav contractor={contractor} />
      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-10">
        {isTrialActive(contractor) && (
          <div className="mb-8 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
            You&apos;re on a free trial with full access —{" "}
            <strong>{trialDaysLeft(contractor)} day(s) left</strong>. See a
            finished quote before choosing a plan on the{" "}
            <Link href="/pricing" className="underline">
              Plan
            </Link>{" "}
            page.
          </div>
        )}

        {jobs.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <StatCard label="Total jobs" value={jobs.length.toString()} />
            <StatCard
              label={`Pipeline (${pipelineJobs.length})`}
              value={`$${pipelineValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            />
            <StatCard
              label={`Won (${wonJobs.length})`}
              value={`$${wonValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            />
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl">Jobs</h1>
          <Link
            href="/jobs/new"
            className="rounded-md bg-emerald-700 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-800"
          >
            + New job
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-black/15 dark:border-white/15 px-6 py-16 text-center">
            <p className="text-black/70 dark:text-white/70 mb-4">
              No jobs yet. Create your first job to design a layout and
              generate a quote in a few minutes.
            </p>
            <Link
              href="/jobs/new"
              className="inline-block rounded-md bg-emerald-700 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-800"
            >
              Create your first job
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-black/10 dark:divide-white/10 rounded-lg border border-black/10 dark:border-white/10">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={
                  job.status === "DRAFT"
                    ? `/jobs/${job.id}/design`
                    : `/jobs/${job.id}/quote`
                }
                className="flex items-center justify-between px-5 py-4 hover:bg-black/[.02] dark:hover:bg-white/[.03]"
              >
                <div>
                  <p className="font-medium">{job.clientName}</p>
                  <p className="text-sm text-black/60 dark:text-white/60">
                    {PROJECT_TYPE_LABELS[job.projectType]} · {job.areaSqft.toLocaleString()} sqft
                    {job.address ? ` · ${job.address}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  {job.quote && (
                    <p className="font-medium">
                      $
                      {(job.acceptedTotal ?? job.quote.total).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  )}
                  <p className="text-xs text-black/50 dark:text-white/50">
                    {STATUS_LABEL[job.status]}
                    {job.acceptedOptionName ? ` · ${job.acceptedOptionName}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg border px-4 py-3"
      style={{ borderColor: "var(--stone-border)", background: "var(--background-raised)" }}
    >
      <p className="font-mono text-[11px] uppercase tracking-wide mb-1" style={{ color: "var(--ink-muted)" }}>
        {label}
      </p>
      <p className="font-display text-xl">{value}</p>
    </div>
  );
}
