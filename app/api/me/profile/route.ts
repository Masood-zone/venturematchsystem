import { loadOnboarding } from "@/services/onboarding/service";
import { saveProfile } from "@/services/ventures/profile";
import { profileSchema } from "@/lib/student-profile";
import { apiError, privateHeaders, readJson, studentRequest } from "@/services/onboarding/http";
export async function GET(request: Request) {
  try { return Response.json(await loadOnboarding(await studentRequest(request)), { headers: privateHeaders }); }
  catch (error) { return apiError(error); }
}
export async function PUT(request: Request) {
  try {
    const userId = await studentRequest(request);
    return Response.json(await saveProfile(userId, profileSchema.parse(await readJson(request))), { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}
