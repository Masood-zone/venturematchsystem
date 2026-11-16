import { authorize } from "@/services/auth/authorization";
import { getStudentAccount } from "@/services/auth/student-account";
import { apiError, privateHeaders } from "@/services/onboarding/http";

export async function GET(request: Request) {
  try {
    const { user } = await authorize(request.headers);
    const account = user.role === "student"
      ? await getStudentAccount(user.id)
      : { destination: "/", status: null };
    return Response.json(account, { headers: privateHeaders });
  } catch (error) {
    return apiError(error);
  }
}
