"use client";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ActionForm({ url, label, method = "PATCH", payload, redirectBase, secondary, onSuccess, children }: {
  url: string; label: string; method?: "PATCH" | "POST";
  payload: (values: FormData) => object; redirectBase?: string; secondary?: boolean; onSuccess?: () => void; children?: ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return <form className="space-y-3" onSubmit={async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload(new FormData(form))),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save. Please retry.");
      onSuccess?.();
      if (redirectBase) router.push(`${redirectBase}/${result.id}`);
      else {
        form.reset();
        router.refresh();
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to save. Please retry.");
    } finally {
      setBusy(false);
    }
  }}>
    {children}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" className="min-h-11 whitespace-normal" disabled={busy} variant={secondary ? "outline" : "default"}>{busy ? "Saving…" : label}</Button>
  </form>;
}
