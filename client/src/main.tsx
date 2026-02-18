import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

/**
 * Custom fetch wrapper that detects HTML responses (from proxy/nginx during
 * server restarts or sandbox wake-up) and retries with exponential backoff.
 */
async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 3,
  delay = 1000
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await globalThis.fetch(input, {
      ...(init ?? {}),
      credentials: "include",
    });

    // Check if we got an HTML response instead of JSON (proxy returning fallback page)
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html") && attempt < retries) {
      console.warn(
        `[tRPC] Received HTML response (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`
      );
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // exponential backoff
      continue;
    }

    return response;
  }

  // Should not reach here, but return last attempt as fallback
  return globalThis.fetch(input, {
    ...(init ?? {}),
    credentials: "include",
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry up to 3 times on failure (handles transient errors during sandbox wake-up)
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      // Stale time to reduce unnecessary refetches
      staleTime: 5000,
    },
    mutations: {
      retry: false,
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    // Only log non-HTML errors to avoid noise during retries
    if (!(error instanceof TRPCClientError && error.message.includes("<!doctype"))) {
      console.error("[API Query Error]", error);
    }
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch: fetchWithRetry,
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
