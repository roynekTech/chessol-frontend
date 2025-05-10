export const ESCROW_ADDRESS = "che8nUkgbX8RLgMsouwVoa6ezdGgTkpU2vZc6kxJ7UH";

export const API_PATHS = {
  getInMemGameDetails: (gameId: string) => {
    return `gameDataMem/${gameId}`;
  },

  gameFromDbData: (gameId: string) => {
    return `gameData/${gameId}`;
  },

  listGames: () => {
    return "listGames";
  },

  viewGameDetails: (gameId: string) => {
    return `viewGame?gameId=${gameId}`;
  },

  // Tournament API paths
  listTournaments: (status?: string) => {
    return status ? `tournaments?status=${status}` : "tournaments";
  },

  getTournamentDetails: (uniqueHash: string) => {
    return `tournament/${uniqueHash}`;
  },

  createTournament: () => {
    return "create-tournament";
  },

  joinTournament: () => {
    return "join-tournament";
  },

  updateScore: () => {
    return "update-score";
  },
};

export const PAGE_ROUTES = {
  Homepage: "/",
  OngoingGames: "/games",
  Lobby: "/lobby",
  GamePlay: "/game-play",
  TournamentPage: "/tournaments",
  NotFound: "*",
};
