import { Router, Request, Response } from "express";
import db from "../database/db";
import { Earthquake } from "../database/schema";
import { calculateDistance } from "../utils/distance";

const router = Router();

/**
 * GET /api/earthquakes
 * Get all earthquakes with optional filters
 */
router.get("/", (req: Request, res: Response) => {
  try {
    const {
      limit = "50",
      offset = "0",
      minMagnitude,
      maxMagnitude,
    } = req.query;

    let query = "SELECT * FROM earthquakes WHERE 1=1";
    const params: any[] = [];

    if (minMagnitude) {
      query += " AND magnitude >= ?";
      params.push(parseFloat(minMagnitude as string));
    }

    if (maxMagnitude) {
      query += " AND magnitude <= ?";
      params.push(parseFloat(maxMagnitude as string));
    }

    query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit as string), parseInt(offset as string));

    const earthquakes = db.prepare(query).all(...params) as Earthquake[];

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM earthquakes WHERE 1=1";
    const countParams: any[] = [];

    if (minMagnitude) {
      countQuery += " AND magnitude >= ?";
      countParams.push(parseFloat(minMagnitude as string));
    }

    if (maxMagnitude) {
      countQuery += " AND magnitude <= ?";
      countParams.push(parseFloat(maxMagnitude as string));
    }

    const { total } = db.prepare(countQuery).get(...countParams) as {
      total: number;
    };

    res.json({
      success: true,
      data: earthquakes,
      pagination: {
        total,
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
router.get("/latest", (req: Request, res: Response) => {
  try {
    const earthquake = db
      .prepare("SELECT * FROM earthquakes ORDER BY timestamp DESC LIMIT 1")
      .get() as Earthquake;

    if (!earthquake) {
      return res.status(404).json({
        success: false,
        error: "No earthquakes found",
      });
    }

    res.json({
      success: true,
      data: earthquake,
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
router.get("/nearby", (req: Request, res: Response) => {
  try {
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
    const allEarthquakes = db
      .prepare("SELECT * FROM earthquakes ORDER BY timestamp DESC")
      .all() as Earthquake[];

    const nearbyEarthquakes = allEarthquakes
      .map((eq) => {
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
router.get("/stats", (req: Request, res: Response) => {
  try {
    const total = db
      .prepare("SELECT COUNT(*) as count FROM earthquakes")
      .get() as {
      count: number;
    };

    const strongest = db
      .prepare("SELECT * FROM earthquakes ORDER BY magnitude DESC LIMIT 1")
      .get() as Earthquake;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const todayCount = db
      .prepare("SELECT COUNT(*) as count FROM earthquakes WHERE timestamp >= ?")
      .get(todayTimestamp) as { count: number };

    const byMagnitude = db
      .prepare(
        `
      SELECT 
        CASE 
          WHEN magnitude < 5 THEN '<5'
          WHEN magnitude >= 5 AND magnitude < 6 THEN '5-6'
          WHEN magnitude >= 6 AND magnitude < 7 THEN '6-7'
          ELSE '7+'
        END as range,
        COUNT(*) as count
      FROM earthquakes
      GROUP BY range
    `
      )
      .all() as { range: string; count: number }[];

    res.json({
      success: true,
      data: {
        total: total.count,
        todayCount: todayCount.count,
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
router.get("/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const earthquake = db
      .prepare("SELECT * FROM earthquakes WHERE id = ?")
      .get(id) as Earthquake;

    if (!earthquake) {
      return res.status(404).json({
        success: false,
        error: "Earthquake not found",
      });
    }

    res.json({
      success: true,
      data: earthquake,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
