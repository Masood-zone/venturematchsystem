import { apiError, privateHeaders, readJson, studentRequest } from "@/services/onboarding/http";
import { invitationInput } from "@/lib/venture-recruitment";
import { invite } from "@/services/ventures/recruitment";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await studentRequest(request);
    const { id } = await params;
    const input = invitationInput.parse(await readJson(request));
    return Response.json(await invite(id, userId, input), { headers: privateHeaders });
  } catch (error) {
    return apiError(error);
  }
}
