import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();
  const [isPublicMode, setIsPublicMode] = useState(false);
  const [publicModeChecked, setPublicModeChecked] = useState(false);
  const [publicAccessInitialized, setPublicAccessInitialized] = useState(false);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Check if we're in public mode
  const publicModeQuery = trpc.system.getPublicModeStatus.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Initialize public access when in public mode
  useEffect(() => {
    if (!isPublicMode || publicAccessInitialized) return;

    const initPublicAccess = async () => {
      try {
        const response = await fetch("/api/public-access");
        if (response.ok) {
          setPublicAccessInitialized(true);
          // Refetch auth to get the anonymous user
          meQuery.refetch();
        }
      } catch (error) {
        console.error("[Public Access] Failed to initialize:", error);
      }
    };

    initPublicAccess();
  }, [isPublicMode, publicAccessInitialized, meQuery]);

  useEffect(() => {
    if (publicModeQuery.data) {
      setIsPublicMode(publicModeQuery.data.isPublicMode);
      setPublicModeChecked(true);
    }
  }, [publicModeQuery.data]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending || !publicModeChecked || (isPublicMode && !publicAccessInitialized),
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
    publicModeChecked,
    isPublicMode,
    publicAccessInitialized,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (!publicModeChecked) return; // Wait for public mode check
    if (state.user) return;
    if (isPublicMode && !publicAccessInitialized) return; // Wait for public access init
    if (isPublicMode) return; // Don't redirect in public mode
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
    isPublicMode,
    publicModeChecked,
    publicAccessInitialized,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
    isPublicMode,
  };
}
