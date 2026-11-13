import "server-only";
import { db } from "@/lib/db";

export async function activeProgrammeNames() {
  const rows = await db.academic_programme.findMany({
    where: { active: true, campus: "KUMASI" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { name: true },
  });
  return [...new Set(rows.map((row) => row.name))];
}
export async function validProgramme(name: string) {
  return Boolean(
    await db.academic_programme.findFirst({
      where: { name, active: true, campus: "KUMASI" },
      select: { id: true },
    }),
  );
}
