import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

const API_BASE = "/api";

function getHeaders(token: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

async function fetchApi(
  path: string,
  token: string | null,
  options: FetchOptions = {}
): Promise<Response> {
  const { method = "GET", body } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: getHeaders(token),
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  return res;
}

export function useFetch<TData = unknown>(
  queryKey: (string | number)[],
  path: string,
  options?: {
    enabled?: boolean;
    queryOptions?: Omit<UseQueryOptions<TData>, "queryKey" | "queryFn">;
  }
) {
  const { token } = useAuth();
  const { enabled = true, queryOptions } = options ?? {};

  return useQuery({
    queryKey: [...queryKey, token ?? "anon"],
    queryFn: async (): Promise<TData> => {
      const res = await fetchApi(path, token);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? res.statusText);
      }
      return res.json() as Promise<TData>;
    },
    enabled: enabled && !!path,
    ...queryOptions,
  });
}

export function useFetchMutation<TData = unknown, TVariables = unknown>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE" = "POST",
  options?: {
    mutationOptions?: UseMutationOptions<TData, Error, TVariables>;
    invalidateKeys?: (string | number)[][];
  }
) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { mutationOptions, invalidateKeys } = options ?? {};

  return useMutation({
    mutationFn: async (body: TVariables): Promise<TData> => {
      const res = await fetchApi(path, token, { method, body });
      const text = await res.text();
      if (!res.ok) {
        const err = text ? JSON.parse(text) : {};
        throw new Error((err as { error?: string }).error ?? res.statusText);
      }
      return text ? JSON.parse(text) : (undefined as TData);
    },
    onSuccess: (_, __, ___, mutation) => {
      invalidateKeys?.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      mutationOptions?.onSuccess?.(_, __, ___, mutation);
    },
    ...mutationOptions,
  });
}
