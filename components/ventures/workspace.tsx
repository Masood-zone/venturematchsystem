import Link from "next/link";
import type { ReactNode } from "react";
import StudentShell from "@/components/onboarding/student-shell";
import { linkClass } from "./workspace-styles";

export { panelClass, linkClass } from "./workspace-styles";

export function Workspace({ title, back, children }: { title: string; back?: { label: string; href: string }; children: ReactNode }) {
  return <StudentShell><main id="main-content" className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-8 sm:py-12">
    <header className="space-y-2">
      {back && <Link href={back.href} className={linkClass}>{back.label}</Link>}
      <h1 className="wrap-anywhere text-3xl font-bold tracking-tight text-primary sm:text-4xl">{title}</h1>
    </header>
    {children}
  </main></StudentShell>;
}
