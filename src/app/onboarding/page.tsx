import { redirect } from "next/navigation";
import { requireContractor } from "@/lib/session";
import { completeOnboardingAction } from "@/lib/actions";
import { PROJECT_TYPE_LABELS } from "@/lib/pricing";

export default async function OnboardingPage() {
  const contractor = await requireContractor();
  if (contractor.onboardedAt) redirect("/dashboard");

  const projectTypes = Object.entries(PROJECT_TYPE_LABELS);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold mb-1">
          Let&apos;s set up your account
        </h1>
        <p className="text-sm text-black/60 dark:text-white/60 mb-8">
          Two quick questions and we&apos;ll pre-fill a default price sheet
          so you can create your first quote right away. You can edit
          everything later in Settings.
        </p>

        <form action={completeOnboardingAction} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="businessName">
              Business name
            </label>
            <input
              id="businessName"
              name="businessName"
              type="text"
              placeholder="e.g. Summit Hardscapes"
              className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
            />
          </div>

          <div>
            <span className="block text-sm font-medium mb-2">
              What kind of projects do you typically run? (select all that apply)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {projectTypes.map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-2 rounded-md border border-black/10 dark:border-white/10 px-3 py-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name="projectTypes"
                    value={value}
                    defaultChecked={["PATIO", "WALKWAY", "RETAINING_WALL"].includes(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-md bg-black/[.03] dark:bg-white/[.05] px-4 py-3 text-sm text-black/70 dark:text-white/70">
            We&apos;ll load a default price sheet for common materials
            (pavers, natural stone, mulch, sod, gravel, retaining wall block)
            and labor rates by project type. Edit any price anytime in
            Settings.
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-emerald-700 text-white px-4 py-2.5 font-medium hover:bg-emerald-800"
          >
            Finish setup & go to dashboard
          </button>
        </form>
      </div>
    </main>
  );
}
