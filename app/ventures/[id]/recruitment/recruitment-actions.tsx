"use client";
import { ActionForm } from "@/components/ventures/action-form";
import { fieldClass } from "@/components/ventures/workspace-styles";

export function CandidateInvitation({ ventureId, candidateId }: { ventureId: string; candidateId: string }) {
  return <details className="rounded-xl bg-secondary p-4">
    <summary className="cursor-pointer font-semibold">Compose invitation to discuss</summary>
    <div className="mt-4">
      <ActionForm url={`/api/ventures/${ventureId}/invitations`} method="POST" label="Send invitation" redirectBase="/ventures/invitations" payload={(values) => ({
        candidateId, role: values.get("role"), message: values.get("message"), commitment: values.get("commitment") || undefined,
      })}>
        <label className="grid gap-2">Proposed role<input className={fieldClass} name="role" required maxLength={100} /></label>
        <label className="grid gap-2">Expected commitment<select className={fieldClass} name="commitment">
          <option value="">Discuss with candidate</option><option value="CASUAL">Casual</option><option value="SIDE_VENTURE">Side venture</option><option value="SERIOUS">Serious</option><option value="FULL_TIME">Full time</option>
        </select></label>
        <label className="grid gap-2">Invitation message<textarea className={fieldClass} name="message" required maxLength={2000} /></label>
      </ActionForm>
    </div>
  </details>;
}
