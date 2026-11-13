import { z } from "zod";
import { stepSchema } from "./onboarding";
import { introductionsSchema } from "./venture-applications";

export const profileSchema = introductionsSchema.extend({
  skills: stepSchema.options[2].shape.skills,
  sectorIds: stepSchema.options[3].shape.sectorIds,
  weeklyHoursBand: stepSchema.options[3].shape.weeklyHoursBand,
  discoverability: z.boolean(),
});
export type ProfileInput = z.infer<typeof profileSchema>;
