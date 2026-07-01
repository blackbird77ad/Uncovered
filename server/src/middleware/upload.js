import { mkdirSync } from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";

const uploadRoot = path.resolve(process.cwd(), env.uploadDir);
mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadRoot);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname);
    const basename = path
      .basename(file.originalname, extension)
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase()
      .slice(0, 40);
    callback(null, `${Date.now()}-${basename}${extension}`);
  }
});

const allowedMime = /^(image|video|audio)\//;
const allowedExtensions = /\.(pdf|doc|docx|txt|csv|xlsx|xls)$/i;

export const evidenceUpload = multer({
  storage,
  limits: {
    files: 7,
    fileSize: env.maxUploadMb * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (allowedMime.test(file.mimetype) || allowedExtensions.test(file.originalname)) {
      callback(null, true);
      return;
    }

    callback(new Error("Unsupported evidence file type"));
  }
});
