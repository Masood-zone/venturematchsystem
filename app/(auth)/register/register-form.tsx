"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Combobox } from "@base-ui/react/combobox";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import {
  // FormDivider,
  // InstitutionalButton,
  PasswordField,
  PreviewNotice,
} from "../auth-fields";
import {
  registerSchema,
  type RegisterValues,
} from "../auth-schemas";
import { useRegister } from "@/hooks/auth/use-auth";

export default function RegisterForm() {
  const catalogue = useQuery({ queryKey: ["programmes"], queryFn: async () => {
    const response = await fetch("/api/programmes");
    if (!response.ok) throw new Error("Programmes are unavailable. Please retry.");
    return (await response.json() as { programmes: string[] }).programmes;
  } });
  const programmes = catalogue.data ?? [];
  const [message, setMessage] = useState("");
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      programme: "",
      password: "",
      confirmPassword: "",
      agreement: false,
    },
    mode: "onTouched",
  });
  const { mutate: register, isPending } = useRegister();

  function onSubmit(values: RegisterValues) {
    if (isPending) return;
    register(
      {
        name: values.name,
        email: values.email,
        programme: values.programme,
        password: values.password,
      },
      {
        onError: (error) => {
          setMessage(error.message);
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* <InstitutionalButton
        register
        onPreview={() =>
          setMessage("Student SSO is not connected in this design preview.")
        }
      />
      <FormDivider>Or register with email</FormDivider> */}
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit, () => setMessage(""))}
        className="space-y-5"
      >
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-1.5">
              <FieldLabel htmlFor="register-name" className="text-xs">
                Full Name
              </FieldLabel>
              <Input
                {...field}
                id="register-name"
                autoComplete="name"
                placeholder="e.g. Kwame Mensah"
                required
                className="auth-input"
                aria-invalid={fieldState.invalid}
                aria-describedby={
                  fieldState.invalid ? "register-name-error" : undefined
                }
              />
              {fieldState.invalid && (
                <FieldError
                  id="register-name-error"
                  errors={[fieldState.error]}
                />
              )}
            </Field>
          )}
        />
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-1.5">
              <FieldLabel htmlFor="register-email" className="text-xs">
                Institutional Email
              </FieldLabel>
              <Input
                {...field}
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="student.id@usted.edu.gh"
                required
                className="auth-input"
                aria-invalid={fieldState.invalid}
                aria-describedby={`register-email-hint${fieldState.invalid ? " register-email-error" : ""}`}
              />
              <FieldDescription id="register-email-hint" className="text-xs">
                Use your university email to help identify your campus
                community.
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError
                  id="register-email-error"
                  errors={[fieldState.error]}
                />
              )}
            </Field>
          )}
        />
        <Controller
          name="programme"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-1.5">
              <FieldLabel htmlFor="register-programme" className="text-xs">
                Academic Programme (Kumasi Campus)
              </FieldLabel>
              <Combobox.Root
                items={programmes}
                name={field.name}
                value={field.value || null}
                onValueChange={(value) => field.onChange(value ?? "")}
              >
                <Combobox.InputGroup className="relative min-w-0">
                  <Combobox.Input
                    render={<Input />}
                    id="register-programme"
                    disabled={catalogue.isPending || catalogue.isError}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    placeholder="Search your programme..."
                    autoComplete="off"
                    className="auth-input w-full pr-12 text-base md:text-sm"
                    aria-required="true"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={`register-programme-hint${fieldState.invalid ? " register-programme-error" : ""}`}
                  />
                  <Combobox.Trigger
                    aria-label="Show programmes"
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <MaterialSymbol icon="unfold_more" className="text-xl" />
                  </Combobox.Trigger>
                </Combobox.InputGroup>
                <Combobox.Portal>
                  <Combobox.Positioner
                    sideOffset={6}
                    align="start"
                    className="z-50 max-w-[calc(100vw-2rem)]"
                  >
                    <Combobox.Popup className="w-(--anchor-width) max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
                      <Combobox.Empty
                        className="px-4 py-5 text-sm text-muted-foreground empty:hidden"
                        role="status"
                      >
                        No programmes found. Try another search.
                      </Combobox.Empty>
                      <Combobox.List className="max-h-[min(20rem,40dvh,var(--available-height))] overflow-y-auto overscroll-contain p-1">
                        {(programme: string) => (
                          <Combobox.Item
                            key={programme}
                            value={programme}
                            className="flex min-h-12 cursor-pointer items-center gap-2 rounded-lg px-3 py-3 text-sm leading-relaxed outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-selected:font-medium"
                          >
                            <span className="min-w-0 flex-1 whitespace-normal wrap-break-word">
                              {programme}
                            </span>
                            <Combobox.ItemIndicator>
                              <MaterialSymbol
                                icon="check"
                                className="text-lg text-functional-teal"
                              />
                            </Combobox.ItemIndicator>
                          </Combobox.Item>
                        )}
                      </Combobox.List>
                    </Combobox.Popup>
                  </Combobox.Positioner>
                </Combobox.Portal>
              </Combobox.Root>
              <FieldDescription
                id="register-programme-hint"
                className="text-xs"
              >
                Programme provides context, never a barrier to collaboration.
              </FieldDescription>
              {catalogue.isPending && <p role="status" className="text-xs">Loading programmes…</p>}
              {catalogue.isError && <p role="alert" className="text-xs text-destructive">Programmes are unavailable. <button type="button" className="underline" onClick={() => catalogue.refetch()}>Retry</button></p>}
              {fieldState.invalid && (
                <FieldError
                  id="register-programme-error"
                  errors={[fieldState.error]}
                />
              )}
            </Field>
          )}
        />
        <Controller
          name="password"
          control={form.control}
          rules={{ deps: "confirmPassword" }}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-1.5">
              <FieldLabel htmlFor="register-password" className="text-xs">
                Create Password
              </FieldLabel>
              <PasswordField
                {...field}
                register
                id="register-password"
                aria-invalid={fieldState.invalid}
                aria-describedby={
                  fieldState.invalid ? "register-password-error" : undefined
                }
              />
              {fieldState.invalid && (
                <FieldError
                  id="register-password-error"
                  errors={[fieldState.error]}
                />
              )}
            </Field>
          )}
        />
        <Controller
          name="confirmPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-1.5">
              <FieldLabel
                htmlFor="register-confirm-password"
                className="text-xs"
              >
                Confirm Password
              </FieldLabel>
              <PasswordField
                {...field}
                register
                showStrength={false}
                id="register-confirm-password"
                placeholder="Re-enter your password"
                aria-invalid={fieldState.invalid}
                aria-describedby={
                  fieldState.invalid
                    ? "register-confirm-password-error"
                    : undefined
                }
              />
              {fieldState.invalid && (
                <FieldError
                  id="register-confirm-password-error"
                  errors={[fieldState.error]}
                />
              )}
            </Field>
          )}
        />
        <Controller
          name="agreement"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-1.5">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="collaboration-agreement"
                  name={field.name}
                  ref={field.ref}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-required="true"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={
                    fieldState.invalid ? "register-agreement-error" : undefined
                  }
                  className="mt-0.5"
                />
                <FieldLabel
                  htmlFor="collaboration-agreement"
                  className="text-xs leading-relaxed font-normal text-muted-foreground"
                >
                  I agree to collaborate respectfully and follow the student
                  collaboration guidelines.
                </FieldLabel>
              </div>
              {fieldState.invalid && (
                <FieldError
                  id="register-agreement-error"
                  errors={[fieldState.error]}
                />
              )}
            </Field>
          )}
        />
        <Button
          type="submit"
          disabled={isPending || catalogue.isPending || catalogue.isError}
          className="h-12 w-full gap-2 rounded-xl text-sm font-semibold"
        >
          Create account
          <MaterialSymbol icon="check_circle" className="text-lg" />
        </Button>
      </form>
      <PreviewNotice message={message} />
    </div>
  );
}
