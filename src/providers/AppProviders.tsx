"use client";

import { useEffect, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { initSessionListener } from "@/lib/auth/session";
import { QueryProvider } from "./QueryProvider";

/**
 * Global providers that are safe to include on every page.
 *
 * WalletProvider remains scoped to auth, escrow, and dashboard consumers.
 * It adapts the persisted Zustand wallet store without loading the SDK.
 * The canonical wallet kit loads only when a wallet operation requests it.
 *
 * See: https://github.com/safetrustcr/frontend-SafeTrust/issues/538
 */
export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    const unsubscribe = initSessionListener();
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      storageKey="safetrust-theme"
      defaultTheme="system"
      enableSystem
    >
      <QueryProvider>
        {children}
        <Toaster richColors position="top-right" />
      </QueryProvider>
    </ThemeProvider>
  );
}
