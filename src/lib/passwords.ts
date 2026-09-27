import bcrypt from "bcryptjs";

const COST = 10;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

// Compared against when the email doesn't exist, so a failed login takes the
// same time either way and can't be used to discover which emails have accounts.
let dummyHash: Promise<string> | null = null;

export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  if (hash) return bcrypt.compare(password, hash);
  dummyHash ??= bcrypt.hash("no-such-account", COST);
  await bcrypt.compare(password, await dummyHash);
  return false;
}
