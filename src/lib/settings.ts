import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getEnv } from "./env";

type AdminRecordV1 = {
  version: 1;
  username: string;
  salt: string; // base64
  passwordHash: string; // base64
};

const DATA_DIR = path.join(process.cwd(), "data");
const ADMIN_FILE = path.join(DATA_DIR, "admin.json");

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

async function scryptHash(password: string, saltB64?: string) {
  const salt = saltB64 ? Buffer.from(saltB64, "base64") : crypto.randomBytes(16);
  const hash = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
  return { saltB64: salt.toString("base64"), hashB64: hash.toString("base64") };
}

export async function loadAdmin(): Promise<AdminRecordV1> {
  if (!fs.existsSync(ADMIN_FILE)) {
    // bootstrap from env
    const { ADMIN_USERNAME, ADMIN_PASSWORD } = getEnv();
    ensureDir(DATA_DIR);
    const { saltB64, hashB64 } = await scryptHash(ADMIN_PASSWORD);
    const rec: AdminRecordV1 = { version: 1, username: ADMIN_USERNAME, salt: saltB64, passwordHash: hashB64 };
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(rec, null, 2), "utf8");
    return rec;
  }
  const raw = fs.readFileSync(ADMIN_FILE, "utf8");
  const data = JSON.parse(raw) as AdminRecordV1;
  return data;
}

export async function verifyAdminPassword(plain: string): Promise<boolean> {
  const rec = await loadAdmin();
  const { hashB64 } = await scryptHash(plain, rec.salt);
  return crypto.timingSafeEqual(Buffer.from(hashB64, "base64"), Buffer.from(rec.passwordHash, "base64"));
}

export async function updateAdminCredentials(opts: { username?: string; newPassword?: string }) {
  const rec = await loadAdmin();
  let updated: AdminRecordV1 = rec;
  if (typeof opts.username === "string" && opts.username.length > 0) {
    updated = { ...updated, username: opts.username };
  }
  if (typeof opts.newPassword === "string" && opts.newPassword.length > 0) {
    const { saltB64, hashB64 } = await scryptHash(opts.newPassword);
    updated = { ...updated, salt: saltB64, passwordHash: hashB64 };
  }
  ensureDir(DATA_DIR);
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(updated, null, 2), "utf8");
  return updated;
}

export async function getAdminUsername() {
  const rec = await loadAdmin();
  return rec.username;
}
