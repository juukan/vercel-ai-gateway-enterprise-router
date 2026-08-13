import { timingSafeEqual } from "node:crypto";

function safeEqual(left, right) {
  if (!left || !right) return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function bearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== "string") return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  return match?.[1];
}

export function verifyOverrideToken(authorizationHeader, expectedToken) {
  return safeEqual(bearerToken(authorizationHeader), expectedToken);
}

export function verifyApiToken(authorizationHeader, expectedToken) {
  if (!expectedToken) return true;
  return safeEqual(bearerToken(authorizationHeader), expectedToken);
}

