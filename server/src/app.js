import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { env } from "./config/env.js";
import { adminRoutes } from "./routes/adminRoutes.js";
import { publicRoutes } from "./routes/publicRoutes.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: false
    })
  );
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true
    })
  );
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(path.resolve(process.cwd(), env.uploadDir)));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 240,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.use("/api", publicRoutes);
  app.use("/api/admin", adminRoutes);

  app.use((_req, res) => {
    res.status(404).json({
      message: "Route not found"
    });
  });

  app.use((error, _req, res, _next) => {
    const statusCode = error.statusCode || 500;
    const message =
      statusCode === 500 && env.nodeEnv === "production"
        ? "Something went wrong"
        : error.message;

    if (statusCode === 500) {
      console.error(error);
    }

    res.status(statusCode).json({ message });
  });

  return app;
}
