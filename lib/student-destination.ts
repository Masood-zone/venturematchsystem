type StudentSetup = {
  onboardingCompleted: boolean;
  onboardingGoal: string | null;
};

export function studentDestination(profile: StudentSetup | null) {
  if (!profile?.onboardingCompleted) return "/onboarding";
  return profile.onboardingGoal === "BUILD_IDEA" ? "/ventures" : "/explore";
}
