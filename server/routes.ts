
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

const crimes: any[] = [];

const filePath = path.resolve(
  process.cwd(),
  "GoogleMaps_geocoded_data_MUMBAI.csv"
);

// Load CSV once
fs.createReadStream(filePath)
  .pipe(csv())
  .on("data", (data) => crimes.push(data))
  .on("end", () => {
    console.log("Crime dataset loaded:", crimes.length);
  })
  .on("error", (err) => {
    console.error("CSV read error:", err);
  });

function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export async function registerRoutes(app: Express): Promise<Server> {

  app.get("/api/data", (_req: Request, res: Response) => {
    res.json(crimes);
  });

  app.post("/api/predict", (req: Request, res: Response) => {
    try {
      const { lat, long } = req.body;

      if (lat === undefined || long === undefined) {
        return res.status(400).json({ error: "lat and long are required" });
      }

      const userLat = Number(lat);
      const userLng = Number(long);

      let riskScore = 0;

      for (const crime of crimes) {
        const crimeLat = parseFloat(crime.Latitude);
        const crimeLng = parseFloat(crime.Longitude);

        if (!isNaN(crimeLat) && !isNaN(crimeLng)) {
          const d = distance(userLat, userLng, crimeLat, crimeLng);

          if (d < 1) {
            let weight = 0;

            if (d < 0.2) weight = 1;
            else if (d < 0.5) weight = 0.6;
            else weight = 0.3;

            riskScore += weight;
          }
        }
      }

      let score = 10 - riskScore;

      if (score < 1) score = 1;
      if (score > 10) score = 10;

      return res.json({
        safety_score: Number(score.toFixed(1)),
        risk_index: Number(riskScore.toFixed(2))
      });

    } catch (error) {
      console.error("Predict route error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/feedback", (req: Request, res: Response) => {
    const { latitude, longitude, rating } = req.body;

    console.log(
      `Safety feedback: lat=${latitude}, lng=${longitude}, rating=${rating}`
    );

    return res.json({ success: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}