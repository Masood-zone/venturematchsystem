import { accessibleVenture } from "@/services/onboarding/discovery";
import { apiError, privateHeaders, studentRequest } from "@/services/onboarding/http";
import { readJson } from "@/services/onboarding/http";
import { db } from "@/lib/db";
import { z } from "zod";
import { ventureEditorInput } from "@/lib/venture-editor";
import { saveVenture } from "@/services/ventures/editor";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const headers = request.headers;
  try {
    const userId = await studentRequest(request, headers);
    const venture = await accessibleVenture((await context.params).id, userId);
    return Response.json(venture ?? { error: "Idea not found." }, { status: venture ? 200 : 404, headers: privateHeaders });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await studentRequest(request);
    const body = await readJson(request);
    if (body && typeof body === "object" && "step" in body) {
      return Response.json(await saveVenture(userId, (await context.params).id, ventureEditorInput.parse(body)), { headers: privateHeaders });
    }
    const { title } = z.object({ title: z.string().trim().min(1).max(100) }).parse(body);
    const result = await db.venture.updateMany({ where: { id: (await context.params).id, ownerId: userId, status: "DRAFT" }, data: { name: title, updatedAt: new Date() } });
    return Response.json(result.count ? { saved: true } : { error: "Editable draft not found." }, { status: result.count ? 200 : 404, headers: privateHeaders });
  } catch (error) { return apiError(error); }
}
