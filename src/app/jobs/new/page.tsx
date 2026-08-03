import { requireContractor } from "@/lib/session";
import { TopNav } from "@/components/TopNav";
import { createJobAction } from "@/lib/actions";
import { PROJECT_TYPE_LABELS } from "@/lib/pricing";

export default async function NewJobPage() {
  const contractor = await requireContractor();
  const projectTypes = Object.entries(PROJECT_TYPE_LABELS);

  return (
    <>
      <TopNav contractor={contractor} />
      <main className="flex-1 mx-auto max-w-2xl w-full px-6 py-10">
        <h1 className="text-2xl font-semibold mb-1">New job</h1>
        <p className="text-black/60 dark:text-white/60 mb-8">
          Client info and property measurements. You&apos;ll design the
          layout next.
        </p>

        <form action={createJobAction} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Client name" name="clientName" required />
            <Field label="Client email" name="clientEmail" type="email" />
            <Field label="Client phone" name="clientPhone" type="tel" />
            <Field label="Property address" name="address" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="projectType">
              Project type
            </label>
            <select
              id="projectType"
              name="projectType"
              defaultValue="PATIO"
              className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
            >
              {projectTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Length (ft)" name="lengthFt" type="number" step="0.1" required />
            <Field label="Width (ft)" name="widthFt" type="number" step="0.1" required />
            <Field
              label="Area override (sqft, optional)"
              name="areaSqft"
              type="number"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="photo">
              Property photo (optional)
            </label>
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              className="w-full text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-emerald-700 text-white px-4 py-2.5 font-medium hover:bg-emerald-800"
          >
            Create job & start design
          </button>
        </form>
      </main>
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
      />
    </div>
  );
}
