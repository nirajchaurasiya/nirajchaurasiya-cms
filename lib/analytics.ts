import "server-only";

import {
  createHmac,
} from "node:crypto";

export function hashAnalyticsSession(
  sessionId: string,
) {
  const secret =
    process.env.ANALYTICS_HASH_SECRET;

  if (!secret) {
    throw new Error(
      "ANALYTICS_HASH_SECRET is not configured.",
    );
  }

  return createHmac(
    "sha256",
    secret,
  )
    .update(sessionId)
    .digest("hex");
}

export function detectDeviceType(
  userAgent: string,
):
  | "desktop"
  | "mobile"
  | "tablet"
  | "unknown" {
  const normalized =
    userAgent.toLowerCase();

  if (
    normalized.includes("ipad") ||
    normalized.includes("tablet")
  ) {
    return "tablet";
  }

  if (
    normalized.includes("mobile") ||
    normalized.includes("iphone") ||
    normalized.includes("android")
  ) {
    return "mobile";
  }

  if (
    normalized.includes("windows") ||
    normalized.includes("macintosh") ||
    normalized.includes("linux")
  ) {
    return "desktop";
  }

  return "unknown";
}

export function readCountryCode(
  headers: Headers,
) {
  return (
    headers.get("cf-ipcountry") ??
    headers.get("x-vercel-ip-country") ??
    headers.get("x-country-code") ??
    null
  );
}