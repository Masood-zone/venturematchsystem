export default function DashboardLoading() {
  return <main id="main-content" className="mx-auto w-full max-w-7xl space-y-6 px-4 py-12 sm:px-8" role="status" aria-label="Loading your dashboard">
    <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
    <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
      <div className="h-10 w-2/3 rounded-xl bg-secondary" />
      {[1, 2, 3].map((row) => <div key={row} className="h-40 rounded-2xl bg-secondary" />)}
    </div>
  </main>;
}
