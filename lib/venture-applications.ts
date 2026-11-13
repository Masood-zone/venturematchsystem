import { z } from "zod";

export const introductionsSchema = z.object({
  contributionIntro: z.string().trim().max(1000).default(""),
  teamGoals: z.string().trim().max(1000).default(""),
});
export const applicationMessageSchema = z.object({ message: z.string().trim().min(1, "Explain why you want to join.").max(2000) });
export const applicationSubmitSchema = applicationMessageSchema.extend({ shareProfile: z.literal(true, { error: "Confirm that you want to share your application profile." }) });
export const declineReasonMaxLength = 2000;
export const declineReasonSchema = z.string().trim().min(1).max(declineReasonMaxLength);
export const applicationActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("decline"), reason: declineReasonSchema }),
  z.object({ action: z.literal("withdraw") }),
]);
export const applicationStatuses = ["PENDING", "ACCEPTED", "DECLINED", "WITHDRAWN"] as const;
export type ApplicationStatus = typeof applicationStatuses[number];
export const applicationSnapshotSchema = introductionsSchema.extend({
  name: z.string(), programme: z.string().nullable(),
  skills: z.array(z.object({ name: z.string(), proficiency: z.string() })),
  interests: z.array(z.string()), availability: z.string().nullable(),
});
export type ApplicationSnapshot = z.infer<typeof applicationSnapshotSchema>;
export type ApplicationView = {
  id: string; ventureId: string; ventureName: string; ventureActive: boolean;
  status: ApplicationStatus; message: string; snapshot: ApplicationSnapshot;
  createdAt: string; respondedAt: string | null;
};
export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  PENDING: "Awaiting review", ACCEPTED: "Accepted", DECLINED: "Declined", WITHDRAWN: "Withdrawn",
};

export function applicationDecision(status: ApplicationStatus, action: "approve" | "decline" | "withdraw", actorIsOwner: boolean, actorIsApplicant: boolean, active: boolean): ApplicationStatus {
  if (action === "withdraw" ? !actorIsApplicant : !actorIsOwner) throw new Error("You cannot change this application.");
  const target = action === "approve" ? "ACCEPTED" : action === "decline" ? "DECLINED" : "WITHDRAWN";
  if (status === target) return target;
  if (status !== "PENDING") throw new Error("This application has already been decided.");
  if (action === "approve" && !active) throw new Error("This venture is no longer accepting members.");
  return target;
}
