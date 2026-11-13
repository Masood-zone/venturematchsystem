import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import { applicationDecision, applicationSnapshotSchema, declineReasonSchema, type ApplicationView } from "@/lib/venture-applications";
import type { lockProfile } from "@/services/onboarding/service";
import { StudentServiceError as OnboardingError } from "@/lib/service-error";

const select = {
  id: true, ventureId: true, status: true, message: true, profileSnapshot: true, createdAt: true, respondedAt: true,
  venture: { select: { name: true, status: true } },
} as const;
type Row = Prisma.venture_applicationGetPayload<{ select: typeof select }>;
function view(row: Row): ApplicationView {
  return { id: row.id, ventureId: row.ventureId, ventureName: row.venture.name,
    ventureActive: row.venture.status === "ACTIVE", status: row.status, message: row.message,
    snapshot: applicationSnapshotSchema.parse(JSON.parse(row.profileSnapshot)),
    createdAt: row.createdAt.toISOString(), respondedAt: row.respondedAt?.toISOString() ?? null };
}

// Serialize applications and venture state changes against the same venture row.
async function lockVenture(tx: Prisma.TransactionClient, ventureId: string) {
  await tx.$queryRaw`SELECT id FROM venture WHERE id = ${ventureId} FOR UPDATE`;
  const venture = await tx.venture.findUnique({ where: { id: ventureId } });
  if (!venture) throw new OnboardingError("Venture not found.", 404);
  return venture;
}

type ApplicationReceipt = { userEmail: string; userName: string; ventureName: string };

export function createApplicationService(
  database: PrismaClient,
  profileLocker: typeof lockProfile,
  onSubmitted?: (receipt: ApplicationReceipt) => void,
  onApproved?: (receipt: ApplicationReceipt) => void,
  onDeclined?: (receipt: ApplicationReceipt & { reason: string }) => void,
) {
  async function listVentureApplications(userId: string, ventureId: string) {
    const venture = await database.venture.findUnique({ where: { id: ventureId }, select: { ownerId: true } });
    if (!venture || venture.ownerId !== userId) throw new OnboardingError("Venture not found.", 404);
    return (await database.venture_application.findMany({ where: { ventureId }, select, orderBy: { createdAt: "desc" } })).map(view);
  }
  async function myApplications(userId: string) {
    return (await database.venture_application.findMany({ where: { applicantUserId: userId }, select, orderBy: { createdAt: "desc" } })).map(view);
  }
  async function ownApplication(userId: string, ventureId: string) {
    const row = await database.venture_application.findUnique({ where: { ventureId_applicantUserId: { ventureId, applicantUserId: userId } }, select });
    return row ? view(row) : null;
  }

  async function applyToVenture(userId: string, ventureId: string, message: string) {
    const { application, receipt } = await database.$transaction(async (tx) => {
      const venture = await lockVenture(tx, ventureId);
      if (venture.status !== "ACTIVE") throw new OnboardingError("Venture not found.", 404);
      if (venture.ownerId === userId) throw new OnboardingError("You own this venture.");
      const profile = await profileLocker(tx, userId);
      if (!profile.onboardingCompleted) throw new OnboardingError("Complete your profile before applying.");
      const membership = await tx.venture_member.findUnique({ where: { ventureId_userId: { ventureId, userId } } });
      if (membership?.status === "ACTIVE") throw new OnboardingError("You are already a member.");
      const where = { ventureId_applicantUserId: { ventureId, applicantUserId: userId } };
      const existing = await tx.venture_application.findUnique({ where, select });
      if (existing?.status === "PENDING") return { application: view(existing), receipt: null };
      if (existing && existing.status !== "WITHDRAWN") throw new OnboardingError("This application has already been decided.");
      const [user, availability] = await Promise.all([
        tx.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, email: true } }),
        profile.student_availability?.weeklyHoursBand ? tx.availability_option.findUnique({ where: { id: profile.student_availability.weeklyHoursBand }, select: { label: true } }) : null,
      ]);
      const snapshot = applicationSnapshotSchema.parse({ name: user.name, programme: profile.academic_profile?.programme ?? null,
        skills: profile.student_capability.map((skill) => ({ name: skill.capability.name, proficiency: skill.proficiency })),
        interests: profile.student_venture_interest.map((interest) => interest.venture_sector.name),
        availability: availability?.label ?? null, contributionIntro: profile.contributionIntro ?? "", teamGoals: profile.teamGoals ?? "",
      });
      const data = { message, profileSnapshot: JSON.stringify(snapshot), status: "PENDING" as const, respondedAt: null, createdAt: new Date() };
      const application = view(await tx.venture_application.upsert({ where, create: { ...data, id: randomUUID(), ventureId, applicantUserId: userId }, update: data, select }));
      return {
        application,
        receipt: { userEmail: user.email, userName: user.name, ventureName: venture.name },
      };
    });
    if (receipt) onSubmitted?.(receipt);
    return application;
  }

  async function actOnApplication(userId: string, ventureId: string, applicationId: string, action: "approve" | "decline" | "withdraw", reason?: string) {
    const declineReason = action === "decline" ? declineReasonSchema.safeParse(reason) : null;
    if (declineReason && !declineReason.success) {
      throw new OnboardingError("Enter a valid reason for declining this application.", 400);
    }
    const { result, receipt } = await database.$transaction(async (tx) => {
      const venture = await lockVenture(tx, ventureId);
      const application = await tx.venture_application.findFirst({ where: { id: applicationId, ventureId } });
      if (!application || (venture.ownerId !== userId && application.applicantUserId !== userId)) throw new OnboardingError("Application not found.", 404);
      if (action === "withdraw" ? application.applicantUserId !== userId : venture.ownerId !== userId)
        throw new OnboardingError("You cannot change this application.", 403);
      let status;
      try { status = applicationDecision(application.status, action, venture.ownerId === userId, application.applicantUserId === userId, venture.status === "ACTIVE"); }
      catch (error) { throw new OnboardingError(error instanceof Error ? error.message : "Unable to update application."); }
      if (status === application.status) {
        const current = await tx.venture_application.findUniqueOrThrow({ where: { id: applicationId }, select });
        return { result: view(current), receipt: null };
      }
      const membership = status === "ACCEPTED"
        ? await tx.venture_member.findUnique({ where: { ventureId_userId: { ventureId, userId: application.applicantUserId } } }) : null;
      if (status === "ACCEPTED" && membership?.status !== "ACTIVE") await tx.venture_member.upsert({
        where: { ventureId_userId: { ventureId, userId: application.applicantUserId } },
        create: { id: randomUUID(), ventureId, userId: application.applicantUserId, status: "ACTIVE", membershipType: "TEAM_MEMBER" },
        update: { status: "ACTIVE", membershipType: "TEAM_MEMBER", joinedAt: new Date() },
      });
      const result = view(await tx.venture_application.update({ where: { id: applicationId }, data: { status, respondedAt: new Date() }, select }));
      if (status === "WITHDRAWN") return { result, receipt: null };

      const applicant = await tx.user.findUniqueOrThrow({
        where: { id: application.applicantUserId },
        select: { name: true, email: true },
      });
      return { result, receipt: { userEmail: applicant.email, userName: applicant.name, ventureName: venture.name } };
    });
    if (receipt && action === "approve") onApproved?.(receipt);
    if (receipt && declineReason?.success) onDeclined?.({ ...receipt, reason: declineReason.data });
    return result;
  }

  return { listVentureApplications, myApplications, ownApplication, applyToVenture, actOnApplication };
}
