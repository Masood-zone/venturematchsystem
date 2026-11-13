import { z } from "zod";

export const ventureEditorInput = z.object({
  title: z.string().trim().max(100),
  problem: z.string().trim().max(500),
  targetUsers: z.string().trim().max(300),
  sectorId: z.string().max(100),
  contribution: z.string().trim().max(1000),
  capabilityIds: z.array(z.string().min(1).max(100)).max(30),
  stage: z.enum(["IDEA", "VALIDATION", "PROTOTYPE", "EARLY_LAUNCH", "OPERATE"]).optional(),
  weeklyHoursBand: z.string().max(100).optional(),
  step: z.number().int().min(1).max(3),
});

export type VentureEditorInput = z.infer<typeof ventureEditorInput>;
