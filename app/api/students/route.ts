import { discoverableStudents } from "@/services/onboarding/discovery";
import { apiError, privateHeaders, studentRequest } from "@/services/onboarding/http";
export async function GET(request: Request) {
  const headers = request.headers;
  try {
    await studentRequest(request, headers);
    return Response.json({ students: await discoverableStudents() }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}
