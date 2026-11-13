import "server-only";
import { after } from "next/server";
import type { emailService } from "./email-service";

type EmailMessage = Parameters<typeof emailService.send>[0];

function logEmailFailure(kind: EmailMessage["kind"], error: unknown) {
  const code = error instanceof Error && "code" in error ? error.code : undefined;
  const safeCode = typeof code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(code) ? code : undefined;
  console.error("VentureMatch email delivery failed", { kind, code: safeCode });
}

export function scheduleEmail(message: EmailMessage) {
  try {
    after(async () => {
      try {
        const { emailService } = await import("./email-service");
        await emailService.send(message);
      } catch (error) {
        logEmailFailure(message.kind, error);
      }
    });
  } catch (error) {
    logEmailFailure(message.kind, error);
  }
}
