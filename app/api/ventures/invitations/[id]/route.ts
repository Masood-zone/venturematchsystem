import { apiError, privateHeaders, readJson, studentRequest } from "@/services/onboarding/http";
import { invitationAction } from "@/lib/venture-recruitment";
import { actOnInvitation } from "@/services/ventures/recruitment";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await studentRequest(request);
    const { id } = await params;
    const input = invitationAction.parse(await readJson(request));
    return Response.json(await actOnInvitation(id, userId, input), { headers: privateHeaders });
  } catch (error) {
    return apiError(error);
  }
}
