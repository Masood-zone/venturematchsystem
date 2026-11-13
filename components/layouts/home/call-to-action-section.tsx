import { AccountEntryLink } from "@/components/common/account-entry-link";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";

export default function CallToActionSection() {
  return (
    <section className="w-full bg-background pb-20 md:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="bg-secondary/70 rounded-3xl p-10 md:p-16 text-center max-w-4xl mx-auto shadow-sm flex flex-col items-center">
          <span className="w-12 h-12 rounded-full bg-functional-teal/10 text-functional-teal flex items-center justify-center mb-6">
            <MaterialSymbol className="text-[24px]" icon="diversity_3" />
          </span>
          <h2 className="font-sans text-2xl sm:text-[32px] leading-tight font-bold text-primary font-bold tracking-tight max-w-xl text-balance">
            Bring your skills. Find your people. Build something together.
          </h2>
          <p className="font-sans text-base text-muted-foreground max-w-lg mt-4 mb-8">
            Join students from all disciplines across USTED Kumasi who are
            turning ideas into collaborative ventures.
          </p>
          <AccountEntryLink
            className="inline-flex items-center justify-center bg-primary text-white font-sans text-sm font-semibold rounded-xl px-8 py-4 hover:bg-primary transition-all shadow-[0_4px_20px_-2px_rgba(11,29,58,0.16)]"
          >
            Get started
          </AccountEntryLink>
        </div>
      </div>
    </section>
  );
}
