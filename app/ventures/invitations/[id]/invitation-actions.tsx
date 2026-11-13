"use client";
import { useEffect, useRef, useState } from "react";
import { ActionForm } from "@/components/ventures/action-form";
import { fieldClass } from "@/components/ventures/workspace-styles";

export function InvitationActions({ id, owner, active }: { id: string; owner: boolean; active: boolean }) {
  const url = `/api/ventures/invitations/${id}`;
  return <div className="flex flex-wrap gap-3">
    {owner ? <ActionForm url={url} label="Withdraw invitation" secondary payload={() => ({ action: "withdraw" })} /> : <>
      {active && <ActionForm url={url} label="Accept interest" payload={() => ({ action: "interest" })} />}
      <ActionForm url={url} label="Decline invitation" secondary payload={() => ({ action: "decline" })} />
    </>}
  </div>;
}

export function DiscussionForm({ id }: { id: string }) {
  const previous = useRef<{ id: string; text: string } | null>(null);
  return <ActionForm url={`/api/ventures/invitations/${id}`} label="Send message" onSuccess={() => { previous.current = null; }} payload={(values) => {
    const text = String(values.get("text")).trim();
    if (previous.current?.text !== text) previous.current = { id: crypto.randomUUID(), text };
    return { action: "message", ...previous.current };
  }}>
    <label className="grid gap-2">Message<textarea className={fieldClass} name="text" required maxLength={2000} /></label>
  </ActionForm>;
}

export function MarkDiscussionRead({ id, messageId }: { id: string; messageId: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/ventures/invitations/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", messageId }), signal: controller.signal,
    }).then((response) => setFailed(!response.ok)).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, [id, messageId]);
  return failed ? <p role="status" className="text-sm text-muted-foreground">Could not update unread status. Reload to retry.</p> : null;
}
