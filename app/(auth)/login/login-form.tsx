"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import {
  // FormDivider,
  // InstitutionalButton,
  PasswordField,
  PreviewNotice,
} from "../auth-fields";
import { loginSchema, type LoginValues } from "../auth-schemas";
import { useLogin } from "@/hooks/auth/use-auth";

export default function LoginForm() {
  const [message, setMessage] = useState("");
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
    mode: "onTouched",
  });
  const { mutateAsync: loginAsync, isPending } = useLogin();

  function onSubmit(values: LoginValues) {
    if (isPending) return;
    setMessage("");
    form.clearErrors("root");
    loginAsync(
      {
        email: values.email,
        password: values.password,
        rememberMe: values.remember,
      },
      {
        onError: (error) => {
          setMessage(
            error instanceof Error ? error.message : "An error occurred.",
          );
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* <InstitutionalButton
        onPreview={() =>
          setMessage(
            "Institutional sign-in is not connected in this design preview.",
          )
        }
      />
      <FormDivider>Or password sign in</FormDivider> */}
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit, () => setMessage(""))}
        className="space-y-5"
        aria-busy={isPending}
      >
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-1.5">
              <FieldLabel htmlFor="login-email" className="text-xs">
                Student Email
              </FieldLabel>
              <div className="relative">
                <MaterialSymbol
                  icon="alternate_email"
                  className="pointer-events-none absolute top-3.5 left-3.5 z-10 text-xl text-muted-foreground/70"
                />
                <Input
                  {...field}
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="student@usted.edu.gh"
                  required
                  className="auth-input pl-11"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={
                    fieldState.invalid ? "login-email-error" : undefined
                  }
                />
              </div>
              {fieldState.invalid && (
                <FieldError
                  id="login-email-error"
                  errors={[fieldState.error]}
                />
              )}
            </Field>
          )}
        />
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <FieldLabel htmlFor="login-password" className="text-xs">
                  Password
                </FieldLabel>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-functional-teal hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordField
                {...field}
                id="login-password"
                aria-invalid={fieldState.invalid}
                aria-describedby={
                  fieldState.invalid ? "login-password-error" : undefined
                }
              />
              {fieldState.invalid && (
                <FieldError
                  id="login-password-error"
                  errors={[fieldState.error]}
                />
              )}
            </Field>
          )}
        />
        <Controller
          name="remember"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal" className="items-start gap-2.5">
              <Checkbox
                id="remember-device"
                name={field.name}
                ref={field.ref}
                checked={field.value}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
                className="mt-0.5"
              />
              <FieldLabel
                htmlFor="remember-device"
                className="text-sm font-normal text-muted-foreground"
              >
                Remember this device for 30 days
              </FieldLabel>
            </Field>
          )}
        />
        {form.formState.errors.root?.server?.message ? (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.root?.server?.message}
          </p>
        ) : null}

        <Button
          type="submit"
          className="h-12 w-full gap-2 rounded-xl text-sm font-semibold"
          disabled={isPending}
        >
          {isPending ? "Signing in..." : "Sign in"}
          {!isPending && (
            <MaterialSymbol icon="arrow_forward" className="text-xl" />
          )}
        </Button>
      </form>
      <PreviewNotice message={message} />
    </div>
  );
}
