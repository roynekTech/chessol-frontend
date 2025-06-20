import { useGetData } from "@/utils/use-query-hooks";
import { API_PATHS } from "@/utils/constants";
import {
  ICreateTournamentRequest,
  IJoinTournamentRequest,
  ITournamentResponse,
  ITournamentsListResponse,
  ITournamentDetailsResponse,
} from "../types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { $axios } from "../../../utils/axios";

/**
 * Custom hook to fetch all tournaments with optional filtering by status
 */
export function useTournaments(status?: "upcoming" | "active" | "completed") {
  const endpoint = status
    ? API_PATHS.listTournaments(status)
    : API_PATHS.listTournaments();

  // Create query key with defined values only
  const queryKey = status ? ["tournaments", status] : ["tournaments"];

  return useGetData<ITournamentsListResponse>(endpoint, queryKey, {
    refetchOnWindowFocus: true,
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

/**
 * Custom hook to fetch a specific tournament's details
 */
export function useTournamentDetails(uniqueHash: string) {
  return useGetData<ITournamentDetailsResponse>(
    API_PATHS.getTournamentDetails(uniqueHash),
    ["tournament", uniqueHash],
    {
      enabled: !!uniqueHash,
      refetchOnWindowFocus: true,
      staleTime: 30000, // Consider data stale after 30 seconds
    }
  );
}

/**
 * Custom hook to create a new tournament
 * @returns Mutation hook for creating tournaments
 */
export function useCreateTournament() {
  const queryClient = useQueryClient();

  return useMutation<ITournamentResponse, Error, ICreateTournamentRequest>({
    mutationFn: async (data) => {
      try {
        const response = await $axios.post(API_PATHS.createTournament(), data);

        // Check for API-level errors
        if (response.data.error) {
          throw new Error(response.data.msg || "Failed to create tournament");
        }

        return response.data;
      } catch (error) {
        // Handle Axios errors
        if (axios.isAxiosError(error)) {
          throw new Error(error.response?.data?.msg || error.message);
        }
        // Handle other errors
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate both tournaments list and any specific tournament queries
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

/**
 * Custom hook to join an existing tournament
 */
export function useJoinTournament() {
  const queryClient = useQueryClient();

  return useMutation<ITournamentResponse, Error, IJoinTournamentRequest>({
    mutationFn: async (data) => {
      try {
        const response = await axios.post(API_PATHS.joinTournament(), data);

        // Check for API-level errors
        if (response.data.error) {
          throw new Error(response.data.msg || "Failed to join tournament");
        }

        return response.data;
      } catch (error) {
        // Handle Axios errors
        if (axios.isAxiosError(error)) {
          throw new Error(error.response?.data?.msg || error.message);
        }
        // Handle other errors
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate both tournaments list and the specific tournament
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({
        queryKey: ["tournament", variables.unique_hash],
      });
    },
  });
}

/**
 * Custom hook to update a player's score in a tournament
 */
export function useUpdateScore() {
  const queryClient = useQueryClient();

  type UpdateScoreParams = {
    unique_hash: string;
    walletAddress: string;
    changeValue: number;
    creatorWalletAddress?: string;
  };

  return useMutation<ITournamentResponse, Error, UpdateScoreParams>({
    mutationFn: async (data) => {
      try {
        const response = await $axios.post(API_PATHS.updateScore(), data);

        // Check for API-level errors
        if (response.data.error) {
          throw new Error(response.data.msg || "Failed to update score");
        }

        return response.data;
      } catch (error) {
        // Handle Axios errors
        if (axios.isAxiosError(error)) {
          throw new Error(error.response?.data?.msg || error.message);
        }
        // Handle other errors
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate both tournaments list and the specific tournament
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({
        queryKey: ["tournament", variables.unique_hash],
      });
    },
  });
}

/**
 * Custom hook to generate tournament fixtures
 */
export function useGenerateFixtures() {
  const queryClient = useQueryClient();

  type GenerateFixturesParams = {
    unique_hash: string;
    walletAddress: string;
  };

  return useMutation<ITournamentResponse, Error, GenerateFixturesParams>({
    mutationFn: async (data) => {
      try {
        const response = await $axios.post(API_PATHS.generateFixtures(), data);

        // Check for API-level errors
        if (response.data.error) {
          throw new Error(response.data.msg || "Failed to generate fixtures");
        }

        return response.data;
      } catch (error) {
        // Handle Axios errors
        if (axios.isAxiosError(error)) {
          throw new Error(error.response?.data?.msg || error.message);
        }
        // Handle other errors
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate both tournaments list and the specific tournament
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({
        queryKey: ["tournament", variables.unique_hash],
      });
    },
  });
}
