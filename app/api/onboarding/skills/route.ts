import { customSkillSchema } from "@/lib/onboarding";
import { addSkill } from "@/services/onboarding/service";
import { apiError, privateHeaders, readJson, studentRequest } from "@/services/onboarding/http";
export async function POST(request: Request) {
  try {
    const userId = await studentRequest(request);
    return Response.json(await addSkill(userId, customSkillSchema.parse(await readJson(request))), { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}
