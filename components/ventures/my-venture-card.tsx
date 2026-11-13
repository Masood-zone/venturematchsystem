import Link from "next/link";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { ventureStageLabels, ventureStatusLabels } from "@/lib/venture-dashboard";
import type { MyVenture } from "@/services/ventures/dashboard";

export default function MyVentureCard({ venture, owned, onboardingIdea }: { venture: MyVenture; owned: boolean; onboardingIdea: boolean }) {
  const canView = owned || venture.status === "ACTIVE";
  const draft = venture.status === "DRAFT";
  const role = venture.venture_member[0]?.roleTitle;
  return <article className={`flex flex-col gap-5 rounded-2xl border bg-white p-5 shadow-sm sm:p-7 lg:flex-row lg:items-center ${onboardingIdea ? "border-functional-teal/30" : "border-primary/5"}`}>
    <div className="flex min-w-0 flex-1 items-start gap-4">
      <span className={`hidden size-16 shrink-0 items-center justify-center rounded-2xl sm:flex ${draft ? "bg-secondary text-muted-foreground" : "bg-accent text-functional-teal"}`}><MaterialSymbol icon={draft ? "edit_document" : "rocket_launch"} className="text-3xl" /></span>
      <div className="min-w-0 flex-1">
        {onboardingIdea && <p className="mb-2 text-xs font-semibold text-functional-teal">Your onboarding idea</p>}
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="max-w-full wrap-anywhere text-lg font-bold text-primary">{venture.name || "Untitled idea"}</h3>
          <span className={`rounded-full px-2.5 py-1 text-xs ${draft ? "bg-amber-50 text-amber-900" : "bg-accent text-functional-teal"}`}>{ventureStatusLabels[venture.status]}</span>
          {venture.venture_sector_venture_primarySectorIdToventure_sector && <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">{venture.venture_sector_venture_primarySectorIdToventure_sector.name}</span>}
        </div>
        <p className="mt-2 line-clamp-2 wrap-anywhere text-sm leading-6 text-muted-foreground">{venture.shortPitch || venture.problem || "Your idea is saved. Continue setup to complete its brief."}</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><MaterialSymbol icon="trending_up" className="text-lg" />{ventureStageLabels[venture.stage]}</span>
          {!draft && <span className="inline-flex items-center gap-1.5"><MaterialSymbol icon="group" className="text-lg" />{venture._count.venture_member} active {venture._count.venture_member === 1 ? "member" : "members"}</span>}
          {owned && !draft && <Link href={`/ventures/${venture.id}#applications`} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-functional-teal underline">{venture._count.applications} pending applications</Link>}
          {draft && <span className="inline-flex items-center gap-1.5"><MaterialSymbol icon="lock" className="text-lg" />Only visible to you</span>}
          {!owned && role && <span>Your role: {role}</span>}
        </div>
      </div>
    </div>
    {canView ? <Link href={`/ventures/${venture.id}${draft ? "/edit" : ""}`} className={`${draft ? "primary-link" : "inline-flex items-center justify-center gap-2 rounded-xl bg-secondary text-primary hover:bg-muted"} min-h-12 shrink-0 px-5 py-3 text-sm font-semibold`}>
      {draft ? "Resume draft" : "View venture"}<MaterialSymbol icon="arrow_forward" className="text-lg" />
    </Link> : <p className="text-xs text-muted-foreground lg:max-w-44">This venture is not currently published.</p>}
  </article>;
}
