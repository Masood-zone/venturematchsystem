import Link from "next/link";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { ventureStageLabels } from "@/lib/venture-dashboard";
import type { publishedVentures } from "@/services/onboarding/discovery";

type Opportunity = Awaited<ReturnType<typeof publishedVentures>>[number];

export default function OpportunityCard({ venture, sector, hours }: { venture: Opportunity; sector: string; hours?: string }) {
  return <article className="grid gap-6 rounded-2xl border border-primary/5 bg-white p-5 shadow-sm sm:p-7 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] lg:items-center">
    <div className="min-w-0">
      <p className="mb-3 inline-block rounded-full bg-accent px-3 py-1 text-xs font-medium text-functional-teal">{sector}</p>
      <h2 className="wrap-anywhere text-xl font-bold tracking-tight text-primary"><Link href={`/ventures/${venture.id}`} className="hover:underline">{venture.name}</Link></h2>
      <p className="mt-2 line-clamp-3 wrap-anywhere text-sm leading-6 text-muted-foreground">{venture.problem}</p>
      <p className="mt-3 text-xs text-muted-foreground">By {venture.user.name}</p>
    </div>
    <div className="min-w-0 space-y-4">
      <div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Help needed</p>
        <ul className="mt-2 flex flex-wrap gap-2">{venture.venture_capability_requirement.map(({ capability }) => <li key={capability.id} className="max-w-full wrap-anywhere rounded-lg bg-secondary px-2.5 py-1.5 text-xs">{capability.name}</li>)}</ul>
        {!venture.venture_capability_requirement.length && <p className="mt-2 text-sm text-muted-foreground">See the opportunity brief</p>}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><MaterialSymbol icon="trending_up" className="text-lg text-functional-teal" />{ventureStageLabels[venture.stage]}</span>
        {hours && <span className="inline-flex items-center gap-1.5"><MaterialSymbol icon="schedule" className="text-lg" />{hours} / week</span>}
      </div>
    </div>
    <Link href={`/ventures/${venture.id}`} className="primary-link min-h-12 px-5 py-3">View opportunity<MaterialSymbol icon="arrow_forward" className="text-lg" /></Link>
  </article>;
}
