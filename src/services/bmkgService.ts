import axios from "axios";
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
 * Parse BMKG earthquake data and insert into Supabase
 */
async function parseAndInsertEarthquake(data: BMKGEarthquake): Promise<void> {
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

    // Prepare earthquake object for Supabase
    const earthquakeData: SupabaseEarthquake = {
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

    // Insert into Supabase
    const success = await upsertEarthquake(earthquakeData);

    if (success) {
      console.log(`✅ Inserted earthquake: M${magnitude} - ${data.Wilayah}`);
    } else {
      console.log(
        `⚠️  Failed to insert earthquake: M${magnitude} - ${data.Wilayah}`
      );
    }
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
      await parseAndInsertEarthquake(gempa);
    }

    console.log("✅ Fetched latest earthquake");
  } catch (error: any) {
    console.error("Error fetching latest earthquake:", error.message);
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
      for (const gempa of gempaList) {
        await parseAndInsertEarthquake(gempa);
      }
      console.log(`✅ Fetched ${gempaList.length} M5.0+ earthquakes`);
    }
  } catch (error: any) {
    console.error("Error fetching M5.0+ earthquakes:", error.message);
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
      for (const gempa of gempaList) {
        await parseAndInsertEarthquake(gempa);
      }
      console.log(`✅ Fetched ${gempaList.length} felt earthquakes`);
    }
  } catch (error: any) {
    console.error("Error fetching felt earthquakes:", error.message);
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
