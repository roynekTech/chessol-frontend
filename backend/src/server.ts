import express from "express";
import cors from "cors";
import { ENV } from "./config/constants";
import connectDB from "./config/database";

// import and initialize cron jobs
import "./services/cronJobService";

// Import routes
import gameRoutes from "./routes/gameRoutes";

// Initialize Express app
const app = express();
const PORT = ENV.PORT;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API endpoints
app.use("/api/games", gameRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Chess API is running",
    environment: ENV.NODE_ENV,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${ENV.NODE_ENV}`);
});
