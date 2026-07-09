import { randomBytes, randomInt, createHash } from "node:crypto";
import { networkInterfaces } from "node:os";
import { getDb } from "@ai-usage-tracker/db";
import { logActivity } from "./activity.js";

const CODE_TTL_MS = 10 * 60 * 1000;

interface PendingCode {
  expiresAt: number;
}

// Ephemeral by design — pairing codes are single-use and short-lived, no
// need to survive a server restart.
const pendingCodes = new Map<string, PendingCode>();

function purgeExpiredCodes(): void {
  const now = Date.now();
  for (const [code, entry] of pendingCodes) {
    if (entry.expiresAt <= now) pendingCodes.delete(code);
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Virtual adapters (WSL, Hyper-V, Docker, VMware, VirtualBox, ...) show up
// as regular non-internal IPv4 interfaces but aren't reachable from a phone
// on the real WiFi — deprioritize anything whose name looks virtual.
const VIRTUAL_ADAPTER_PATTERN = /vethernet|virtual|vmware|virtualbox|docker|wsl|hyper-v/i;

/** Best-effort LAN IPv4 address, so the pairing QR can embed a complete URL. */
function getLanAddress(): string | null {
  const interfaces = networkInterfaces();
  let fallback: string | null = null;

  for (const [name, entries] of Object.entries(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family !== "IPv4" || entry.internal) continue;
      if (!VIRTUAL_ADAPTER_PATTERN.test(name)) return entry.address;
      fallback ??= entry.address;
    }
  }
  return fallback;
}

export function startPairing(port: number) {
  purgeExpiredCodes();
  const code = String(randomInt(100000, 1000000)); // 6 digits, easy to type by hand
  pendingCodes.set(code, { expiresAt: Date.now() + CODE_TTL_MS });
  return { code, expiresAt: Date.now() + CODE_TTL_MS, host: getLanAddress(), port };
}

export async function claimPairing(code: string, deviceName: string) {
  purgeExpiredCodes();
  const entry = pendingCodes.get(code);
  if (!entry) {
    throw new Error("Invalid or expired pairing code");
  }
  pendingCodes.delete(code); // single-use

  const token = randomBytes(32).toString("base64url");
  const db = getDb();
  const name = deviceName || "Mobile device";
  await db.pairedDevice.create({
    data: { name, tokenHash: hashToken(token) },
  });
  await logActivity("device_paired", `Paired device "${name}"`);

  // Only time the raw token is ever available — callers must persist it themselves.
  return { token };
}

export async function verifyToken(token: string) {
  const db = getDb();
  const device = await db.pairedDevice.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!device) return null;
  await db.pairedDevice.update({ where: { id: device.id }, data: { lastSeenAt: new Date() } });
  return device;
}

export async function listPairedDevices() {
  const db = getDb();
  return db.pairedDevice.findMany({ orderBy: { lastSeenAt: "desc" } });
}

export async function revokeDevice(id: string): Promise<void> {
  const db = getDb();
  const device = await db.pairedDevice.findUnique({ where: { id } });
  await db.pairedDevice.delete({ where: { id } });
  if (device) {
    await logActivity("device_revoked", `Revoked device "${device.name}"`);
  }
}
