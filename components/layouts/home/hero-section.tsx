import HeroMessage from "./hero-message";
import { AccountEntryLink } from "@/components/common/account-entry-link";
import Link from "next/link";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-background pt-12 pb-24 md:pt-16 md:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 flex flex-col items-start space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-functional-teal/10 text-functional-teal font-sans text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-functional-teal"></span>
              <span>USTED Kumasi Campus Collaboration</span>
            </div>
            <HeroMessage />
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <AccountEntryLink className="inline-flex items-center justify-center bg-primary text-white font-sans text-sm font-semibold rounded-xl px-7 py-3.5 hover:bg-primary transition-all shadow-[0_4px_20px_-2px_rgba(11,29,58,0.16)]">
                Get started
              </AccountEntryLink>
              <Link
                className="group inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-functional-teal hover:text-primary transition-colors py-3.5 px-2"
                href="#how-it-works"
              >
                <span>See how it works</span>
                <MaterialSymbol
                  className="text-[18px] transition-transform group-hover:translate-x-1"
                  icon="arrow_forward"
                />
              </Link>
            </div>
            <div className="pt-4 flex items-center gap-6 text-muted-foreground font-sans text-[11px] font-medium">
              <div className="flex items-center gap-1.5">
                <MaterialSymbol
                  className="text-functional-teal text-[16px]"
                  icon="verified"
                />
                <span>All disciplines welcome</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MaterialSymbol
                  className="text-functional-teal text-[16px]"
                  icon="handshake"
                />
                <span>Trial-first partnerships</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative mt-8 lg:mt-0">
            <div className="relative bg-white rounded-2xl p-6 md:p-8 shadow-[0_4px_24px_-4px_rgba(11,29,58,0.06)] overflow-hidden">
              <div className="flex flex-wrap gap-3 items-center justify-between pb-6 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center">
                    <MaterialSymbol className="text-[16px]" icon="hub" />
                  </div>
                  <div>
                    <div className="font-sans text-base font-semibold text-primary">
                      Interdisciplinary Hub
                    </div>
                    <div className="font-sans text-xs text-muted-foreground">
                      USTED cross-faculty synergy
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-secondary/70 text-muted-foreground font-sans text-[11px] font-medium">
                  Campus Threads
                </span>
              </div>

              <div className="relative py-8 my-2">
                <div className="relative z-10 mx-auto w-48 bg-primary text-white rounded-xl p-4 text-center shadow-md">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-functional-teal/20 text-teal-200 text-[10px] font-semibold tracking-wide uppercase mb-1">
                    Example Concept
                  </span>
                  <h2 className="font-sans text-base font-semibold font-bold text-white">
                    Campus Threads
                  </h2>
                  <p className="font-sans text-[11px] font-medium text-slate-300 mt-0.5">
                    Sustainable apparel &amp; student workwear
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6">
                  <div className="bg-secondary/70 rounded-xl p-3 flex flex-col gap-1 transition-all hover:bg-secondary">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase text-functional-teal">
                        Fashion
                      </span>
                      <MaterialSymbol
                        className="text-muted-foreground text-[16px]"
                        icon="styler"
                      />
                    </div>
                    <div className="font-sans text-xs font-medium text-primary font-semibold">
                      Making &amp; Patterning
                    </div>
                    <div className="font-sans text-xs text-muted-foreground line-clamp-1">
                      Garment construction
                    </div>
                  </div>

                  <div className="bg-secondary/70 rounded-xl p-3 flex flex-col gap-1 transition-all hover:bg-secondary">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase text-functional-teal">
                        Business
                      </span>
                      <MaterialSymbol
                        className="text-muted-foreground text-[16px]"
                        icon="query_stats"
                      />
                    </div>
                    <div className="font-sans text-xs font-medium text-primary font-semibold">
                      Planning &amp; Finance
                    </div>
                    <div className="font-sans text-xs text-muted-foreground line-clamp-1">
                      Cost unit economics
                    </div>
                  </div>

                  <div className="bg-secondary/70 rounded-xl p-3 flex flex-col gap-1 transition-all hover:bg-secondary">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase text-functional-teal">
                        Technology
                      </span>
                      <MaterialSymbol
                        className="text-muted-foreground text-[16px]"
                        icon="devices"
                      />
                    </div>
                    <div className="font-sans text-xs font-medium text-primary font-semibold">
                      Digital Platform
                    </div>
                    <div className="font-sans text-xs text-muted-foreground line-clamp-1">
                      Pre-order checkout flow
                    </div>
                  </div>

                  <div className="bg-secondary/70 rounded-xl p-3 flex flex-col gap-1 transition-all hover:bg-secondary">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase text-functional-teal">
                        Production
                      </span>
                      <MaterialSymbol
                        className="text-muted-foreground text-[16px]"
                        icon="precision_manufacturing"
                      />
                    </div>
                    <div className="font-sans text-xs font-medium text-primary font-semibold">
                      Material Sourcing
                    </div>
                    <div className="font-sans text-xs text-muted-foreground line-clamp-1">
                      Local textile logistics
                    </div>
                  </div>

                  <div className="bg-secondary/70 rounded-xl p-3 flex flex-col gap-1 transition-all hover:bg-secondary">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase text-functional-teal">
                        Hospitality
                      </span>
                      <MaterialSymbol
                        className="text-muted-foreground text-[16px]"
                        icon="groups"
                      />
                    </div>
                    <div className="font-sans text-xs font-medium text-primary font-semibold">
                      Customer Research
                    </div>
                    <div className="font-sans text-xs text-muted-foreground line-clamp-1">
                      Campus pop-up trials
                    </div>
                  </div>

                  <div className="bg-secondary/70 rounded-xl p-3 flex flex-col gap-1 transition-all hover:bg-secondary">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase text-functional-teal">
                        Education
                      </span>
                      <MaterialSymbol
                        className="text-muted-foreground text-[16px]"
                        icon="school"
                      />
                    </div>
                    <div className="font-sans text-xs font-medium text-primary font-semibold">
                      Teaching &amp; Impact
                    </div>
                    <div className="font-sans text-xs text-muted-foreground line-clamp-1">
                      Student repair clinics
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-functional-teal"></span>
                  <span className="font-sans text-[11px] font-medium font-medium">
                    Example collaboration across disciplines
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-sans text-[11px] font-medium text-functional-teal">
                  <MaterialSymbol className="text-[14px]" icon="tune" />
                  <span>Trial period: 2 weeks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
