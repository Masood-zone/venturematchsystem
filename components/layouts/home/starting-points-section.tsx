import { AccountEntryLink, StartingPointsHint } from "@/components/common/account-entry-link";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";

export default function StartingPointsSection() {
  return (
    <section
      className="w-full bg-secondary/70 py-20 md:py-24"
      id="why-venturematch"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-14">
          <span className="font-sans text-xs font-medium uppercase tracking-wider text-functional-teal font-semibold">
            Two Starting Points
          </span>
          <h2 className="font-sans text-2xl sm:text-[32px] leading-tight font-bold text-primary tracking-tight font-bold">
            Different skills. A shared starting point.
          </h2>
          <p className="font-sans text-base text-muted-foreground">
            Complementary abilities help students move an early idea
            forward together. Whether you bring specialized expertise or a
            nascent venture, there is an entry point designed for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-[0_2px_12px_rgba(11,29,58,0.04)] flex flex-col justify-between transition-transform hover:-translate-y-1 duration-200">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/70 text-primary flex items-center justify-center">
                <MaterialSymbol
                  className="text-[26px] text-functional-teal"
                  icon="group_add"
                />
              </div>
              <div>
                <span className="font-sans text-[11px] font-medium uppercase tracking-wide text-functional-teal font-semibold">
                  Option A
                </span>
                <h3 className="font-sans text-2xl font-semibold text-primary font-bold mt-1">
                  Find a team
                </h3>
              </div>
              <p className="font-sans text-base text-muted-foreground leading-relaxed">
                Bring what you know and discover ideas that could use your
                skills.
              </p>
              <div className="pt-4 space-y-2.5">
                <div className="flex items-center gap-2 font-sans text-sm text-foreground">
                  <MaterialSymbol
                    className="text-functional-teal text-[18px]"
                    icon="check_circle"
                  />
                  <span>
                    Contribute specialized knowledge (Design, Tech,
                    Business)
                  </span>
                </div>
                <div className="flex items-center gap-2 font-sans text-sm text-foreground">
                  <MaterialSymbol
                    className="text-functional-teal text-[18px]"
                    icon="check_circle"
                  />
                  <span>
                    Explore existing concepts without pressure to invent
                    one
                  </span>
                </div>
                <div className="flex items-center gap-2 font-sans text-sm text-foreground">
                  <MaterialSymbol
                    className="text-functional-teal text-[18px]"
                    icon="check_circle"
                  />
                  <span>
                    Build collaborative project evidence for your career
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-8">
              <AccountEntryLink
                goal="JOIN_TEAM"
                className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-primary hover:text-functional-teal transition-colors"
                arrow
              >
                <span>Start by contributing skills</span>
              </AccountEntryLink>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-[0_2px_12px_rgba(11,29,58,0.04)] flex flex-col justify-between transition-transform hover:-translate-y-1 duration-200">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/70 text-primary flex items-center justify-center">
                <MaterialSymbol
                  className="text-[26px] text-functional-teal"
                  icon="lightbulb"
                />
              </div>
              <div>
                <span className="font-sans text-[11px] font-medium uppercase tracking-wide text-functional-teal font-semibold">
                  Option B
                </span>
                <h3 className="font-sans text-2xl font-semibold text-primary font-bold mt-1">
                  Build my idea
                </h3>
              </div>
              <p className="font-sans text-base text-muted-foreground leading-relaxed">
                Start with an idea and find students whose strengths
                complement yours.
              </p>
              <div className="pt-4 space-y-2.5">
                <div className="flex items-center gap-2 font-sans text-sm text-foreground">
                  <MaterialSymbol
                    className="text-functional-teal text-[18px]"
                    icon="check_circle"
                  />
                  <span>
                    Articulate the capabilities your early idea needs
                  </span>
                </div>
                <div className="flex items-center gap-2 font-sans text-sm text-foreground">
                  <MaterialSymbol
                    className="text-functional-teal text-[18px]"
                    icon="check_circle"
                  />
                  <span>
                    Meet motivated peers from outside your department
                  </span>
                </div>
                <div className="flex items-center gap-2 font-sans text-sm text-foreground">
                  <MaterialSymbol
                    className="text-functional-teal text-[18px]"
                    icon="check_circle"
                  />
                  <span>
                    Structure transparent, small trial milestones first
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-8">
              <AccountEntryLink
                goal="BUILD_IDEA"
                className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-primary hover:text-functional-teal transition-colors"
                arrow
              >
                <span>Start with your venture idea</span>
              </AccountEntryLink>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm text-muted-foreground font-sans text-xs font-medium">
            <MaterialSymbol
              className="text-functional-teal text-[18px]"
              icon="info"
            />
            <StartingPointsHint />
          </p>
        </div>
      </div>
    </section>
  );
}
