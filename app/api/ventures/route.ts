import { publishedVentures } from "@/services/onboarding/discovery";
import { apiError, privateHeaders, readJson, studentRequest } from "@/services/onboarding/http";
import { ventureEditorInput } from "@/lib/venture-editor";
import { saveVenture } from "@/services/ventures/editor";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const userId = await studentRequest(request);
    const { id, draft } = z.object({ id: z.uuid(), draft: ventureEditorInput }).parse(await readJson(request));
    return Response.json(await saveVenture(userId, id, draft, true), { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}
export async function GET(request: Request) {
  const headers = request.headers;
  try {
    await studentRequest(request, headers);
    return Response.json({ ventures: await publishedVentures() }, { headers: privateHeaders });
  } catch (error) { return apiError(error); }
}
