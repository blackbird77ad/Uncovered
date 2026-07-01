import { env } from "../config/env.js";
import crypto from "node:crypto";

function tokenFromRequest(req) {
  const authHeader = req.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  return req.get("x-admin-token") || bearer;
}

function base64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(value) {
  return crypto.createHmac("sha256", env.adminSessionSecret).update(value).digest("base64url");
}

export function createAdminSession(username) {
  if (!env.adminSessionSecret) {
    return "";
  }

  const payload = base64Url(
    JSON.stringify({
      sub: username,
      role: "administrator",
      exp: Date.now() + 1000 * 60 * 60 * 8
    })
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSession(token) {
  if (!token || !env.adminSessionSecret || !token.includes(".")) {
    return false;
  }

  const [payload, signature] = token.split(".");
  const expected = sign(payload);

  try {
    if (
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return false;
    }
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return decoded.exp > Date.now() && decoded.role === "administrator";
  } catch {
    return false;
  }
}

export function requireAdmin(req, res, next) {
  if (!env.adminToken && !env.adminSessionSecret) {
    return res.status(503).json({
      message: "Admin auth is not configured on the server"
    });
  }

  const token = tokenFromRequest(req);
  const tokenMatches = env.adminToken && token === env.adminToken;
  const sessionMatches = verifyAdminSession(token);

  if (!tokenMatches && !sessionMatches) {
    return res.status(401).json({
      message: "Admin session is invalid"
    });
  }

  return next();
}
