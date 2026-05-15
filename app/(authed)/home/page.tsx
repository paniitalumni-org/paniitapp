export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="pt-5 lg:pt-8">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900 lg:text-3xl">
          Home
        </h1>
        <p className="mt-1 text-sm leading-6 text-brand-900/70">
          The summit-day dashboard lands here shortly — carousel, quick actions,
          calendar, key participants, and partners.
        </p>
      </header>

      <div className="rounded-2xl border border-brand-100 bg-white p-6 text-sm text-brand-900/80">
        Home tab placeholder. Build in progress.
      </div>
    </div>
  );
}
