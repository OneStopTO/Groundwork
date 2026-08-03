import Link from "next/link";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <main className="flex-1 mx-auto max-w-2xl w-full px-6 py-16">
      <p className="text-sm mb-8" style={{ color: "var(--ink-muted)" }}>
        <Link href="/" className="underline">
          ← GroundWork
        </Link>
      </p>
      <h1 className="font-display text-3xl mb-2">Privacy Policy</h1>
      <p className="text-sm mb-10" style={{ color: "var(--ink-muted)" }}>
        Last updated: draft — not yet reviewed by a lawyer. Replace this
        notice once it has been.
      </p>

      <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
        <section>
          <h2 className="font-display text-lg mb-2">What we collect</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Account info: your email and a hashed (never plaintext) password.</li>
            <li>
              Business info you provide: business name, materials and labor
              pricing you enter into your price book.
            </li>
            <li>
              Client/job data you enter to use the product: client names,
              email, phone, property address, property photos, and design
              layouts.
            </li>
            <li>
              Product usage analytics (page views, feature usage) via
              PostHog, to understand how the product is used and improve it.
            </li>
            <li>
              Billing info, if you subscribe to a paid plan — handled
              entirely by Stripe. We store which plan you&apos;re on and
              your subscription status, never your card number.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">How we use it</h2>
          <p>
            To operate the product (store your jobs and designs, generate
            quotes, host your client-facing proposal pages), to process
            payment for paid plans, and to understand product usage so we
            can improve it. We don&apos;t sell your data or your
            clients&apos; data.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Your clients&apos; data</h2>
          <p>
            When you create a job, the client details and any property
            photo you enter are stored so you can generate a quote and share
            a proposal link. That proposal link is accessible to anyone who
            has the link — treat it as you would any document you&apos;d
            hand a client. You&apos;re responsible for having your
            client&apos;s consent to store their information in a tool like
            this.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Third parties we use</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Vercel</strong> — hosting and, if configured, property
              photo storage.
            </li>
            <li>
              <strong>Neon</strong> (or your configured Postgres host) —
              database storage.
            </li>
            <li>
              <strong>Stripe</strong> — payment processing for paid plans.
            </li>
            <li>
              <strong>PostHog</strong> — product usage analytics and error
              tracking.
            </li>
          </ul>
          <p className="mt-2">
            Each has its own privacy policy governing how they handle data
            on our behalf.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Cookies</h2>
          <p>
            We use a session cookie to keep you logged in, and analytics
            cookies (via PostHog) to understand product usage. No
            third-party advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Data retention & deletion</h2>
          <p>
            We retain your data for as long as your account is active.
            Request deletion of your account and associated data anytime by
            contacting us — add a real contact email here.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Changes</h2>
          <p>
            We may update this policy from time to time. Material changes
            will be reflected here with an updated date.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg mb-2">Contact</h2>
          <p>Questions about this policy — add a real contact email here.</p>
        </section>
      </div>
    </main>
  );
}
