"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/services/auth/auth-client";
import { forgotPasswordSchema } from "../auth-schemas";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const form = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });
  const { errors, isSubmitting } = form.formState;

  async function submit({ email }: { email: string }) {
    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: new URL("/reset-password", window.location.origin).href,
      });
      if (!error) {
        setSent(true);
        return;
      }
      if (error.status === 429) {
        form.setError("root", { message: "Too many requests. Wait a minute and try again." });
        return;
      }
    } catch {
      // A network failure uses the same feedback as a server failure.
    }
    form.setError("root", { message: "We couldn’t process your request. Please try again." });
  }

  return (
    <div>
      <div role="status">
        {sent && (
          <div className="space-y-2 rounded-xl bg-accent p-4 text-sm text-foreground">
            <h2 className="font-semibold">Check your email</h2>
            <p>If an account exists for that address, you’ll receive a link to reset your password. Check your spam folder if it doesn’t arrive.</p>
          </div>
        )}
      </div>
      {sent && (
        <Button type="button" variant="link" className="mt-3 px-0 text-functional-teal" onClick={() => setSent(false)}>
          Request another link
        </Button>
      )}
      {!sent && (
        <form noValidate className="space-y-5" aria-busy={isSubmitting} onSubmit={form.handleSubmit(submit)}>
          <p className="text-sm leading-relaxed text-muted-foreground">Enter the email address you use for VentureMatch to request a password reset link.</p>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="recovery-email">Student email</FieldLabel>
            <Input
              {...form.register("email")}
              id="recovery-email"
              type="email"
              autoComplete="email"
              placeholder="student@usted.edu.gh"
              className="auth-input"
              required
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "recovery-email-error" : undefined}
            />
            {errors.email && <FieldError id="recovery-email-error" errors={[errors.email]} />}
          </Field>
          {errors.root?.message && <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>}
          <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl">
            {isSubmitting ? "Requesting reset link…" : "Send reset link"}
          </Button>
        </form>
      )}
    </div>
  );
}
