import { z } from "zod";

export const invitationInput = z.object({
  candidateId: z.string().min(1).max(100),
  role: z.string().trim().min(1).max(100),
  message: z.string().trim().min(1).max(2000),
  commitment: z.enum(["CASUAL", "SIDE_VENTURE", "SERIOUS", "FULL_TIME"]).optional(),
});

export const invitationAction = z.discriminatedUnion("action", [
  z.object({ action: z.literal("interest") }),
  z.object({ action: z.literal("decline") }),
  z.object({ action: z.literal("withdraw") }),
  z.object({ action: z.literal("read"), messageId: z.string().min(1).max(191) }),
  z.object({ action: z.literal("message"), id: z.uuid(), text: z.string().trim().min(1).max(2000) }),
]);
