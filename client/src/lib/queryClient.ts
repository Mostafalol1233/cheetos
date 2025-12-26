import { QueryClient, QueryFunction } from "@tanstack/react-query";

// API Configuration
const ENV_API_URL = import.meta.env.VITE_API_URL as string | undefined;
export const API_BASE_URL = (() => {
  if (typeof window === "undefined") return ENV_API_URL || "";
  try {
    const u = new URL(window.location.href);
    if (u.searchParams.get("mock") === "1") {
      return window.location.origin;
    }
  } catch {}
  if (!ENV_API_URL) return window.location.origin;
  if (window.location.protocol === "https:" && ENV_API_URL.startsWith("http://")) return window.location.origin;
  return ENV_API_URL;
})();

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const finalUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
  
  const res = await fetch(finalUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey.join("/") as string;
    const finalUrl = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
    
    const res = await fetch(finalUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    
    // Ensure arrays are returned as arrays (handle edge cases)
    if (Array.isArray(data)) {
      return data;
    }
    
    const expectsArray =
      path === '/api/games' ||
      path === '/api/categories' ||
      path === '/api/games/popular' ||
      path.startsWith('/api/games/category/');

    // If expecting an array but got an object, try to unwrap common API shapes
    if (expectsArray) {
      const maybeArray =
        (data && typeof data === 'object' && Array.isArray((data as any).items) && (data as any).items) ||
        (data && typeof data === 'object' && Array.isArray((data as any).games) && (data as any).games) ||
        (data && typeof data === 'object' && Array.isArray((data as any).categories) && (data as any).categories) ||
        (data && typeof data === 'object' && Array.isArray((data as any).data) && (data as any).data);

      if (maybeArray) {
        return maybeArray;
      }

      console.warn(`Expected array but got:`, typeof data, data);
      return [];
    }
    
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
