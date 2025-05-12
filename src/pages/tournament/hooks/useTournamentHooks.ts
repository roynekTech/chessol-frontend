import { useGetData, usePostData } from "../../../utils/use-query-hooks";
import { API_PATHS } from "../../../utils/constants";
import {
  ICreateTournamentRequest,
  IJoinTournamentRequest,
  ITournamentResponse,
  ITournamentsListResponse,
  ITournamentDetailsResponse,
} from "../types";

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
    refetchOnWindowFocus: false,
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
      refetchOnWindowFocus: false,
    }
  );
}

/**
 * Custom hook to create a new tournament
 */
export function useCreateTournament() {
  return usePostData<ITournamentResponse, ICreateTournamentRequest>(
    API_PATHS.createTournament(),
    ["tournaments"]
  );
}

/**
 * Custom hook to join an existing tournament
 */
export function useJoinTournament() {
  return usePostData<ITournamentResponse, IJoinTournamentRequest>(
    API_PATHS.joinTournament(),
    ["tournaments"]
  );
}

/**
 * Custom hook to update a player's score in a tournament
 */
export function useUpdateScore() {
  type UpdateScoreParams = {
    unique_hash: string;
    walletAddress: string;
    changeValue: number;
    creatorWalletAddress?: string;
  };

  return usePostData<ITournamentResponse, UpdateScoreParams>(
    API_PATHS.updateScore(),
    ["tournaments"]
  );
}

/**
 * Custom hook to generate fixtures for a tournament
 */
export function useGenerateFixtures() {
  type GenerateFixturesParams = {
    walletAddress: string;
    unique_hash: string;
  };

  return usePostData<ITournamentResponse, GenerateFixturesParams>(
    API_PATHS.generateFixtures(),
    ["tournaments"]
  );
}
