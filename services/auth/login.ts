import { authClient } from "@/services/auth/auth-client";

type LoginInput = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export class LoginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoginError";
  }
}

export async function login(input: LoginInput) {
  const result = await authClient.signIn.email(input);

  if (result.error) {
    throw new LoginError(
      result.error.code === "INVALID_EMAIL_OR_PASSWORD"
        ? "Your email or password is incorrect."
        : "Unable to sign in. Please try again.",
    );
  }

  return result.data;
}
