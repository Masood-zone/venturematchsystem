import { applyToVenture, listVentureApplications } from "@/services/ventures/applications";
import { applicationSubmitSchema } from "@/lib/venture-applications";
import { apiError, privateHeaders, readJson, studentRequest } from "@/services/onboarding/http";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try { return Response.json(await listVentureApplications(await studentRequest(request), (await context.params).id), { headers: privateHeaders }); }
  catch (error) { return apiError(error); }
}
export async function POST(request: Request, context: Context) {
  try {
    const userId = await studentRequest(request);
    const input = applicationSubmitSchema.parse(await readJson(request));
    return Response.json(await applyToVenture(userId, (await context.params).id, input.message), { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}
