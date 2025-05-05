export const ESCROW_ADDRESS = "che8nUkgbX8RLgMsouwVoa6ezdGgTkpU2vZc6kxJ7UH";

export const API_PATHS = {
  getInMemGameDetails: (gameId: string) => {
    return `gameDataMem/${gameId}`;
  },

  listGames: () => {
    return "listGames";
  },

  viewGameDetails: (gameId: string) => {
    return `viewGame?gameId=${gameId}`;
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
