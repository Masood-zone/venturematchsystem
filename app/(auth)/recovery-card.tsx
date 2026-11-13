import type { ReactNode } from "react";
import Link from "next/link";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";

export function RecoveryCard({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <div className="w-full max-w-lg">
      <Link href="/login" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-functional-teal">
        <MaterialSymbol icon="arrow_back" className="text-lg" />
        Back to sign in
      </Link>
      <section className="auth-card space-y-6" aria-labelledby="recovery-title">
        <div className="space-y-4">
          <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-functional-teal">
            <MaterialSymbol icon={icon} className="text-2xl" />
          </span>
          <h1 id="recovery-title" className="text-[28px] font-bold leading-tight tracking-tight text-primary sm:text-[32px]">{title}</h1>
        </div>
        {children}
      </section>
    </div>
  );
}
