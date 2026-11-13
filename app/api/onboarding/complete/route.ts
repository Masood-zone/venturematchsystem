import { z } from "zod";
import { introductionsSchema } from "@/lib/venture-applications";
import { completeOnboarding } from "@/services/onboarding/service";
import { apiError, privateHeaders, readJson, studentRequest } from "@/services/onboarding/http";
const schema = introductionsSchema.extend({ discoverability: z.boolean(), publish: z.boolean() });
export async function POST(request: Request) {
  try {
    const userId = await studentRequest(request);
    const input = schema.parse(await readJson(request));
    return Response.json(await completeOnboarding(userId, input.discoverability, input.publish, input), { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}
