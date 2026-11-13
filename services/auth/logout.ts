import { signOut } from "@/services/auth/auth-client";

export async function logout() {
  const result = await signOut();

  if (result.error) {
    throw new Error("Could not sign out. Please try again.");
  }

  return result.data;
}
