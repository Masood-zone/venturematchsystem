import "dotenv/config";
import { db } from "../lib/db";

async function main() {
  const [families, skills, sectors, programmes] = await Promise.all([
    db.capability_family.findMany({ select: { id: true, name: true, slug: true, status: true } }),
    db.capability.findMany({ select: { id: true, name: true, slug: true, familyId: true, status: true } }),
    db.venture_sector.findMany({ select: { id: true, name: true, slug: true, status: true } }),
    db.academic_programme.count({ where: { active: true, campus: "KUMASI" } }),
  ]);
  console.log(JSON.stringify({ families, skills, sectors, activeKumasiProgrammes: programmes }, null, 2));
}
main().finally(() => db.$disconnect());
