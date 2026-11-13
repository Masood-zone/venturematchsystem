import "server-only";
import { ZodError } from "zod";
import { AccessError, authorize } from "@/services/auth/authorization";
import { OnboardingError } from "./service";

export const privateHeaders = { "Cache-Control": "private, no-store" };
export async function studentRequest(request: Request, requestHeaders = request.headers) {
  const session = await authorize(requestHeaders, ["student"]);
  if (!["GET", "HEAD"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const expected = new URL(process.env.BETTER_AUTH_URL!).origin;
    if (origin !== expected) throw new AccessError(403);
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new OnboardingError("Send JSON data.", 400);
    const size = Number(request.headers.get("content-length") ?? 0);
    if (size > 32_768)
      throw new OnboardingError("This submission is too large.", 413);
  }
  return session.user.id;
}
export async function readJson(request: Request): Promise<unknown> {
  const body = await request.text();
  if (body.length > 32_768)
    throw new OnboardingError("This submission is too large.", 413);
  return JSON.parse(body);
}
export function apiError(error: unknown) {
  if (error instanceof AccessError || error instanceof OnboardingError)
    return Response.json(
      { error: error.message },
      { status: error.status, headers: privateHeaders },
    );
  if (error instanceof ZodError)
    return Response.json(
      {
        error: error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(" "),
      },
      { status: 400, headers: privateHeaders },
    );
  if (error instanceof SyntaxError)
    return Response.json(
      { error: "Invalid JSON submission." },
      { status: 400, headers: privateHeaders },
    );
  console.error("Onboarding service request failed.");
  return Response.json(
    { error: "We could not save or load your information. Please try again." },
    { status: 503, headers: privateHeaders },
  );
}
