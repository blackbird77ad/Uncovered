import crypto from "node:crypto";
import { env } from "../config/env.js";

function tokenFromRequest(req) {
  const authHeader = req.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
}

function base64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(value) {
  return crypto.createHmac("sha256", env.userSessionSecret).update(value).digest("base64url");
}

export function createUserSession(user) {
  if (!env.userSessionSecret) {
    return "";
  }

  const payload = base64Url(
    JSON.stringify({
      sub: user.userId,
      email: user.email,
      phone: user.phone,
      username: user.username,
      displayName: user.displayName,
      role: "registered_user",
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30
    })
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyUserSession(token) {
  if (!token || !env.userSessionSecret || !token.includes(".")) {
    return null;
  }

  const [payload, signature] = token.split(".");
  const expected = sign(payload);

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (decoded.exp <= Date.now() || decoded.role !== "registered_user") {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export function optionalUser(req, res, next) {
  const token = tokenFromRequest(req);

  if (!token) {
    return next();
  }

  const decoded = verifyUserSession(token);
  if (!decoded) {
    return res.status(401).json({ message: "User session is invalid" });
  }

  req.user = decoded;
  return next();
}

export function requireUser(req, res, next) {
  const token = tokenFromRequest(req);
  const decoded = verifyUserSession(token);

  if (!decoded) {
    return res.status(401).json({ message: "Sign in to continue" });
  }

  req.user = decoded;
  return next();
}
