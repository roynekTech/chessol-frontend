"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Type definitions
// export interface IApiResponse<T> {
//   status: string;
//   code: string;
//   message?: string;
//   data?: T;
// }

// Generic GET hook
export function useGetData<T>(
  endpoint: string,
  queryKey: string[],
  options = {}
) {
  console.log("useGetData", endpoint, queryKey);
  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      try {
        const url = new URL(endpoint, API_BASE_URL).toString();
        const response = await fetch(url);
        const data = await response.json();
        if (!response.ok) {
          throw new Error("Error fetching data");
        }
        return data;
      } catch (error) {
        const errMsg =
          error instanceof Error ? error.message : "Error fetching data";
        throw new Error(errMsg);
      }
    },
    ...options,
  });
}

// Generic POST hook
export function usePostData<T, D>(endpoint: string, queryKey: string[]) {
  const queryClient = useQueryClient();

  return useMutation<T, Error, D>({
    mutationFn: async (data: D) => {
      try {
        const url = new URL(endpoint, API_BASE_URL).toString();
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData?.message || "Error sending message");
        }

        return responseData;
      } catch (error) {
        const errMsg =
          error instanceof Error ? error.message : "Error sending message";
        throw new Error(errMsg);
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// Generic PUT hook
export function usePutData<T, D>(endpoint: string, queryKey: string[]) {
  const queryClient = useQueryClient();

  return useMutation<T, Error, D>({
    mutationFn: async (data: D) => {
      try {
        const url = new URL(endpoint, API_BASE_URL).toString();
        const response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData?.message || "Error updating data");
        }

        return responseData;
      } catch (error) {
        const errMsg =
          error instanceof Error ? error.message : "Error updating data";
        throw new Error(errMsg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// Generic PATCH hook
export function usePatchData<T, D>(endpoint: string, queryKey: string[]) {
  const queryClient = useQueryClient();

  return useMutation<T, Error, D>({
    mutationFn: async (data: D) => {
      try {
        const url = new URL(endpoint, API_BASE_URL).toString();
        const response = await fetch(url, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData?.message || "Error updating data");
        }

        return responseData;
      } catch (error) {
        const errMsg =
          error instanceof Error ? error.message : "Error updating data";
        throw new Error(errMsg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// Generic DELETE hook
export function useDeleteData<T>(endpoint: string, queryKey: string[]) {
  const queryClient = useQueryClient();

  return useMutation<T, Error, { id: string }>({
    mutationFn: async (params) => {
      try {
        const url = new URL(endpoint, API_BASE_URL);
        Object.entries(params).forEach(([Key, value]) => {
          if (value !== null && value !== undefined) {
            url.searchParams.append(Key, String(value));
          }
        });
        const response = await fetch(url, {
          method: "DELETE",
        });

        const responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData?.message || "Error deleting data");
        }

        return responseData;
      } catch (error) {
        const errMsg =
          error instanceof Error ? error.message : "Error deleting data";
        throw new Error(errMsg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
