// import db from "./db";

// export function initializeDatabase() {
//   // Create earthquakes table
//   db.exec(`
//     CREATE TABLE IF NOT EXISTS earthquakes (
//       id TEXT PRIMARY KEY,
//       datetime TEXT NOT NULL,
//       timestamp INTEGER NOT NULL,
//       magnitude REAL NOT NULL,
//       depth REAL NOT NULL,
//       latitude REAL NOT NULL,
//       longitude REAL NOT NULL,
//       region TEXT NOT NULL,
//       tsunami_potential TEXT,
//       felt_status TEXT,
//       shakemap_url TEXT,
//       created_at INTEGER DEFAULT (strftime('%s', 'now'))
//     )
//   `);

//   // Create index for faster queries
//   db.exec(`
//     CREATE INDEX IF NOT EXISTS idx_earthquakes_timestamp ON earthquakes(timestamp DESC);
//     CREATE INDEX IF NOT EXISTS idx_earthquakes_magnitude ON earthquakes(magnitude);
//     CREATE INDEX IF NOT EXISTS idx_earthquakes_coords ON earthquakes(latitude, longitude);
//   `);

//   // Create fetch logs table
//   db.exec(`
//     CREATE TABLE IF NOT EXISTS fetch_logs (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       fetch_type TEXT NOT NULL,
//       status TEXT NOT NULL,
//       message TEXT,
//       created_at INTEGER DEFAULT (strftime('%s', 'now'))
//     )
//   `);

//   console.log("✅ Database initialized successfully");
// }

// export interface Earthquake {
//   id: string;
//   datetime: string;
//   timestamp: number;
//   magnitude: number;
//   depth: number;
//   latitude: number;
//   longitude: number;
//   region: string;
//   tsunami_potential: string | null;
//   felt_status: string | null;
//   shakemap_url: string | null;
//   created_at: number;
// }
