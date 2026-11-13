import "server-only";
import { db } from "@/lib/db";
import { lockProfile } from "@/services/onboarding/service";
import { createApplicationService } from "./application-service";
import { scheduleEmail } from "@/services/email/schedule-email";

export const { listVentureApplications, myApplications, ownApplication, applyToVenture, actOnApplication } = createApplicationService(
  db,
  lockProfile,
  (receipt) => scheduleEmail({ kind: "application", ...receipt }),
  (receipt) => scheduleEmail({ kind: "application-approved", ...receipt }),
  (receipt) => scheduleEmail({ kind: "application-declined", ...receipt }),
);
