import { apiError, privateHeaders, readJson, studentRequest } from "@/services/onboarding/http";
import { trialAction } from "@/lib/group-trial";
import { actOnTrial } from "@/services/ventures/trials";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await studentRequest(request);
    const { id } = await params;
    const input = trialAction.parse(await readJson(request));
    return Response.json(await actOnTrial(id, userId, input), { headers: privateHeaders });
  } catch (error) {
    return apiError(error);
  }
}
