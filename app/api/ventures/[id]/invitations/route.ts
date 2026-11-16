import { after } from "next/server";
import { apiError, privateHeaders, readJson, studentRequest } from "@/services/onboarding/http";
import { invitationInput } from "@/lib/venture-recruitment";
import { deliverInvitationEmail } from "@/services/ventures/email-outbox";
import { invite } from "@/services/ventures/recruitment";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await studentRequest(request);
    const { id } = await params;
    const input = invitationInput.parse(await readJson(request));
    const { id: invitationId, emailId } = await invite(id, userId, input);
    if (emailId) after(() => deliverInvitationEmail(emailId));
    return Response.json({ id: invitationId }, { headers: privateHeaders });
  } catch (error) {
    return apiError(error);
  }
}
