import { GameService } from "../GameService";
import { GameTimeControl, GameType } from "../../models/types";

interface AIManagerOptions {
  targetGameCount: number;
  checkInterval: number; // milliseconds
  minAiLevel: number;
  maxAiLevel: number;
}

/**
 * Service to manage a pool of AI vs AI games
 */
const AIManagerService = {
  isRunning: false,
  intervalId: null as NodeJS.Timeout | null,
  options: {
    targetGameCount: 10,
    checkInterval: 30000, // 30 seconds
    minAiLevel: 5,
    maxAiLevel: 15,
  } as AIManagerOptions,

  /**
   * Initialize the AI game manager with options
   */
  initialize: (options?: Partial<AIManagerOptions>): void => {
    if (options) {
      AIManagerService.options = { ...AIManagerService.options, ...options };
    }
    console.log(
      `AI Manager initialized with target of ${AIManagerService.options.targetGameCount} games`
    );
  },

  /**
   * Start the AI game manager
   */
  start: (): void => {
    if (AIManagerService.isRunning) {
      console.log("AI Manager is already running");
      return;
    }

    console.log("Starting AI Manager service...");
    AIManagerService.isRunning = true;

    // Perform an initial check immediately
    AIManagerService.checkAndCreateGames();

    // Set up interval to check periodically
    AIManagerService.intervalId = setInterval(
      AIManagerService.checkAndCreateGames,
      AIManagerService.options.checkInterval
    );

    console.log(
      `AI Manager service started with check interval of ${AIManagerService.options.checkInterval}ms`
    );
  },

  /**
   * Stop the AI game manager
   */
  stop: (): void => {
    if (!AIManagerService.isRunning || !AIManagerService.intervalId) {
      console.log("AI Manager is not running");
      return;
    }

    clearInterval(AIManagerService.intervalId);
    AIManagerService.isRunning = false;
    AIManagerService.intervalId = null;
    console.log("AI Manager service stopped");
  },

  /**
   * Check the current number of active AI games and create new ones if needed
   */
  checkAndCreateGames: async (): Promise<void> => {
    try {
      // Count current active AI games
      const activeGamesCount = await GameService.countActiveAiGames();
      console.log(`Current active AI games: ${activeGamesCount}`);

      // Calculate how many new games to create
      const gamesNeeded = Math.max(
        0,
        AIManagerService.options.targetGameCount - activeGamesCount
      );

      if (gamesNeeded === 0) {
        console.log("No new AI games needed");
        return;
      }

      console.log(`Creating ${gamesNeeded} new AI games...`);

      // Create the required number of games
      for (let i = 0; i < gamesNeeded; i++) {
        await AIManagerService.createRandomAiGame();
      }
    } catch (error) {
      console.error(
        `Error in checkAndCreateGames: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },

  /**
   * Create a new AI vs AI game with random difficulty levels
   */
  createRandomAiGame: async (): Promise<void> => {
    try {
      // Generate random AI difficulty levels within the configured range
      const whiteAiDifficulty = getRandomInt(
        AIManagerService.options.minAiLevel,
        AIManagerService.options.maxAiLevel
      );

      const blackAiDifficulty = getRandomInt(
        AIManagerService.options.minAiLevel,
        AIManagerService.options.maxAiLevel
      );

      // Generate random time control (for variety)
      const timeControls = [
        {
          type: GameTimeControl.BLITZ,
          initial: 300, // 5 minutes
          increment: 2,
        },
        {
          type: GameTimeControl.RAPID,
          initial: 600, // 10 minutes
          increment: 5,
        },
        {
          type: GameTimeControl.CLASSICAL,
          initial: 1800, // 30 minutes
          increment: 10,
        },
      ];

      const randomTimeControl =
        timeControls[Math.floor(Math.random() * timeControls.length)];

      // Create the game
      const game = await GameService.createGame({
        gameType: GameType.AI_VS_AI,
        whiteAiDifficulty,
        blackAiDifficulty,
        timeControl: randomTimeControl,
        isRated: false, // AI games are not rated
        chatEnabled: true,
      });

      console.log(
        `Created AI vs AI game: ${game._id} (White: skill ${whiteAiDifficulty}, Black: skill ${blackAiDifficulty})`
      );
    } catch (error) {
      console.error(
        `Error creating random AI game: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
};

/**
 * Utility function to get a random integer between min and max (inclusive)
 */
const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export default AIManagerService;
