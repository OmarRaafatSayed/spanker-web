/**
 * Dashboard route loading state.
 * Renders a skeleton that matches the dashboard grid layout so there's
 * no layout shift when real data arrives.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Welcome banner skeleton */}
      <div className="h-16 rounded-2xl bg-gray-200 animate-pulse w-full" />

      {/* Stats cards row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white border border-border-light p-5 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 rounded bg-gray-200 animate-pulse" />
                <div className="h-5 w-12 rounded bg-gray-200 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity skeleton */}
      <div className="rounded-2xl bg-white border border-border-light overflow-hidden">
        <div className="h-12 border-b border-border-light px-6 flex items-center">
          <div className="h-4 w-36 rounded bg-gray-200 animate-pulse" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-14 border-b border-border-light px-6 flex items-center gap-4 last:border-0"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-1/3 rounded bg-gray-100 animate-pulse" />
              <div className="h-2.5 w-1/4 rounded bg-gray-100 animate-pulse" />
            </div>
            <div className="h-6 w-20 rounded-full bg-gray-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
