"use client";

import { useState, type ComponentProps } from "react";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PasswordField({
  register = false,
  showStrength = register,
  id = "password",
  value,
  placeholder = register ? "Minimum 12 characters" : "Enter your password",
  className,
  "aria-describedby": describedBy,
  ...inputProps
}: Omit<ComponentProps<typeof Input>, "type" | "value"> & {
  register?: boolean;
  showStrength?: boolean;
  value: string;
}) {
  const [visible, setVisible] = useState(false);
  const password = value;
  const strengthId = `${id}-strength`;
  const score =
    Number(password.length >= 12) +
    Number(password.length >= 16) +
    Number(/[A-Z]/.test(password) && /[a-z]/.test(password)) +
    Number(/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password));
  const strength = !password
    ? "Enter password"
    : ["Weak", "Weak", "Fair", "Good", "Strong"][score];

  return (
    <div className="space-y-2">
      <div className="relative">
        {!register && (
          <MaterialSymbol
            icon="lock"
            className="pointer-events-none absolute left-3.5 top-3.5 z-10 text-xl text-muted-foreground/70"
          />
        )}
        <Input
          {...inputProps}
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={register ? "new-password" : "current-password"}
          required
          minLength={register ? 12 : undefined}
          maxLength={register ? 128 : undefined}
          placeholder={placeholder}
          className={`auth-input pr-12 ${register ? "" : "pl-11"} ${className ?? ""}`}
          value={password}
          aria-describedby={
            [describedBy, showStrength ? strengthId : undefined]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute top-0 right-0 size-12 rounded-l-none rounded-r-xl text-muted-foreground hover:text-primary"
        >
          <MaterialSymbol
            icon={visible ? "visibility_off" : "visibility"}
            className="text-xl"
          />
        </Button>
      </div>
      {showStrength && (
        <div id={strengthId} className="space-y-2 pt-1">
          <div className="grid h-1.5 grid-cols-4 gap-1.5" aria-hidden="true">
            {[1, 2, 3, 4].map((bar) => (
              <span
                key={bar}
                className={`rounded-full transition-colors ${password && bar <= Math.max(1, score) ? (score <= 1 ? "bg-destructive" : score === 2 ? "bg-amber-500" : "bg-functional-teal") : "bg-border"}`}
              />
            ))}
          </div>
          <div className="flex justify-between gap-2 text-xs text-muted-foreground">
            <span aria-live="polite">{strength}</span>
            <span>12–128 characters</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function InstitutionalButton({
  register = false,
  onPreview,
}: {
  register?: boolean;
  onPreview: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onPreview}
      className="h-auto min-h-12 w-full gap-2 rounded-xl px-3 py-3 text-center text-xs whitespace-normal sm:gap-3 sm:text-sm"
    >
      {register ? (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
          U
        </span>
      ) : (
        <MaterialSymbol
          icon="vpn_key"
          className="text-xl text-functional-teal"
        />
      )}
      <span>
        {register
          ? "Sign up with USTED Student SSO"
          : "Continue with USTED Institutional Login"}
      </span>
      {register && <MaterialSymbol icon="arrow_forward" className="text-lg" />}
    </Button>
  );
}

export function FormDivider({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
      <span className="h-px flex-1 bg-border" />
      <span>{children}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function PreviewNotice({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite">
      {message && (
        <p className="flex items-start gap-2 rounded-xl border border-functional-teal/15 bg-accent p-3 text-sm text-functional-teal">
          <MaterialSymbol icon="info" className="mt-0.5 text-lg" />
          {message}
        </p>
      )}
    </div>
  );
}
