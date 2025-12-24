import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

let supabase: SupabaseClient | null = null;

// Only initialize if credentials are provided
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("✅ Supabase client initialized");
} else {
  console.log("⚠️  Supabase credentials not configured - using SQLite only");
}

export { supabase };

export interface SupabaseEarthquake {
  id: string;
  datetime: string;
  timestamp: number;
  magnitude: number;
  depth: number;
  latitude: number;
  longitude: number;
  region: string;
  tsunami_potential: string | null;
  felt_status: string | null;
  shakemap_url: string | null;
  created_at: number;
}

/**
 * Insert or update earthquake data in Supabase
 */
export async function upsertEarthquake(
  earthquake: SupabaseEarthquake
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("earthquakes")
      .upsert(earthquake, { onConflict: "id" });

    if (error) {
      console.error("Supabase upsert error:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Supabase upsert exception:", error);
    return false;
  }
}

/**
 * Insert multiple earthquakes in batch
 */
export async function upsertEarthquakes(
  earthquakes: SupabaseEarthquake[]
): Promise<number> {
  if (!supabase || earthquakes.length === 0) return 0;

  try {
    const { error } = await supabase
      .from("earthquakes")
      .upsert(earthquakes, { onConflict: "id" });

    if (error) {
      console.error("Supabase batch upsert error:", error.message);
      return 0;
    }

    return earthquakes.length;
  } catch (error) {
    console.error("Supabase batch upsert exception:", error);
    return 0;
  }
}

/**
 * Fetch all earthquakes from Supabase
 */
export async function fetchEarthquakesFromSupabase(
  limit: number = 100
): Promise<SupabaseEarthquake[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("earthquakes")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Supabase fetch error:", error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Supabase fetch exception:", error);
    return [];
  }
}

/**
 * Check if Supabase is configured and available
 */
export function isSupabaseAvailable(): boolean {
  return supabase !== null;
}
