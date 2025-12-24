import { Router, Request, Response } from "express";
import { supabase, isSupabaseAvailable } from "../database/supabase";
import { Earthquake } from "../database/schema";
import { calculateDistance } from "../utils/distance";

const router = Router();

/**
 * GET /api/earthquakes
 * Get all earthquakes with optional filters
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    if (!isSupabaseAvailable()) {
      return res.status(503).json({
        success: false,
        error:
          "Database not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env",
      });
    }

    const {
      limit = "50",
      offset = "0",
      minMagnitude,
      maxMagnitude,
    } = req.query;

    let query = supabase!.from("earthquakes").select("*", { count: "exact" });

    if (minMagnitude) {
      query = query.gte("magnitude", parseFloat(minMagnitude as string));
    }

    if (maxMagnitude) {
      query = query.lte("magnitude", parseFloat(maxMagnitude as string));
    }

    const {
      data: earthquakes,
      error,
      count,
    } = await query
      .order("timestamp", { ascending: false })
      .range(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string) - 1
      );

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      data: earthquakes,
      pagination: {
        total: count || 0,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/earthquakes/latest
 * Get the latest earthquake
 */
router.get("/latest", async (req: Request, res: Response) => {
  try {
    if (!isSupabaseAvailable()) {
      return res.status(503).json({
        success: false,
        error:
          "Database not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env",
      });
    }

    const { data: earthquakes, error } = await supabase!
      .from("earthquakes")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    if (!earthquakes || earthquakes.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No earthquakes found",
      });
    }

    res.json({
      success: true,
      data: earthquakes[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/earthquakes/nearby
 * Get earthquakes within a radius of coordinates
 */
router.get("/nearby", async (req: Request, res: Response) => {
  try {
    if (!isSupabaseAvailable()) {
      return res.status(503).json({
        success: false,
        error:
          "Database not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env",
      });
    }

    const { lat, lng, radius = "100" } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: "Latitude and longitude are required",
      });
    }

    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);
    const radiusKm = parseFloat(radius as string);

    // Get all earthquakes and filter by distance
    const { data: allEarthquakes, error } = await supabase!
      .from("earthquakes")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const nearbyEarthquakes = (allEarthquakes || [])
      .map((eq: Earthquake) => {
        const distance = calculateDistance(
          userLat,
          userLng,
          eq.latitude,
          eq.longitude
        );
        return {
          ...eq,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        };
      })
      .filter((eq) => eq.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: nearbyEarthquakes,
      userLocation: {
        latitude: userLat,
        longitude: userLng,
      },
      radius: radiusKm,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/earthquakes/stats
 * Get earthquake statistics
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    if (!isSupabaseAvailable()) {
      return res.status(503).json({
        success: false,
        error:
          "Database not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env",
      });
    }

    // Get total count
    const { count: total, error: totalError } = await supabase!
      .from("earthquakes")
      .select("*", { count: "exact", head: true });

    if (totalError) {
      throw new Error(totalError.message);
    }

    // Get strongest earthquake
    const { data: strongestData, error: strongestError } = await supabase!
      .from("earthquakes")
      .select("*")
      .order("magnitude", { ascending: false })
      .limit(1);

    if (strongestError) {
      throw new Error(strongestError.message);
    }

    const strongest = strongestData?.[0] || null;

    // Get today's count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const { count: todayCount, error: todayError } = await supabase!
      .from("earthquakes")
      .select("*", { count: "exact", head: true })
      .gte("timestamp", todayTimestamp);

    if (todayError) {
      throw new Error(todayError.message);
    }

    // Get all earthquakes for magnitude grouping
    const { data: allEarthquakes, error: allError } = await supabase!
      .from("earthquakes")
      .select("magnitude");

    if (allError) {
      throw new Error(allError.message);
    }

    // Group by magnitude ranges
    const byMagnitude = [
      { range: "<5", count: 0 },
      { range: "5-6", count: 0 },
      { range: "6-7", count: 0 },
      { range: "7+", count: 0 },
    ];

    (allEarthquakes || []).forEach((eq: { magnitude: number }) => {
      if (eq.magnitude < 5) {
        byMagnitude[0].count++;
      } else if (eq.magnitude >= 5 && eq.magnitude < 6) {
        byMagnitude[1].count++;
      } else if (eq.magnitude >= 6 && eq.magnitude < 7) {
        byMagnitude[2].count++;
      } else {
        byMagnitude[3].count++;
      }
    });

    res.json({
      success: true,
      data: {
        total: total || 0,
        todayCount: todayCount || 0,
        strongest,
        byMagnitude,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/earthquakes/:id
 * Get a specific earthquake by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    if (!isSupabaseAvailable()) {
      return res.status(503).json({
        success: false,
        error:
          "Database not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env",
      });
    }

    const { id } = req.params;

    const { data: earthquakes, error } = await supabase!
      .from("earthquakes")
      .select("*")
      .eq("id", id)
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    if (!earthquakes || earthquakes.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Earthquake not found",
      });
    }

    res.json({
      success: true,
      data: earthquakes[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
