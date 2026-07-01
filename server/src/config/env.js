import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 5050),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5175",
  mongoUri: process.env.MONGODB_URI || "",
  adminUsername: process.env.ADMIN_USERNAME || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  adminSessionSecret:
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_TOKEN ||
    "",
  userSessionSecret:
    process.env.USER_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    "",
  adminToken: process.env.ADMIN_TOKEN || "",
  resendApiKey: process.env.RESEND_API_KEY || "",
  resendFrom: process.env.RESEND_FROM || "UNCOVERED <no-reply@example.com>",
  adminEmail: process.env.ADMIN_EMAIL || "",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 12)
};
