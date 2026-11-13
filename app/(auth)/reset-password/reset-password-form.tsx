"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { authClient } from "@/services/auth/auth-client";
import { PasswordField } from "../auth-fields";
import { resetPasswordSchema } from "../auth-schemas";

export function ResetPasswordForm({ token }: { token?: string }) {
  const [status, setStatus] = useState<"ready" | "invalid" | "success">("ready");
  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function submit({ password }: { password: string }) {
    if (!token) return;
    try {
      const { error } = await authClient.resetPassword({ token, newPassword: password });
      if (!error) {
        form.reset();
        setStatus("success");
        return;
      }
      if (error.code === "INVALID_TOKEN" || error.code === "USER_NOT_FOUND") {
        form.reset();
        setStatus("invalid");
        return;
      }
    } catch {
      // A network failure uses the same feedback as a server failure.
    }
    form.setError("root", { message: "We couldn’t update your password. Please try again." });
  }

  if (!token || status === "invalid") {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-sm text-muted-foreground">This password reset link is invalid, expired, or has already been used.</p>
        <Link href="/forgot-password" className="primary-link min-h-12 w-full px-4">Request a new reset link</Link>
      </div>
    );
  }

  return (
    <div>
      <div role="status">
        {status === "success" && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-primary">Password updated</h2>
            <p className="text-sm text-muted-foreground">Your previous sessions have ended. Sign in with your new password.</p>
            <Link href="/login" className="primary-link min-h-12 w-full px-4">Sign in</Link>
          </div>
        )}
      </div>
      {status === "ready" && (
        <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-5" aria-busy={isSubmitting}>
          <p className="text-sm leading-relaxed text-muted-foreground">Choose a new password for your VentureMatch account.</p>
          {(["password", "confirmPassword"] as const).map((name) => (
            <Controller
              key={name}
              name={name}
              control={form.control}
              render={({ field, fieldState }) => {
                const isNewPassword = name === "password";
                const id = `reset-${name}`;
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={id}>{isNewPassword ? "New password" : "Confirm new password"}</FieldLabel>
                    <PasswordField
                      {...field}
                      id={id}
                      register
                      showStrength={isNewPassword}
                      placeholder={isNewPassword ? "Enter new password" : "Re-enter new password"}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.invalid ? `${id}-error` : undefined}
                    />
                    {fieldState.invalid && <FieldError id={`${id}-error`} errors={[fieldState.error]} />}
                  </Field>
                );
              }}
            />
          ))}
          {errors.root?.message && <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>}
          <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl">
            {isSubmitting ? "Updating password…" : "Update password"}
          </Button>
        </form>
      )}
    </div>
  );
}
