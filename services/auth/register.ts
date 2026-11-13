import { authClient } from "@/services/auth/auth-client";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  programme: string;
};

export class RegisterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegisterError";
  }
}

export async function register(input: RegisterInput) {
  const result = await authClient.signUp.email(input);

  if (result.error) {
    throw new RegisterError(
      result.error.status >= 500 ? "Account creation is temporarily unavailable. Please try again." : "Unable to create your account. Check your details and try again.",
    );
  }

  return result.data;
}
