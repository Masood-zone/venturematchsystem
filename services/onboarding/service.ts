import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { studentDestination } from "@/lib/student-destination";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  normalizeSkill,
  parseDrafts,
  readDraft,
  stepsFor,
  type StepDraftInput,
  type StepInput,
} from "@/lib/onboarding";

type Tx = Prisma.TransactionClient;
export { StudentServiceError as OnboardingError } from "@/lib/service-error";
import { StudentServiceError as OnboardingError } from "@/lib/service-error";
const profileInclude = {
  academic_profile: true,
  student_capability: { include: { capability: true } },
  student_venture_interest: { include: { venture_sector: true } },
  student_availability: true,
  onboardingVenture: {
    include: {
      venture_capability_requirement: { include: { capability: true } },
    },
  },
} as const;

export async function loadOnboarding(userId: string) {
  const [profile, families, skills, sectors, availability] = await Promise.all([
    db.student_profile.findUnique({
      where: { userId },
      include: profileInclude,
    }),
    db.capability_family.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    db.capability.findMany({
      where: { status: "ACTIVE", capability_family: { status: "ACTIVE" } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, familyId: true },
    }),
    db.venture_sector.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    db.availability_option.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, label: true },
    }),
  ]);
  if (
    !families.length ||
    !skills.length ||
    !sectors.length ||
    !availability.length
  ) {
    throw new OnboardingError(
      "The setup catalogue is unavailable. Please try again shortly.",
      503,
    );
  }
  const idea = profile?.onboardingVenture;
  const drafts = parseDrafts(profile?.onboardingDraftJson);
  return {
    completed: profile?.onboardingCompleted ?? false,
    contributionIntro: profile?.contributionIntro ?? "",
    teamGoals: profile?.teamGoals ?? "",
    drafts,
    goal: profile?.onboardingGoal ?? null,
    step: profile?.onboardingStep ?? "goal",
    programme: profile?.academic_profile?.programme ?? null,
    skills:
      profile?.student_capability.map((row) => ({
        id: row.capabilityId,
        name: row.capability.name,
        proficiency: row.proficiency,
      })) ?? [],
    sectorIds:
      profile?.student_venture_interest.map((row) => row.sectorId) ?? [],
    weeklyHoursBand: profile?.student_availability?.weeklyHoursBand ?? "",
    discoverability: profile?.onboardingCompleted
      ? profile.discoverability
      : (readDraft(drafts, "review")?.discoverability ?? true),
    idea: idea
      ? {
          id: idea.id,
          title: idea.name,
          problem: idea.problem ?? "",
          targetUsers: idea.targetUsers ?? "",
          sectorId: idea.primarySectorId ?? "",
          contribution: idea.recruitmentContribution ?? "",
          capabilityIds: idea.venture_capability_requirement.map(
            (row) => row.capabilityId,
          ),
          status: idea.status,
        }
      : null,
    catalogues: { families, skills, sectors, availability },
  };
}
export type OnboardingState = Awaited<ReturnType<typeof loadOnboarding>>;

export async function lockProfile(tx: Tx, userId: string) {
  return tx.student_profile.upsert({
    where: { userId },
    create: {
      id: randomUUID(),
      userId,
      updatedAt: new Date(),
      onboardingStep: "goal",
      discoverability: false,
    },
    update: { updatedAt: new Date() },
    include: profileInclude,
  });
}
function requireCondition(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) throw new OnboardingError(message);
}
export async function activeSkills(tx: Tx, ids: string[]) {
  requireCondition(
    new Set(ids).size === ids.length,
    "Choose each skill only once.",
  );
  const count = await tx.capability.count({
    where: {
      id: { in: ids },
      status: "ACTIVE",
      capability_family: { status: "ACTIVE" },
    },
  });
  requireCondition(
    count === ids.length,
    "One of these skills is no longer available. Please choose another.",
  );
}
export async function activeSectors(tx: Tx, ids: string[]) {
  requireCondition(
    new Set(ids).size === ids.length,
    "Choose each interest only once.",
  );
  const count = await tx.venture_sector.count({
    where: { id: { in: ids }, status: "ACTIVE" },
  });
  requireCondition(
    count === ids.length,
    "One of these sectors is no longer available. Please choose another.",
  );
}

export async function saveStep(
  userId: string,
  input: StepInput,
  advance: boolean,
) {
  await db.$transaction(
    async (tx) => {
      const profile = await lockProfile(tx, userId);
      requireCondition(
        !profile.onboardingCompleted,
        "Your onboarding is already complete.",
      );
      requireCondition(
        input.step === "goal" || profile.onboardingGoal,
        "Choose your starting goal first.",
      );
      const now = new Date();
      const drafts = parseDrafts(profile.onboardingDraftJson);
      delete drafts[input.step];
      if (input.step === "goal") {
        await tx.student_profile.update({
          where: { id: profile.id },
          data: { onboardingGoal: input.goal },
        });
      } else if (input.step === "idea") {
        requireCondition(
          profile.onboardingGoal === "BUILD_IDEA",
          "Choose Build my idea before saving an idea.",
        );
        await activeSectors(tx, [input.sectorId]);
        const data = {
          name: input.title,
          problem: input.problem,
          targetUsers: input.targetUsers,
          primarySectorId: input.sectorId,
          updatedAt: now,
        };
        if (profile.onboardingVentureId) {
          requireCondition(
            profile.onboardingVenture?.ownerId === userId &&
              profile.onboardingVenture.status === "DRAFT",
            "This idea is no longer an editable draft.",
          );
          await tx.venture.update({
            where: { id: profile.onboardingVentureId },
            data,
          });
        } else {
          const id = randomUUID();
          await tx.venture.create({
            data: { id, ownerId: userId, slug: `idea-${id}`, ...data },
          });
          await tx.student_profile.update({
            where: { id: profile.id },
            data: { onboardingVentureId: id },
          });
        }
      } else if (input.step === "skills") {
        await activeSkills(
          tx,
          input.skills.map((row) => row.id),
        );
        // EXPERT may be retained, never newly self-assigned by the three-level form.
        for (const skill of input.skills) {
          requireCondition(
            skill.proficiency !== "EXPERT" ||
              profile.student_capability.some(
                (row) =>
                  row.capabilityId === skill.id && row.proficiency === "EXPERT",
              ),
            "Choose Learning, Practising or Experienced for a new skill.",
          );
          await tx.student_capability.upsert({
            where: {
              studentProfileId_capabilityId: {
                studentProfileId: profile.id,
                capabilityId: skill.id,
              },
            },
            create: {
              id: randomUUID(),
              studentProfileId: profile.id,
              capabilityId: skill.id,
              proficiency: skill.proficiency,
              updatedAt: now,
            },
            update: { proficiency: skill.proficiency, updatedAt: now },
          });
        }
        await tx.student_capability.deleteMany({
          where: {
            studentProfileId: profile.id,
            capabilityId: { notIn: input.skills.map((row) => row.id) },
          },
        });
      } else if (input.step === "interests") {
        await activeSectors(tx, input.sectorIds);
        requireCondition(
          await tx.availability_option.count({
            where: { id: input.weeklyHoursBand, active: true },
          }),
          "Choose an available weekly time band.",
        );
        for (const sectorId of input.sectorIds)
          await tx.student_venture_interest.upsert({
            where: {
              studentProfileId_sectorId: {
                studentProfileId: profile.id,
                sectorId,
              },
            },
            create: {
              id: randomUUID(),
              studentProfileId: profile.id,
              sectorId,
              strength: 1,
            },
            update: { strength: 1 },
          });
        await tx.student_venture_interest.deleteMany({
          where: {
            studentProfileId: profile.id,
            sectorId: { notIn: input.sectorIds },
          },
        });
        await tx.student_availability.upsert({
          where: { studentProfileId: profile.id },
          create: {
            id: randomUUID(),
            studentProfileId: profile.id,
            weeklyHoursBand: input.weeklyHoursBand,
            updatedAt: now,
          },
          update: { weeklyHoursBand: input.weeklyHoursBand, updatedAt: now },
        });
      } else if (input.step === "needs") {
        requireCondition(
          profile.onboardingGoal === "BUILD_IDEA" &&
            profile.onboardingVenture?.ownerId === userId &&
            profile.onboardingVenture.status === "DRAFT",
          "Save your private idea first.",
        );
        await activeSkills(tx, input.capabilityIds);
        const ventureId = profile.onboardingVenture.id;
        for (const capabilityId of input.capabilityIds)
          await tx.venture_capability_requirement.upsert({
            where: { ventureId_capabilityId: { ventureId, capabilityId } },
            create: {
              id: randomUUID(),
              ventureId,
              capabilityId,
              confirmed: true,
            },
            update: { confirmed: true },
          });
        await tx.venture_capability_requirement.deleteMany({
          where: { ventureId, capabilityId: { notIn: input.capabilityIds } },
        });
        await tx.venture.update({
          where: { id: ventureId },
          data: { recruitmentContribution: input.contribution, updatedAt: now },
        });
      }
      if (input.step === "review") {
        await tx.student_profile.update({ where: { id: profile.id }, data: {
          contributionIntro: input.contributionIntro, teamGoals: input.teamGoals,
        } });
      }
      const goal = input.step === "goal" ? input.goal : profile.onboardingGoal;
      const steps = stepsFor(goal);
      const index = steps.indexOf(input.step);
      requireCondition(
        index !== -1,
        "This step does not belong to your selected journey.",
      );
      await tx.student_profile.update({
        where: { id: profile.id },
        data: {
          onboardingStep: advance
            ? steps[Math.min(index + 1, steps.length - 1)]
            : input.step,
          updatedAt: now,
          onboardingDraftJson: JSON.stringify(drafts),
          // Visibility takes effect only when completion succeeds.
          discoverability: false,
        },
      });
    },
    { timeout: 30_000 },
  );
  return loadOnboarding(userId);
}

export async function saveDraft(userId: string, input: StepDraftInput) {
  await db.$transaction(
    async (tx) => {
      const profile = await lockProfile(tx, userId);
      requireCondition(
        !profile.onboardingCompleted,
        "Your onboarding is already complete.",
      );
      requireCondition(
        stepsFor(profile.onboardingGoal).includes(input.step),
        "Choose the correct starting goal before saving this step.",
      );
      const drafts = {
        ...parseDrafts(profile.onboardingDraftJson),
        [input.step]: input,
      };
      await tx.student_profile.update({
        where: { id: profile.id },
        data: {
          onboardingDraftJson: JSON.stringify(drafts),
          onboardingStep: input.step,
          updatedAt: new Date(),
        },
      });
    },
    { timeout: 30_000 },
  );
  return loadOnboarding(userId);
}

export async function addSkill(
  userId: string,
  input: {
    name: string;
    familyId: string;
    proficiency: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  },
) {
  // Native unique upsert plus retry handles concurrent requests for a new normalized name.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          const profile = await lockProfile(tx, userId);
          requireCondition(
            !profile.onboardingCompleted,
            "Your onboarding is already complete.",
          );
          requireCondition(
            await tx.capability_family.count({
              where: { id: input.familyId, status: "ACTIVE" },
            }),
            "Choose an available skill category.",
          );
          const normalizedName = normalizeSkill(input.name);
          const skill = await tx.capability.upsert({
            where: { normalizedName },
            update: {},
            create: {
              id: randomUUID(),
              name: input.name.normalize("NFKC").trim().replace(/\s+/gu, " "),
              normalizedName,
              familyId: input.familyId,
              createdById: userId,
              slug: `skill-${createHash("sha256").update(normalizedName).digest("hex").slice(0, 24)}`,
            },
          });
          await activeSkills(tx, [skill.id]);
          await tx.student_capability.upsert({
            where: {
              studentProfileId_capabilityId: {
                studentProfileId: profile.id,
                capabilityId: skill.id,
              },
            },
            create: {
              id: randomUUID(),
              studentProfileId: profile.id,
              capabilityId: skill.id,
              proficiency: input.proficiency,
              updatedAt: new Date(),
            },
            update: {},
          });
          return { id: skill.id, name: skill.name, familyId: skill.familyId };
        },
        { timeout: 30_000 },
      );
    } catch (error) {
      if (
        attempt === 0 &&
        typeof error === "object" &&
        error &&
        "code" in error &&
        (error.code === "P2002" || error.code === "P2034")
      )
        continue;
      throw error;
    }
  }
  throw new OnboardingError("Please try adding this skill again.", 503);
}

async function validateProfile(
  tx: Tx,
  profile: Awaited<ReturnType<typeof lockProfile>>,
) {
  requireCondition(
    profile.onboardingGoal === "JOIN_TEAM" ||
      profile.onboardingGoal === "BUILD_IDEA",
    "Choose a starting goal.",
  );
  requireCondition(
    profile.student_capability.length,
    "Choose at least one personal skill.",
  );
  await activeSkills(
    tx,
    profile.student_capability.map((row) => row.capabilityId),
  );
  requireCondition(
    profile.student_venture_interest.length,
    "Choose at least one venture interest.",
  );
  await activeSectors(
    tx,
    profile.student_venture_interest.map((row) => row.sectorId),
  );
  requireCondition(
    profile.student_availability &&
      (await tx.availability_option.count({
        where: {
          id: profile.student_availability.weeklyHoursBand,
          active: true,
        },
      })),
    "Choose your weekly availability.",
  );
}
export async function validateIdea(
  tx: Tx,
  idea: Pick<Prisma.ventureGetPayload<object>, "name" | "problem" | "targetUsers" | "primarySectorId" | "recruitmentContribution"> & {
    venture_capability_requirement: { capabilityId: string; confirmed: boolean }[];
  },
  publish: boolean,
) {
  requireCondition(
    idea.problem?.trim() && idea.targetUsers?.trim() && idea.primarySectorId,
    "Complete the idea's problem, audience and sector.",
  );
  await activeSectors(tx, [idea.primarySectorId]);
  const confirmed = idea.venture_capability_requirement.filter((row) => row.confirmed);
  requireCondition(
    idea.recruitmentContribution?.trim() && confirmed.length,
    "Describe the contribution and skills you need from collaborators.",
  );
  await activeSkills(
    tx,
    confirmed.map((row) => row.capabilityId),
  );
  if (publish)
    requireCondition(
      idea.name.trim(),
      "Add a project title before publishing.",
    );
}

export async function completeOnboarding(
  userId: string,
  discoverability: boolean,
  publish: boolean,
  introductions?: { contributionIntro: string; teamGoals: string },
) {
  return db.$transaction(
    async (tx) => {
      const profile = await lockProfile(tx, userId);
      if (profile.onboardingCompleted) {
        requireCondition(
          !publish || profile.onboardingVenture?.status === "ACTIVE",
          "Onboarding is complete. Publish your draft from its preview.",
        );
        return {
          destination: studentDestination(profile),
          ventureId: profile.onboardingVentureId,
        };
      }
      await validateProfile(tx, profile);
      requireCondition(
        !publish || profile.onboardingGoal === "BUILD_IDEA",
        "There is no onboarding idea to publish.",
      );
      if (profile.onboardingGoal === "BUILD_IDEA") {
        requireCondition(
          profile.onboardingVenture?.ownerId === userId &&
            profile.onboardingVenture.status === "DRAFT",
          "Save your private idea first.",
        );
        await validateIdea(tx, profile.onboardingVenture, publish);
        await tx.venture.update({
          where: { id: profile.onboardingVenture.id },
          data: {
            weeklyHoursBand: profile.student_availability!.weeklyHoursBand,
            ...(publish ? { status: "ACTIVE" as const } : {}),
            updatedAt: new Date(),
          },
        });
      }
      await tx.student_profile.update({
        where: { id: profile.id },
        data: {
          ...(introductions ? { contributionIntro: introductions.contributionIntro, teamGoals: introductions.teamGoals } : {}),
          onboardingCompleted: true,
          onboardingStep: "complete",
          discoverability,
          updatedAt: new Date(),
        },
      });
      return {
        destination: studentDestination({ ...profile, onboardingCompleted: true }),
        ventureId: profile.onboardingVentureId,
      };
    },
    { timeout: 30_000 },
  );
}

export async function publishVenture(userId: string, ventureId: string) {
  return db.$transaction(
    async (tx) => {
      const profile = await lockProfile(tx, userId);
      await tx.$queryRaw`SELECT id FROM venture WHERE id = ${ventureId} FOR UPDATE`;
      const idea = await tx.venture.findUnique({
        where: { id: ventureId },
        include: {
          venture_capability_requirement: { include: { capability: true } },
        },
      });
      if (!idea || idea.ownerId !== userId)
        throw new OnboardingError("Idea not found.", 404);
      if (idea.status === "ACTIVE") return { id: idea.id, status: idea.status };
      requireCondition(
        idea.status === "DRAFT" && profile.onboardingCompleted,
        "Complete onboarding before publishing this draft.",
      );
      await validateProfile(tx, profile);
      await validateIdea(tx, idea, true);
      await tx.venture.update({
        where: { id: ventureId },
        data: {
          status: "ACTIVE",
          weeklyHoursBand: idea.weeklyHoursBand || profile.student_availability!.weeklyHoursBand,
          updatedAt: new Date(),
        },
      });
      return { id: ventureId, status: "ACTIVE" };
    },
    { timeout: 30_000 },
  );
}
