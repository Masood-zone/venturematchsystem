import "server-only";
import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { studentRegistration } from "./student-registration";
import { validProgramme } from "@/services/academic-programmes";
import { scheduleEmail } from "@/services/email/schedule-email";

const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;

if (!secret || secret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
}
if (!baseURL) {
  throw new Error("BETTER_AUTH_URL is not configured.");
}

const origin = new URL(baseURL).origin;

export const auth = betterAuth({
  appName: "VentureMatch",
  baseURL: origin,
  secret,
  trustedOrigins: [origin],
  database: prismaAdapter(db, { provider: "mysql", transaction: true }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 3600,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      scheduleEmail({ kind: "password-reset", userEmail: user.email, userName: user.name, resetUrl: url });
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "student",
        input: false,
      },
    },
  },
  session: {
    // Read current sessions and roles from TiDB; do not authorize from cookie claims.
    cookieCache: { enabled: false },
  },
  rateLimit: {
    enabled: true,
    customRules: { "/request-password-reset": { window: 60, max: 5 } },
  },
  plugins: [
    studentRegistration(validProgramme, (user) => {
      scheduleEmail({ kind: "welcome", userEmail: user.email, userName: user.name });
    }),
    nextCookies(),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
