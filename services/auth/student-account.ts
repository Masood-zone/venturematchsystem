import "server-only";
import { db } from "@/lib/db";
import { activeOwnedVentureWhere, studentAccountStatus, studentDestination } from "@/lib/student-destination";

export async function getStudentAccount(userId: string) {
  const [profile, venture] = await Promise.all([
    db.student_profile.findUnique({
      where: { userId },
      select: { onboardingCompleted: true, onboardingGoal: true },
    }),
    db.venture.findFirst({
      where: activeOwnedVentureWhere(userId),
      select: { id: true },
    }),
  ]);
  return {
    destination: studentDestination(profile, !!venture),
    status: studentAccountStatus(profile, !!venture),
  };
}
