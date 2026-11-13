import { loadOnboarding } from "@/services/onboarding/service";
import { apiError, privateHeaders, studentRequest } from "@/services/onboarding/http";
export async function GET(request: Request) {
  const headers = request.headers;
  try { return Response.json(await loadOnboarding(await studentRequest(request, headers)), { headers: privateHeaders }); }
  catch (error) { return apiError(error); }
}
