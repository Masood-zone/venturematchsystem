import assert from "node:assert/strict";
import test from "node:test";
import { betterAuth } from "better-auth/minimal";
import { memoryAdapter } from "better-auth/adapters/memory";
import { createAuthClient } from "better-auth/client";
import { APIError } from "better-auth/api";
import { studentRegistration } from "../services/auth/student-registration";
import { programmes } from "../lib/academic-programmes";

function setup(failSession = false) {
  const welcomed: string[] = [];
  const resetLinks: string[] = [];
  const rows: Record<string, Record<string, unknown>[]> = {
    user: [], account: [], session: [], verification: [],
    student_profile: [], academic_profile: [],
  };
  const auth = betterAuth({
    baseURL: "http://localhost:3000",
    secret: "registration-test-secret-at-least-32-characters",
    database: memoryAdapter(rows),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: 3600,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ url }) => { resetLinks.push(url); },
    },
    user: { additionalFields: { role: { type: "string", defaultValue: "student", input: false } } },
    plugins: [studentRegistration(async (name) => programmes.includes(name), (user) => {
      assert.equal(rows.session.length, 1);
      welcomed.push(user.email);
    })],
    logger: { disabled: true },
    databaseHooks: failSession ? {
      session: { create: { before: async () => { throw new APIError("BAD_REQUEST", { message: "Simulated session failure" }); } } },
    } : undefined,
  });
  const client = createAuthClient({
    baseURL: "http://localhost:3000",
    fetchOptions: {
      customFetchImpl: async (url, init) => auth.handler(new Request(url, init)),
    },
  });
  return { rows, client, auth, welcomed, resetLinks };
}

const input = {
  name: "Registration Test",
  email: "registration@example.com",
  password: "registration-test-password",
  programme: programmes[0],
};

test("signup stores the selected programme against the new student's profile", async () => {
  const { rows, client, welcomed } = setup();
  const result = await client.signUp.email(input);
  assert.equal(result.error, null);
  assert.ok(result.data?.token);
  assert.equal(rows.user.length, 1);
  assert.equal(rows.user[0].role, "student");
  assert.equal(rows.student_profile.length, 1);
  assert.equal(rows.student_profile[0].userId, rows.user[0].id);
  assert.equal(rows.academic_profile.length, 1);
  assert.deepEqual(welcomed, [input.email]);
  assert.equal(rows.academic_profile[0].studentProfileId, rows.student_profile[0].id);
  assert.equal(rows.academic_profile[0].programme, input.programme);
  assert.equal(rows.account.length, 1);
  assert.equal(rows.session.length, 1);

  const duplicate = await client.signUp.email(input);
  assert.ok(duplicate.error);
  assert.equal(rows.user.length, 1);
  assert.equal(rows.academic_profile.length, 1);
});

test("missing, unknown and malformed programmes are rejected before account creation", async () => {
  for (const programme of [undefined, "", "Unknown programme", [programmes[0]]]) {
    const { rows, client } = setup();
    const invalidInput = { ...input, programme };
    const result = await client.signUp.email(invalidInput);
    assert.equal(result.error?.status, 400);
    assert.ok(Object.values(rows).every((table) => table.length === 0));
  }
});

test("a later signup failure rolls back the user, credentials and both profiles", async () => {
  const { rows, client, welcomed } = setup(true);
  const result = await client.signUp.email(input);
  assert.ok(result.error);
  assert.ok(Object.values(rows).every((table) => table.length === 0));
  assert.deepEqual(welcomed, []);
});

test("password recovery keeps requests private and consumes a valid token once", async () => {
  const { rows, client, auth, resetLinks } = setup();
  assert.equal((await client.signUp.email(input)).error, null);
  const redirectTo = "http://localhost:3000/reset-password";
  const known = await client.requestPasswordReset({ email: input.email, redirectTo });
  const unknown = await client.requestPasswordReset({ email: "unknown@example.invalid", redirectTo });
  assert.equal(known.error, null);
  assert.deepEqual(known, unknown);
  assert.equal(resetLinks.length, 1);

  const callback = await auth.handler(new Request(resetLinks[0]));
  assert.equal(callback.status, 302);
  const destination = new URL(callback.headers.get("location")!);
  assert.equal(destination.pathname, "/reset-password");
  const expiredToken = destination.searchParams.get("token");
  assert.ok(expiredToken);
  const newPassword = "replacement-password";
  assert.equal((await client.resetPassword({ token: "invalid", newPassword })).error?.code, "INVALID_TOKEN");

  const verification = rows.verification.find((row) => row.identifier === `reset-password:${expiredToken}`);
  assert.ok(verification);
  const expiry = verification.expiresAt;
  assert.ok(expiry instanceof Date);
  assert.ok(expiry.getTime() - Date.now() > 59 * 60 * 1000);
  verification.expiresAt = new Date(0);
  assert.equal((await client.resetPassword({ token: expiredToken, newPassword })).error?.code, "INVALID_TOKEN");
  assert.equal((await client.requestPasswordReset({ email: input.email, redirectTo })).error, null);
  const freshCallback = await auth.handler(new Request(resetLinks[1]));
  const token = new URL(freshCallback.headers.get("location")!).searchParams.get("token");
  assert.ok(token);

  assert.equal((await client.resetPassword({ token, newPassword })).error, null);
  assert.equal(rows.session.length, 0);
  assert.equal((await client.resetPassword({ token, newPassword })).error?.code, "INVALID_TOKEN");
  assert.ok((await client.signIn.email({ email: input.email, password: input.password })).error);
  assert.equal((await client.signIn.email({ email: input.email, password: newPassword })).error, null);
});

test("registration cannot assign a staff role", async () => {
  const { rows, client } = setup();
  const staffInput = { ...input, role: "admin" };
  const result = await client.signUp.email(staffInput);
  assert.equal(result.error, null);
  assert.equal(rows.user[0].role, "student");
});
