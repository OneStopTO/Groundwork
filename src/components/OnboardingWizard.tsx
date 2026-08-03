"use client";

import { useState } from "react";
import { completeOnboardingAction } from "@/lib/actions";

const STEPS = ["Your business", "How it works", "You're set"] as const;

const HOW_IT_WORKS = [
  {
    title: "1. Create a job",
    body: "Enter the client's info and rough property measurements. Takes under a minute.",
  },
  {
    title: "2. Design the layout",
    body: "Drag shapes onto a to-scale canvas — patio, walkway, retaining wall, and more. Reshape corners and rotate to match the site.",
  },
  {
    title: "3. Get an instant quote",
    body: "Materials, labor, and your margin are calculated automatically from the design — no spreadsheet.",
  },
  {
    title: "4. Send the proposal",
    body: "Share a client-facing page framed around their investment. They can accept it online.",
  },
];

export function OnboardingWizard({
  projectTypes,
}: {
  projectTypes: [string, string][];
}) {
  const [step, setStep] = useState(0);

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={`h-1.5 flex-1 rounded-full ${
                i <= step ? "bg-emerald-700" : "bg-black/10 dark:bg-white/15"
              }`}
            />
          </div>
        ))}
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-1">
        Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </p>

      <form action={completeOnboardingAction} className="space-y-6">
        <div className={step === 0 ? "space-y-6" : "hidden"}>
          <div>
            <h1 className="text-2xl font-semibold mb-1">
              Let&apos;s set up your account
            </h1>
            <p className="text-sm text-black/60 dark:text-white/60">
              Two quick questions and we&apos;ll pre-fill a default price
              sheet so you can create your first quote right away. You can
              edit everything later in Settings.
            </p>
          </div>

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
            type="button"
            onClick={() => setStep(1)}
            className="w-full rounded-md bg-emerald-700 text-white px-4 py-2.5 font-medium hover:bg-emerald-800"
          >
            Continue
          </button>
        </div>

        <div className={step === 1 ? "space-y-6" : "hidden"}>
          <div>
            <h1 className="text-2xl font-semibold mb-1">How GroundWork works</h1>
            <p className="text-sm text-black/60 dark:text-white/60">
              Four steps, start to finish — most contractors have a finished
              quote in under fifteen minutes.
            </p>
          </div>

          <div className="space-y-3">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.title}
                className="rounded-md border border-black/10 dark:border-white/10 px-4 py-3"
              >
                <p className="text-sm font-medium mb-0.5">{item.title}</p>
                <p className="text-sm text-black/60 dark:text-white/60">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="rounded-md border border-black/15 dark:border-white/20 px-4 py-2.5 font-medium hover:bg-black/[.03] dark:hover:bg-white/[.05]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 rounded-md bg-emerald-700 text-white px-4 py-2.5 font-medium hover:bg-emerald-800"
            >
              Continue
            </button>
          </div>
        </div>

        <div className={step === 2 ? "space-y-6" : "hidden"}>
          <div>
            <h1 className="text-2xl font-semibold mb-1">You&apos;re all set</h1>
            <p className="text-sm text-black/60 dark:text-white/60">
              Your price sheet is ready. Let&apos;s create your first job —
              you&apos;ll be designing a layout in under a minute.
            </p>
          </div>

          <div className="rounded-md bg-black/[.03] dark:bg-white/[.05] px-4 py-3 text-sm text-black/70 dark:text-white/70">
            Tip: keep a client&apos;s property photo handy — you can upload it
            when you create the job and use it as a reference while you
            design.
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-md border border-black/15 dark:border-white/20 px-4 py-2.5 font-medium hover:bg-black/[.03] dark:hover:bg-white/[.05]"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 rounded-md bg-emerald-700 text-white px-4 py-2.5 font-medium hover:bg-emerald-800"
            >
              Create your first job →
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
