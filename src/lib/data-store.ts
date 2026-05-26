import fs from "node:fs/promises";
import path from "node:path";

import { syncDerivedAlerts } from "@/lib/alerts";
import { createSeedData } from "@/lib/seed";
import type { TextileTrackData } from "@/lib/types";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(STORE_DIR, "textiletrack.json");

let cachedData: TextileTrackData | null = null;
let canPersistToFile = true;

function isMissingFileError(error: unknown) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function isUnavailableFileSystemError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const code = "code" in error ? error.code : undefined;
  return code === "EPERM" || code === "EACCES" || code === "EROFS" || code === "ENOSYS";
}

async function persist(data: TextileTrackData) {
  if (!canPersistToFile) return;

  try {
    await fs.mkdir(STORE_DIR, { recursive: true });
    await fs.writeFile(STORE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    if (!isUnavailableFileSystemError(error)) throw error;

    canPersistToFile = false;
    console.warn("File persistence is unavailable; using in-memory demo data for this runtime.");
  }
}

export async function readStore() {
  if (cachedData) return cachedData;

  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    cachedData = JSON.parse(raw) as TextileTrackData;
    const alertCount = cachedData.alerts.length;
    syncDerivedAlerts(cachedData);
    if (cachedData.alerts.length !== alertCount) await persist(cachedData);
    return cachedData;
  } catch (error) {
    if (!isMissingFileError(error) && !isUnavailableFileSystemError(error)) throw error;

    cachedData = createSeedData();
    syncDerivedAlerts(cachedData);
    await persist(cachedData);
    return cachedData;
  }
}

export async function writeStore(mutator: (data: TextileTrackData) => TextileTrackData | void) {
  const current = structuredClone(await readStore());
  const next = mutator(current) ?? current;
  syncDerivedAlerts(next);
  cachedData = next;
  await persist(next);
  return next;
}
