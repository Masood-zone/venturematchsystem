import { myApplications } from "@/services/ventures/applications";
import { apiError, privateHeaders, studentRequest } from "@/services/onboarding/http";
export async function GET(request: Request) {
  try { return Response.json(await myApplications(await studentRequest(request)), { headers: privateHeaders }); }
  catch (error) { return apiError(error); }
}
