import crypto from "node:crypto";

const ITERATIONS = 120_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `pbkdf2$${ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [scheme, iterationsText, salt, originalHash] = storedHash.split("$");
  if (scheme !== "pbkdf2" || !iterationsText || !salt || !originalHash) return false;

  const iterations = Number(iterationsText);
  const candidate = crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST);
  const original = Buffer.from(originalHash, "hex");
  return original.length === candidate.length && crypto.timingSafeEqual(original, candidate);
}
