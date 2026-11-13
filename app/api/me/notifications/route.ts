import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, privateHeaders, readJson, studentRequest } from "@/services/onboarding/http";

export async function PATCH(request: Request) {
  try {
    const userId = await studentRequest(request);
    const { id } = z.object({ id: z.string().min(1).max(100) }).parse(await readJson(request));
    await db.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
    return Response.json({ saved: true }, { headers: privateHeaders });
  } catch (error) {
    return apiError(error);
  }
}
