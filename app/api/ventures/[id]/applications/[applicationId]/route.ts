import { actOnApplication } from "@/services/ventures/applications";
import { applicationActionSchema } from "@/lib/venture-applications";
import { apiError, privateHeaders, readJson, studentRequest } from "@/services/onboarding/http";
export async function PATCH(request: Request, context: { params: Promise<{ id: string; applicationId: string }> }) {
  try {
    const userId = await studentRequest(request);
    const decision = applicationActionSchema.parse(await readJson(request));
    const { id, applicationId } = await context.params;
    return Response.json(await actOnApplication(userId, id, applicationId, decision.action, decision.action === "decline" ? decision.reason : undefined), { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}
