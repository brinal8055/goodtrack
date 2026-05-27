const KEY_LENGTH = 32;
const DIGEST = "SHA-256";

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left[index] ^ right[index];
  }
  return diff === 0;
}

async function pbkdf2(password: string, salt: string, iterations: number) {
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits"
  ]);
  const bits = await globalThis.crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: DIGEST, salt: encoder.encode(salt), iterations },
    key,
    KEY_LENGTH * 8
  );
  return new Uint8Array(bits);
}

async function saltedSha256(password: string, salt: string) {
  return new Uint8Array(await globalThis.crypto.subtle.digest(DIGEST, new TextEncoder().encode(`${salt}:${password}`)));
}

export async function hashPassword(password: string, salt = bytesToHex(globalThis.crypto.getRandomValues(new Uint8Array(16)))) {
  const hash = bytesToHex(await saltedSha256(password, salt));
  return `sha256$${salt}$${hash}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [scheme, first, second, third] = storedHash.split("$");

  if (scheme === "sha256" && first && second) {
    const candidate = await saltedSha256(password, first);
    return constantTimeEqual(hexToBytes(second), candidate);
  }

  if (scheme !== "pbkdf2" || !first || !second || !third) return false;

  try {
    const iterations = Number(first);
    const candidate = await pbkdf2(password, second, iterations);
    return constantTimeEqual(hexToBytes(third), candidate);
  } catch {
    return false;
  }
}
