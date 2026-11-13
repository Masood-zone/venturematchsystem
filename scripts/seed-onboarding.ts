import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { db } from "../lib/db";
import { Prisma } from "../lib/generated/prisma/client";
import { normalizeSkill } from "../lib/onboarding";
import { availability, legacySectorMappings, sectors, skillFamilies } from "../prisma/catalogues/onboarding";

async function main() {
  const existing = await db.capability.findMany();
  const seen = new Map<string, string>();
  for (const skill of existing) {
    const key = normalizeSkill(skill.name);
    if (seen.has(key)) throw new Error(`Resolve duplicate skill IDs before seeding: ${seen.get(key)}, ${skill.id}`);
    seen.set(key, skill.id);
  }
  await db.$transaction(async (tx) => {
    if (existing.length) await tx.$executeRaw(Prisma.sql`UPDATE capability SET normalizedName = CASE id ${Prisma.join(existing.map((skill) => Prisma.sql`WHEN ${skill.id} THEN ${normalizeSkill(skill.name)}`), " ")} END WHERE id IN (${Prisma.join(existing.map((skill) => skill.id))})`);
    await tx.capability_family.createMany({ data: skillFamilies.map((family, sortOrder) => ({ id: randomUUID(), slug: family.slug, name: family.name, sortOrder })), skipDuplicates: true });
    const families = await tx.capability_family.findMany();
    const newSkills: Prisma.capabilityCreateManyInput[] = [];
    for (const family of skillFamilies) {
      const row = families.find((row) => row.slug === family.slug)!;
      for (const [index, name] of family.skills.entries()) {
        const normalizedName = normalizeSkill(name);
        if (seen.has(normalizedName)) continue;
        newSkills.push({
          id: randomUUID(), name, normalizedName, familyId: row.id, sortOrder: index,
          slug: `skill-${createHash("sha256").update(normalizedName).digest("hex").slice(0, 24)}`,
        });
      }
    }
    if (newSkills.length) await tx.capability.createMany({ data: newSkills, skipDuplicates: true });
    await tx.venture_sector.createMany({ data: sectors.map(([slug, name], sortOrder) => ({ id: randomUUID(), slug, name, sortOrder })), skipDuplicates: true });
    await tx.$executeRaw(Prisma.sql`UPDATE venture_sector SET name = CASE slug ${Prisma.join(sectors.map(([slug, name]) => Prisma.sql`WHEN ${slug} THEN ${name}`), " ")} END, sortOrder = CASE slug ${Prisma.join(sectors.map(([slug], index) => Prisma.sql`WHEN ${slug} THEN ${index}`), " ")} END, status = 'ACTIVE' WHERE slug IN (${Prisma.join(sectors.map(([slug]) => slug))})`);
    for (const [oldSlug, canonicalSlug] of Object.entries(legacySectorMappings)) {
      const old = await tx.venture_sector.findUnique({ where: { slug: oldSlug } });
      const canonical = await tx.venture_sector.findUniqueOrThrow({ where: { slug: canonicalSlug } });
      if (!old) continue;
      const interests = await tx.student_venture_interest.findMany({ where: { sectorId: old.id } });
      for (const interest of interests) {
        await tx.student_venture_interest.upsert({ where: { studentProfileId_sectorId: { studentProfileId: interest.studentProfileId, sectorId: canonical.id } },
          create: { id: randomUUID(), studentProfileId: interest.studentProfileId, sectorId: canonical.id, strength: 1 }, update: {} });
      }
      await tx.student_venture_interest.deleteMany({ where: { sectorId: old.id } });
      await tx.venture.updateMany({ where: { primarySectorId: old.id }, data: { primarySectorId: canonical.id } });
      await tx.venture.updateMany({ where: { secondarySectorId: old.id }, data: { secondarySectorId: canonical.id } });
      await tx.venture_sector.update({ where: { id: old.id }, data: { status: "LEGACY" } });
    }
    await tx.availability_option.createMany({ data: availability.map((option, sortOrder) => ({ ...option, sortOrder })), skipDuplicates: true });
    await tx.student_profile.updateMany({ where: { onboardingCompleted: false }, data: { discoverability: false } });
    await tx.student_venture_interest.updateMany({ where: { strength: { not: 1 } }, data: { strength: 1 } });
  }, { timeout: 120_000 });
  console.log("Catalogue reconciled: existing IDs retained, broad sectors mapped, availability seeded.");
}
main().finally(() => db.$disconnect());
