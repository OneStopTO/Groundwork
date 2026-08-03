import { redirect } from "next/navigation";
import { requireContractor } from "@/lib/session";
import { PROJECT_TYPE_LABELS } from "@/lib/pricing";
import { OnboardingWizard } from "@/components/OnboardingWizard";

export default async function OnboardingPage() {
  const contractor = await requireContractor();
  if (contractor.onboardedAt) redirect("/dashboard");

  const projectTypes = Object.entries(PROJECT_TYPE_LABELS);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <OnboardingWizard
        projectTypes={projectTypes}
        contractor={{ id: contractor.id, email: contractor.email }}
      />
    </main>
  );
}
