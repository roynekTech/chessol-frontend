import cron from "node-cron";
import { gameService } from "./GameService";

// Create AI vs AI games (every 5 minutes)
cron.schedule("*/2 * * * *", async () => {
  console.log("Start creating AI vs AI games");
  try {
    await gameService.createAiVsAiGame();
    console.log("AI vs AI games created");
  } catch (error) {
    console.error("Error creating AI games:", error);
  }
});

// Check for expired games (every minute)
cron.schedule("* * * * *", async () => {
  console.log("Checking for expired games...");
  try {
    await gameService.endGameAndDetermineWinner();
  } catch (error) {
    console.error("Error in expired games cron job:", error);
  }
});
