import axios from "axios";
import db from "../database/db";
import { Earthquake } from "../database/schema";
import { upsertEarthquake, SupabaseEarthquake } from "../database/supabase";

const BMKG_BASE_URL = "https://data.bmkg.go.id";

interface BMKGEarthquake {
  Tanggal: string;
  Jam: string;
  DateTime: string;
  Coordinates: string;
  Lintang: string;
  Bujur: string;
  Magnitude: string;
  Kedalaman: string;
  Wilayah: string;
  Potensi: string;
  Dirasakan?: string;
  Shakemap?: string;
}

interface BMKGResponse {
  Infogempa: {
    gempa: BMKGEarthquake | BMKGEarthquake[];
  };
}

/**
 * Parse BMKG earthquake data and insert into database (SQLite + Supabase)
 */
function parseAndInsertEarthquake(data: BMKGEarthquake): void {
  try {
    // Parse coordinates
    const coords = data.Coordinates.split(",");
    const latitude = parseFloat(coords[0]);
    const longitude = parseFloat(coords[1]);

    // Parse magnitude and depth
    const magnitude = parseFloat(data.Magnitude);
    const depth = parseFloat(data.Kedalaman.replace(" km", ""));

    // Create unique ID from datetime and coordinates
    const id = `${data.DateTime}_${latitude}_${longitude}`.replace(
      /[:\s]/g,
      "_"
    );

    // Convert datetime to timestamp
    const datetime = `${data.Tanggal} ${data.Jam}`;
    const timestamp = new Date(data.DateTime).getTime();
    const created_at = Date.now();

    // Prepare earthquake object
    const earthquakeData = {
      id,
      datetime,
      timestamp,
      magnitude,
      depth,
      latitude,
      longitude,
      region: data.Wilayah,
      tsunami_potential: data.Potensi || null,
      felt_status: data.Dirasakan || null,
      shakemap_url: data.Shakemap ? `${BMKG_BASE_URL}/${data.Shakemap}` : null,
      created_at,
    };

    // Insert into SQLite
    const insert = db.prepare(`
      INSERT OR REPLACE INTO earthquakes 
      (id, datetime, timestamp, magnitude, depth, latitude, longitude, region, tsunami_potential, felt_status, shakemap_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      earthquakeData.id,
      earthquakeData.datetime,
      earthquakeData.timestamp,
      earthquakeData.magnitude,
      earthquakeData.depth,
      earthquakeData.latitude,
      earthquakeData.longitude,
      earthquakeData.region,
      earthquakeData.tsunami_potential,
      earthquakeData.felt_status,
      earthquakeData.shakemap_url,
      earthquakeData.created_at
    );

    // Also insert into Supabase (async, non-blocking)
    upsertEarthquake(earthquakeData as SupabaseEarthquake).catch((error) => {
      console.error(`⚠️  Supabase sync failed for ${id}:`, error);
    });

    console.log(`✅ Inserted earthquake: M${magnitude} - ${data.Wilayah}`);
  } catch (error) {
    console.error("Error parsing earthquake data:", error);
  }
}

/**
 * Fetch latest earthquake from BMKG
 */
export async function fetchLatestEarthquake(): Promise<void> {
  try {
    const response = await axios.get<BMKGResponse>(
      `${BMKG_BASE_URL}/DataMKG/TEWS/autogempa.json`,
      { timeout: 10000 }
    );

    const gempa = response.data.Infogempa.gempa;
    if (gempa && !Array.isArray(gempa)) {
      parseAndInsertEarthquake(gempa);
    }

    // Log fetch
    const log = db.prepare(
      "INSERT INTO fetch_logs (fetch_type, status, message) VALUES (?, ?, ?)"
    );
    log.run("autogempa", "success", "Fetched latest earthquake");
  } catch (error: any) {
    console.error("Error fetching latest earthquake:", error.message);
    const log = db.prepare(
      "INSERT INTO fetch_logs (fetch_type, status, message) VALUES (?, ?, ?)"
    );
    log.run("autogempa", "error", error.message);
  }
}

/**
 * Fetch M 5.0+ earthquakes from BMKG
 */
export async function fetchM5Earthquakes(): Promise<void> {
  try {
    const response = await axios.get<BMKGResponse>(
      `${BMKG_BASE_URL}/DataMKG/TEWS/gempaterkini.json`,
      { timeout: 10000 }
    );

    const gempaList = response.data.Infogempa.gempa;
    if (Array.isArray(gempaList)) {
      gempaList.forEach(parseAndInsertEarthquake);
    }

    const log = db.prepare(
      "INSERT INTO fetch_logs (fetch_type, status, message) VALUES (?, ?, ?)"
    );
    log.run(
      "gempaterkini",
      "success",
      `Fetched ${gempaList} M5.0+ earthquakes`
    );
  } catch (error: any) {
    console.error("Error fetching M5.0+ earthquakes:", error.message);
    const log = db.prepare(
      "INSERT INTO fetch_logs (fetch_type, status, message) VALUES (?, ?, ?)"
    );
    log.run("gempaterkini", "error", error.message);
  }
}

/**
 * Fetch felt earthquakes from BMKG
 */
export async function fetchFeltEarthquakes(): Promise<void> {
  try {
    const response = await axios.get<BMKGResponse>(
      `${BMKG_BASE_URL}/DataMKG/TEWS/gempadirasakan.json`,
      { timeout: 10000 }
    );

    const gempaList = response.data.Infogempa.gempa;
    if (Array.isArray(gempaList)) {
      gempaList.forEach(parseAndInsertEarthquake);
    }

    const log = db.prepare(
      "INSERT INTO fetch_logs (fetch_type, status, message) VALUES (?, ?, ?)"
    );
    log.run(
      "gempadirasakan",
      "success",
      `Fetched ${gempaList} felt earthquakes`
    );
  } catch (error: any) {
    console.error("Error fetching felt earthquakes:", error.message);
    const log = db.prepare(
      "INSERT INTO fetch_logs (fetch_type, status, message) VALUES (?, ?, ?)"
    );
    log.run("gempadirasakan", "error", error.message);
  }
}

/**
 * Fetch all earthquake data from BMKG
 */
export async function fetchAllEarthquakes(): Promise<void> {
  console.log("🔄 Fetching earthquake data from BMKG...");
  await Promise.all([
    fetchLatestEarthquake(),
    fetchM5Earthquakes(),
    fetchFeltEarthquakes(),
  ]);
  console.log("✅ Finished fetching earthquake data");
}
