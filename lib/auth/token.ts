import { createHash, randomBytes } from "node:crypto";

export const sessionLifetimeSeconds = 60 * 60 * 12;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function isSessionToken(value: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(value);
}
