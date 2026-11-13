import type { BetterAuthPlugin } from "better-auth";
import { getCurrentAdapter } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { z } from "zod";

function parseProgramme(value: unknown) {
  const result = z.string().trim().min(1).max(191).safeParse(value);
  if (!result.success) {
    throw new APIError("BAD_REQUEST", {
      message: "Choose a Kumasi campus programme.",
    });
  }
  return result.data;
}

export function studentRegistration(
  validate: (name: string) => Promise<boolean>,
  onRegistered?: (user: { email: string; name: string }) => void,
) {
  return {
    id: "student-registration",
    // Register the existing profile tables with the auth adapter so profile
    // writes can use the same transaction as the user, credential and session.
    schema: {
      student_profile: {
        fields: {
          userId: {
            type: "string",
            required: true,
            unique: true,
            references: { model: "user", field: "id", onDelete: "cascade" },
          },
          createdAt: { type: "date", required: true },
          updatedAt: { type: "date", required: true },
        },
      },
      academic_profile: {
        fields: {
          studentProfileId: {
            type: "string",
            required: true,
            unique: true,
            references: { model: "student_profile", field: "id", onDelete: "cascade" },
          },
          programme: { type: "string", required: false },
          createdAt: { type: "date", required: true },
          updatedAt: { type: "date", required: true },
        },
      },
    },
    hooks: {
      before: [{
        matcher: (ctx) => ctx.path === "/sign-up/email",
        handler: createAuthMiddleware(async (ctx) => {
          const programme = parseProgramme(ctx.body?.programme);
          if (!await validate(programme)) throw new APIError("BAD_REQUEST", { message: "Choose a Kumasi campus programme." });
        }),
      }],
    },
    init() {
      return {
        options: {
          databaseHooks: {
            user: {
              create: {
                after: async (user, ctx) => {
                  if (ctx?.path === "/sign-up/email") onRegistered?.(user);
                },
              },
            },
            account: {
              create: {
                // After hooks run after commit. Use a before hook on credential
                // creation so a profile failure rolls back the signup instead.
                before: async (account, ctx) => {
                  if (ctx?.path !== "/sign-up/email" || account.providerId !== "credential") {
                    return;
                  }
                  // The request hook validated catalogue membership before signup's
                  // transaction. Do not acquire a second pooled connection inside it.
                  const programme = parseProgramme(ctx.body?.programme);
                  const adapter = await getCurrentAdapter(ctx.context.adapter);
                  const now = new Date();
                  const profile = await adapter.create<{ id: string }>({
                    model: "student_profile",
                    data: { userId: account.userId, createdAt: now, updatedAt: now },
                  });
                  await adapter.create({
                    model: "academic_profile",
                    data: {
                      studentProfileId: profile.id,
                      programme,
                      createdAt: now,
                      updatedAt: now,
                    },
                  });
                },
              },
            },
          },
        },
      };
    },
  } satisfies BetterAuthPlugin;
}
