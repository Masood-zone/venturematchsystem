type StudentSetup = {
  onboardingCompleted: boolean;
  onboardingGoal: string | null;
};

export function activeOwnedVentureWhere(ownerId: string) {
  return { ownerId, status: "ACTIVE" } as const;
}

export function studentAccountStatus(
  profile: StudentSetup | null,
  ownsActiveVenture = false,
) {
  if (!profile?.onboardingCompleted) return "setup";
  if (ownsActiveVenture) return "founder";
  if (profile.onboardingGoal === "BUILD_IDEA") return "builder";
  if (profile.onboardingGoal === "JOIN_TEAM") return "team-seeker";
  return "student";
}

export type StudentAccountStatus = ReturnType<typeof studentAccountStatus>;

export function studentDestination(profile: StudentSetup | null, ownsActiveVenture = false) {
  const status = studentAccountStatus(profile, ownsActiveVenture);
  if (status === "setup") return "/onboarding";
  return status === "founder" || status === "builder" ? "/ventures" : "/explore";
}
