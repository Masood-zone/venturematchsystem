import { MaterialSymbol } from "@/components/common/MaterialSymbol";

export default function HowItWorksSection() {
  return (
    <section
      className="w-full bg-background py-20 md:py-28"
      id="how-it-works"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="max-w-2xl mb-16">
          <span className="font-sans text-xs font-medium uppercase tracking-wider text-functional-teal font-semibold">
            Structured Collaboration
          </span>
          <h2 className="font-sans text-2xl sm:text-[32px] leading-tight font-bold text-primary tracking-tight font-bold mt-1">
            How it works
          </h2>
          <p className="font-sans text-base text-muted-foreground mt-2">
            A low-friction, mutual approach to teaming up across campus
            without premature commitments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_rgba(11,29,58,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="w-9 h-9 rounded-xl bg-primary text-white font-sans text-xl font-semibold font-bold flex items-center justify-center">
                  1
                </span>
                <MaterialSymbol
                  className="text-muted-foreground text-[22px]"
                  icon="person_search"
                />
              </div>
              <h3 className="font-sans text-base font-semibold font-bold text-primary mb-2">
                Discover collaborators
              </h3>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                Set up your skills and interests, then explore ventures
                and people who could complement your strengths.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <span className="font-sans text-[11px] font-medium text-functional-teal font-medium">
                Profile &amp; Search
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_rgba(11,29,58,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="w-9 h-9 rounded-xl bg-primary text-white font-sans text-xl font-semibold font-bold flex items-center justify-center">
                  2
                </span>
                <MaterialSymbol
                  className="text-muted-foreground text-[22px]"
                  icon="chat"
                />
              </div>
              <h3 className="font-sans text-base font-semibold font-bold text-primary mb-2">
                Discuss an idea
              </h3>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                Talk about the idea, the help needed and the time you can
                contribute.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <span className="font-sans text-[11px] font-medium text-functional-teal font-medium">
                Alignment Chat
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_rgba(11,29,58,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="w-9 h-9 rounded-xl bg-primary text-white font-sans text-xl font-semibold font-bold flex items-center justify-center">
                  3
                </span>
                <MaterialSymbol
                  className="text-muted-foreground text-[22px]"
                  icon="flaky"
                />
              </div>
              <h3 className="font-sans text-base font-semibold font-bold text-primary mb-2">
                Try working together
              </h3>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                Agree on a small trial, what each person will contribute
                and when to review it. Everyone accepts the plan before it
                begins.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <span className="font-sans text-[11px] font-medium text-functional-teal font-medium">
                Bound Trial Period
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_rgba(11,29,58,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="w-9 h-9 rounded-xl bg-primary text-white font-sans text-xl font-semibold font-bold flex items-center justify-center">
                  4
                </span>
                <MaterialSymbol
                  className="text-muted-foreground text-[22px]"
                  icon="how_to_reg"
                />
              </div>
              <h3 className="font-sans text-base font-semibold font-bold text-primary mb-2">
                Decide together
              </h3>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                Review the experience privately. Continue as a team when
                all remaining participants agree.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <span className="font-sans text-[11px] font-medium text-functional-teal font-medium">
                Mutual Agreement
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
