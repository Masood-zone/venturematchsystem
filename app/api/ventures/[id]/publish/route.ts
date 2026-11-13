import { publishVenture } from "@/services/onboarding/service";
import { apiError, privateHeaders, studentRequest } from "@/services/onboarding/http";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await studentRequest(request);
    return Response.json(await publishVenture(userId, (await context.params).id), { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}
