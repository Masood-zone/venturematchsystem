import { db } from "@/lib/db";
import { studentDestination } from "@/lib/student-destination";
import { authorize } from "@/services/auth/authorization";
import { apiError, privateHeaders } from "@/services/onboarding/http";
export async function GET(request: Request) {
  const headers = request.headers;
  try {
    const { user } = await authorize(headers);
    const profile = user.role === "student" ? await db.student_profile.findUnique({ where: { userId: user.id }, select: { onboardingCompleted: true, onboardingGoal: true } }) : null;
    return Response.json({ destination: user.role !== "student" ? "/" : studentDestination(profile) }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}
