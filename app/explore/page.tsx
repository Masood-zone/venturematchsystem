import { Suspense } from "react";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/services/auth/session";
import { publishedVentures } from "@/services/onboarding/discovery";
import { parseVentureFilters, type SearchParams } from "@/lib/venture-dashboard";
import StudentShell from "@/components/onboarding/student-shell";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { DashboardEmpty, DashboardHeading, SetupReminder } from "@/components/ventures/dashboard-parts";
import DashboardLoading from "@/components/ventures/dashboard-loading";
import OpportunityCard from "@/components/ventures/opportunity-card";

export default function ExplorePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <Suspense fallback={<DashboardLoading />}><Explore searchParams={searchParams} /></Suspense>;
}

async function Explore({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.user.role !== "student") redirect("/");
  const filters = parseVentureFilters(await searchParams);
  const [ventures, profile, sectors, hours] = await Promise.all([
    publishedVentures(filters),
    db.student_profile.findUnique({ where: { userId: session.user.id }, select: { onboardingCompleted: true } }),
    db.venture_sector.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.availability_option.findMany({ select: { id: true, label: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  const sectorNames = new Map(sectors.map((sector) => [sector.id, sector.name]));
  const hourLabels = new Map(hours.map((option) => [option.id, option.label]));
  const filtered = Boolean(filters.q || filters.sector || filters.hours);
  return <StudentShell><main id="main-content" className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-8 sm:py-12">
    {!profile?.onboardingCompleted && <SetupReminder />}
    <DashboardHeading eyebrow="USTED student venture directory" title="Explore opportunities">Find student ideas seeking complementary skills. Explore the brief, see what help is needed, and discover where you could contribute.</DashboardHeading>
    {profile?.onboardingCompleted && <p className="text-sm text-muted-foreground">Ready for your next team? <Link href="/profile/edit" className="font-semibold text-functional-teal underline">Update your skills and team preferences</Link></p>}
    <Form key={JSON.stringify(filters)} action="/explore" className="space-y-5 rounded-2xl border border-primary/5 bg-white p-5 shadow-sm sm:p-7" aria-label="Filter opportunities">
      <div>
        <label htmlFor="venture-search" className="sr-only">Search by venture title, problem, or required skill</label>
        <div className="flex items-center gap-3 rounded-xl bg-secondary px-4">
          <MaterialSymbol icon="search" className="shrink-0 text-2xl text-muted-foreground" />
          <input id="venture-search" name="q" type="search" maxLength={120} defaultValue={filters.q} placeholder="Search ventures, problems, or skills…" className="min-h-14 min-w-0 flex-1 bg-transparent text-base outline-none sm:text-sm" />
        </div>
      </div>
      <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]">
        <div className="space-y-2"><label htmlFor="venture-sector" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sector</label>
          <select id="venture-sector" name="sector" defaultValue={filters.sector} className="onboarding-input w-full">
            <option value="">All sectors</option>
            {filters.sector && !sectorNames.has(filters.sector) && <option value={filters.sector}>Unavailable sector</option>}
            {sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}
          </select>
        </div>
        <div className="space-y-2"><label htmlFor="venture-hours" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weekly availability</label>
          <select id="venture-hours" name="hours" defaultValue={filters.hours} className="onboarding-input w-full">
            <option value="">Any weekly availability</option>
            {filters.hours && !hourLabels.has(filters.hours) && <option value={filters.hours}>Unavailable time band</option>}
            {hours.map((option) => <option key={option.id} value={option.id}>{option.label} / week</option>)}
          </select>
        </div>
        <button type="submit" className="primary-link min-h-12 px-6 py-3">Apply filters</button>
        <Link href="/explore" className="inline-flex min-h-12 items-center justify-center px-3 text-sm font-medium text-muted-foreground underline hover:text-functional-teal">Reset filters</Link>
      </div>
    </Form>
    <section aria-labelledby="opportunities-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="opportunities-heading" className="text-lg font-semibold text-primary">{filtered ? "Search results" : "Published opportunities"}</h2>
        <p className="text-xs text-muted-foreground">{ventures.length === 100 ? "Showing the latest 100 results. Narrow your filters to find more." : `${ventures.length} ${ventures.length === 1 ? "opportunity" : "opportunities"}`}</p>
      </div>
      {!ventures.length ? <DashboardEmpty title={filtered ? "No opportunities match your filters" : "No published opportunities yet"}>
        {filtered ? <>Try another search or <Link href="/explore" className="font-semibold text-functional-teal underline">clear the filters</Link> to see published opportunities.</> : "Opportunities appear here when students publish their ideas. Private drafts stay visible only to their owners."}
      </DashboardEmpty> : <div className="space-y-4">{ventures.map((venture) => <OpportunityCard key={venture.id} venture={venture} sector={sectorNames.get(venture.primarySectorId ?? "") ?? "Student venture"} hours={hourLabels.get(venture.weeklyHoursBand ?? "")} />)}</div>}
    </section>
  </main></StudentShell>;
}
