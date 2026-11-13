"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/services/auth/auth-client";

export function useAccountEntry() {
  const { data: session, isPending } = useSession();
  const user = session?.user;
  const { data: destination } = useQuery({
    queryKey: ["account-destination", user?.id],
    enabled: user?.role === "student",
    queryFn: async () => {
      const response = await fetch("/api/auth/destination", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load your next step.");
      const data: unknown = await response.json();
      if (
        typeof data !== "object" || data === null ||
        !("destination" in data) ||
        (data.destination !== "/onboarding" && data.destination !== "/explore" && data.destination !== "/ventures" && data.destination !== "/")
      ) throw new Error("Invalid account destination.");
      return data.destination;
    },
  });

  return {
    isPending,
    isSignedIn: !!user,
    // Resolve again on navigation so completion in another tab cannot send a
    // student back into setup. This also works if the status request fails.
    href: user ? (user.role === "student" ? "/auth/continue" : "/") : "/register",
    label: !user ? "Get started"
      : user.role !== "student" ? "My account"
      : destination === "/explore" || destination === "/ventures" ? "Go to my dashboard"
      : destination === "/onboarding" ? "Continue onboarding"
      : "Continue to my account",
  };
}
