export function LoadingState() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-lg border border-orion-border bg-white p-5 shadow-soft">
          <div className="mb-5 h-4 w-24 rounded bg-slate-200" />
          <div className="h-8 w-36 rounded bg-slate-200" />
          <div className="mt-5 h-3 w-full rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
