export default function Loading() {
  return (
    <div className="min-h-screen bg-nf-black pt-16">
      <div className="h-[56vw] max-h-[85vh] min-h-[420px] w-full animate-pulse bg-zinc-900" />
      <div className="space-y-6 px-4 py-8 sm:px-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="mb-3 h-5 w-40 animate-pulse rounded bg-white/10" />
            <div className="flex gap-2.5">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="aspect-[2/3] w-[150px] shrink-0 animate-pulse rounded-md bg-white/5 sm:w-[180px]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
