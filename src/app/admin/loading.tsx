/**
 * Admin route loading state.
 * Shown automatically by Next.js while an async server component in /admin
 * is streaming in, or during a Suspense boundary resolution.
 */
export default function AdminLoading() {
  return (
    <div className="p-6 space-y-5">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 rounded-lg bg-gray-200 animate-pulse" />
        <div className="h-9 w-32 rounded-xl bg-gray-200 animate-pulse" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white border border-border-light p-5 space-y-3"
          >
            <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
            <div className="h-8 w-16 rounded bg-gray-200 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl bg-white border border-border-light overflow-hidden">
        <div className="h-12 border-b border-border-light bg-gray-50 px-6 flex items-center gap-4">
          <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 border-b border-border-light px-6 flex items-center gap-4"
          >
            <div className="h-4 w-1/4 rounded bg-gray-100 animate-pulse" />
            <div className="h-4 w-1/4 rounded bg-gray-100 animate-pulse" />
            <div className="h-4 w-1/6 rounded bg-gray-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
