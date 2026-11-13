import { apiError, privateHeaders, readJson, studentRequest } from "@/services/onboarding/http";
import { trialProposal } from "@/lib/group-trial";
import { proposeTrial } from "@/services/ventures/trials";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await studentRequest(request);
    const { id } = await params;
    const input = trialProposal.parse(await readJson(request));
    return Response.json(await proposeTrial(id, userId, input), { headers: privateHeaders });
  } catch (error) {
    return apiError(error);
  }
}
