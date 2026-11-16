"use client";

import { useQuery } from "@tanstack/react-query";
import type { StudentAccountStatus } from "@/lib/student-destination";
import { useSession } from "@/services/auth/auth-client";

export const accountDestinationKey = ["account-destination"] as const;

const studentEntry = {
  setup: { displayLabel: "Student", label: "Continue onboarding" },
  founder: { displayLabel: "Campus Founder", label: "My ventures" },
  builder: { displayLabel: "Idea Builder", label: "My ventures" },
  "team-seeker": { displayLabel: "Team Seeker", label: "Explore ventures" },
  student: { displayLabel: "Student", label: "Explore ventures" },
} satisfies Record<StudentAccountStatus, { displayLabel: string; label: string }>;

function isStudentStatus(status: unknown): status is StudentAccountStatus {
  return typeof status === "string" && Object.hasOwn(studentEntry, status);
}

type AccountEntry = {
  isPending: boolean;
  isSignedIn: boolean;
  status: StudentAccountStatus | undefined;
  displayLabel: string;
  href: string;
  label: string;
};

export function useAccountEntry(): AccountEntry {
  const { data: session, isPending } = useSession();
  const user = session?.user;
  const isStudent = user?.role === "student";
  const { data } = useQuery<StudentAccountStatus>({
    queryKey: [...accountDestinationKey, user?.id],
    enabled: isStudent,
    queryFn: async () => {
      const response = await fetch("/api/auth/destination", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load your next step.");
      const data: unknown = await response.json();
      if (typeof data !== "object" || data === null || !("status" in data) || !isStudentStatus(data.status)) {
        throw new Error("Invalid account status.");
      }
      return data.status;
    },
  });
  const status = isStudent ? data : undefined;
  const entry = status ? studentEntry[status] : undefined;

  return {
    isPending,
    isSignedIn: !!user,
    status,
    displayLabel: entry?.displayLabel ?? (isStudent ? "Student" : user?.role || "Member"),
    // Resolve again on navigation in case the account changed in another tab.
    href: !user ? "/register" : isStudent ? "/auth/continue" : "/",
    label: !user ? "Get started" : !isStudent ? "My account" : entry?.label ?? "Continue to my account",
  };
}
