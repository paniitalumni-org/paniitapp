export default function AgendaDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 pb-10 lg:max-w-4xl">
      <div className="pt-4">
        <div className="h-3 w-20 animate-pulse rounded bg-brand-50" />
      </div>
      <div className="h-44 animate-pulse rounded-lg border border-brand-100 bg-brand-50" />
      <div className="h-32 animate-pulse rounded-lg border border-brand-100 bg-brand-50" />
      <div className="h-40 animate-pulse rounded-lg border border-brand-100 bg-brand-50" />
    </div>
  );
}
