import { GameModel, GameDifficultyEnum, GameStatusEnum } from "../models/Game";
import { GameTypeEnum } from "../models/types";
import { baseHelper } from "../utils/baseHelper";
import { DateTime } from "luxon";
import { gameUtils } from "../utils/gameUtils";

async function getActiveGames() {
  const games = await GameModel.find({
    status: GameStatusEnum.ACTIVE,
  });
  return games;
}

async function createAiVsAiGame() {
  console.log("createAiVsAiGame start");
  const MAX_GAMES = 10;
  const DEFAULT_DURATION = 5 * 60; // 5 minutes

  const activeGamesCount = await GameModel.countDocuments({
    gameType: GameTypeEnum.AI_VS_AI,
    status: GameStatusEnum.ACTIVE,
  });

  console.log("activeGamesCount", activeGamesCount);

  if (activeGamesCount >= MAX_GAMES) return;

  const gamesToCreate = MAX_GAMES - activeGamesCount;

  console.log("gamesToCreate", gamesToCreate);

  const startTime = DateTime.now();
  const endTime = startTime.plus({ seconds: DEFAULT_DURATION });
  const modes = [
    GameDifficultyEnum.EASY,
    GameDifficultyEnum.MEDIUM,
    GameDifficultyEnum.HARD,
  ];
  const randomMode = modes[Math.floor(Math.random() * modes.length)];

  const createGamesPromises = [];

  for (let i = 0; i < gamesToCreate; i++) {
    console.log("creating game", i);
    createGamesPromises.push(
      GameModel.create({
        whitePlayerUsername: baseHelper.getRandomUsername(),
        blackPlayerUsername: baseHelper.getRandomUsername(),
        gameType: GameTypeEnum.AI_VS_AI,
        status: GameStatusEnum.ACTIVE,
        difficulty: randomMode,
        startTime,
        endTime,
      })
    );
  }

  console.log("createGamesPromises length", createGamesPromises.length);

  await Promise.all(createGamesPromises);
}

/**
 * Finds games with past end times and determines winners
 * Uses bulkWrite for efficiency instead of individual saves
 */
async function endGameAndDetermineWinner(): Promise<void> {
  try {
    const now = new Date();

    // Find active games where end time has passed
    const expiredGames = await GameModel.find({
      status: { $in: [GameStatusEnum.ACTIVE, GameStatusEnum.ABANDONED] },
      endTime: { $lt: now },
    });

    if (expiredGames.length === 0) {
      console.log("No games need to be ended");
      return;
    }

    console.log(`Found ${expiredGames.length} games that need to be ended`);

    // Process games in parallel for efficiency
    const updateOperations = await Promise.all(
      expiredGames.map(async (game) => {
        // Determine game outcome based on current position
        const { status, result } = gameUtils.determineGameOutcome(game);

        // Set completed time if not already set
        const completedAt = game.completedAt || now;

        // Return the update operation for bulkWrite
        return {
          updateOne: {
            filter: { _id: game._id },
            update: {
              $set: {
                status,
                result,
                completedAt,
              },
            },
          },
        };
      })
    );

    // Use bulkWrite for efficiency instead of individual saves
    if (updateOperations.length > 0) {
      const result = await GameModel.bulkWrite(updateOperations);
      console.log(`Updated ${result.modifiedCount} expired games`);
    }
  } catch (error) {
    console.error("Error ending games:", error);
    throw error;
  }
}

export const gameService = {
  getActiveGames,
  createAiVsAiGame,
  endGameAndDetermineWinner,
};
