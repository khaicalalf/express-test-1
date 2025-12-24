import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";
import { fetchAllEarthquakes } from "./services/bmkgService.js";
import earthquakesRouter from "./routes/earthquakes.js";
import { isSupabaseAvailable } from "./database/supabase.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Check Supabase configuration
if (!isSupabaseAvailable()) {
  console.warn("⚠️  WARNING: Supabase is not configured!");
  console.warn(
    "⚠️  Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file"
  );
  console.warn("⚠️  The API will not work without database configuration");
} else {
  // Initial fetch only if Supabase is available
  console.log("🚀 Starting initial earthquake data fetch...");
  fetchAllEarthquakes();

  // Schedule periodic fetches (every 5 minutes by default)
  const fetchInterval = parseInt(process.env.FETCH_INTERVAL || "5");
  cron.schedule(`*/${fetchInterval} * * * *`, () => {
    console.log(
      `⏰ Scheduled fetch triggered (every ${fetchInterval} minutes)`
    );
    fetchAllEarthquakes();
  });
}

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Earthquake Early Warning API - Indonesia",
    version: "1.0.0",
    dataSource: "BMKG Indonesia",
    database: isSupabaseAvailable() ? "Supabase (Connected)" : "Not Configured",
    endpoints: {
      earthquakes: "/api/earthquakes",
      latest: "/api/earthquakes/latest",
      nearby: "/api/earthquakes/nearby?lat=&lng=&radius=",
      stats: "/api/earthquakes/stats",
      byId: "/api/earthquakes/:id",
    },
  });
});

app.use("/api/earthquakes", earthquakesRouter);

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`\n🌍 Earthquake Early Warning Server`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  if (isSupabaseAvailable()) {
    console.log(
      `🔄 Auto-fetch interval: ${process.env.FETCH_INTERVAL || 5} minutes`
    );
  }
  console.log(`📊 Data source: BMKG Indonesia\n`);
});
