import { z } from "zod";
import { stepDraftSchema, stepSchema } from "@/lib/onboarding";
import { saveDraft, saveStep } from "@/services/onboarding/service";
import { apiError, privateHeaders, readJson, studentRequest } from "@/services/onboarding/http";
const schema = z.object({ data: z.unknown(), advance: z.boolean() });
export async function PUT(request: Request) {
  try {
    const userId = await studentRequest(request);
    const { data, advance } = schema.parse(await readJson(request));
    const result = advance ? await saveStep(userId, stepSchema.parse(data), true) : await saveDraft(userId, stepDraftSchema.parse(data));
    return Response.json(result, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}
