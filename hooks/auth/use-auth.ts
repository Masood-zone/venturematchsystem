"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { entryContext, entryHref } from "@/lib/student-entry";
import { login } from "@/services/auth/login";
import { logout } from "@/services/auth/logout";
import { register } from "@/services/auth/register";

// Auth mutation hooks
// Use Login
export function useLogin() {
  const router = useRouter();
  const params = useSearchParams();

  return useMutation({
    mutationFn: login,
    retry: false,
    gcTime: 0,

    onSuccess: async () => {
      router.replace(entryHref("/auth/continue", entryContext(params)));
      router.refresh();
    },
  });
}

// Use Register
export function useRegister() {
  const router = useRouter();
  const params = useSearchParams();

  return useMutation({
    mutationFn: register,
    retry: false,
    gcTime: 0,

    onSuccess: () => {
      router.replace(entryHref("/onboarding", entryContext(params)));
      router.refresh();
    },
  });
}

// Use Logout
export function useLogOut() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    retry: false,
    gcTime: 0,
    onSuccess: async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      router.replace("/");
      router.refresh();
    },
  });
}
