"use client";

import type { ReactNode } from "react";
import { isServer, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  // Server renders get isolated caches; browser retries reuse the same client.
  if (isServer) return makeQueryClient();

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {children}
          <Toaster theme="light" position="top-center" richColors />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default Providers;
