import { Suspense } from "react";

import AuthSwitchLink from "@/components/common/auth-switch-link";

import type { Metadata } from "next";


import { MaterialSymbol } from "@/components/common/MaterialSymbol";

import RegisterForm from "./register-form";



export const metadata: Metadata = { title: "Create account" };



export default function RegisterPage() {

  return (

    <div className="w-full max-w-[560px]">

      <div className="auth-card space-y-7">

        <div className="space-y-3.5">

          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-[11px] font-medium text-functional-teal sm:text-xs"><MaterialSymbol icon="swap_horiz" className="text-base" /><span>One account to join teams or launch your own idea</span></div>

          <h1 className="text-[28px] leading-tight font-bold tracking-tight text-primary sm:text-[32px]">Create your student account</h1>

          <p className="text-sm leading-relaxed text-muted-foreground">Join USTED students across disciplines collaborating on early ventures, campus projects, and complementary ideas.</p>

        </div>

        <Suspense fallback={<p role="status">Loading form…</p>}><RegisterForm /></Suspense>

        <div className="flex items-start gap-3 rounded-xl bg-secondary/70 p-4"><MaterialSymbol icon="info" className="mt-0.5 text-xl text-functional-teal" /><div className="space-y-1"><p className="text-xs font-semibold">Next step preview</p><p className="text-xs leading-relaxed text-muted-foreground">Choose your first goal (<span className="font-medium text-foreground">Find a team</span> or <span className="font-medium text-foreground">Build my idea</span>) and set up your initial skill competencies.</p></div></div>

        <p className="text-center text-sm text-muted-foreground">Already have an account? <Suspense fallback={<span>Continue with your account</span>}><AuthSwitchLink href="/login" className="font-semibold text-functional-teal hover:underline">Sign in</AuthSwitchLink></Suspense></p>

      </div>

    </div>

  );

}
