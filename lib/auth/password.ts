import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// OWASP's 16 MiB scrypt profile. Node's built-in implementation also works in
// the bootstrap CLI, without a runtime-specific password format.
const parameters = { N: 16384, r: 8, p: 5, maxmem: 32 * 1024 * 1024 };
const keyLength = 64;

function deriveKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, parameters, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await deriveKey(password, salt);
  return `scrypt-v1$${salt}$${key.toString("hex")}`;
}

// Unknown accounts take the expensive verification path too; this dummy hash
// never grants access without a real account match.
export const dummyPasswordHash = `scrypt-v1$${"0".repeat(32)}$${"0".repeat(128)}`;

export async function verifyPassword(password: string, encoded: string) {
  const [version, salt, hash, extra] = encoded.split("$");
  if (version !== "scrypt-v1" || extra !== undefined ||
      !/^[a-f0-9]{32}$/.test(salt ?? "") || !/^[a-f0-9]{128}$/.test(hash ?? "")) {
    return false;
  }
  const actual = await deriveKey(password, salt);
  return timingSafeEqual(actual, Buffer.from(hash, "hex"));
}
