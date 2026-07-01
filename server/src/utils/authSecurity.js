import crypto from "node:crypto";

const KEY_LENGTH = 32;
const ITERATIONS = 210000;
const DIGEST = "sha256";

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(String(password), salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString("hex");
  return `pbkdf2:${ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password, storedHash = "") {
  const [scheme, iterations, salt, hash] = String(storedHash).split(":");

  if (scheme !== "pbkdf2" || !iterations || !salt || !hash) {
    return false;
  }

  const candidate = crypto
    .pbkdf2Sync(String(password), salt, Number(iterations), KEY_LENGTH, DIGEST)
    .toString("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
  } catch {
    return false;
  }
}
