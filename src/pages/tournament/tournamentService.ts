import {
  ICreateTournamentRequest,
  IJoinTournamentRequest,
  ITournamentResponse,
  ITournamentsListResponse,
  ITournamentDetailsResponse,
} from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/chesssol/backend";

export const tournamentService = {
  // Fetch all tournaments with optional filtering by status
  async listTournaments(
    status?: "upcoming" | "active" | "completed"
  ): Promise<ITournamentsListResponse> {
    const url = status
      ? `${API_BASE_URL}/tournaments?status=${status}`
      : `${API_BASE_URL}/tournaments`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch tournaments");
    }
    return response.json();
  },

  // Get tournament details by unique hash
  async getTournamentDetails(
    uniqueHash: string
  ): Promise<ITournamentDetailsResponse> {
    const response = await fetch(`${API_BASE_URL}/tournament/${uniqueHash}`);
    if (!response.ok) {
      throw new Error("Failed to fetch tournament details");
    }
    return response.json();
  },

  // Create a new tournament
  async createTournament(
    data: ICreateTournamentRequest
  ): Promise<ITournamentResponse> {
    const response = await fetch(`${API_BASE_URL}/create-tournament`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to create tournament");
    }
    return response.json();
  },

  // Join an existing tournament
  async joinTournament(
    data: IJoinTournamentRequest
  ): Promise<ITournamentResponse> {
    const response = await fetch(`${API_BASE_URL}/join-tournament`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to join tournament");
    }
    return response.json();
  },

  // Update a player's score in a tournament
  async updateScore(
    uniqueHash: string,
    walletAddress: string,
    changeValue: number
  ): Promise<ITournamentResponse> {
    const response = await fetch(`${API_BASE_URL}/update-score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        unique_hash: uniqueHash,
        walletAddress,
        changeValue,
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to update score");
    }
    return response.json();
  },
};
