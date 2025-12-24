// import Database from "better-sqlite3";
// import path from "path";
// import fs from "fs";

// const dbPath = process.env.DATABASE_PATH || "./data/earthquakes.db";
// const dbDir = path.dirname(dbPath);

// // Create data directory if it doesn't exist
// if (!fs.existsSync(dbDir)) {
//   fs.mkdirSync(dbDir, { recursive: true });
// }

// const db = new Database(dbPath);

// // Enable WAL mode for better concurrency
// db.pragma("journal_mode = WAL");

// export default db;
