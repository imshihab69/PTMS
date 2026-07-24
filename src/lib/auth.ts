import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export type SessionUser = {
  id: number;
  username: string;
  fullName: string;
  role: string;
  active: boolean;
};

export async function validateCredentials(
  username: string,
  password: string
): Promise<SessionUser | null> {
  const found = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (found.length === 0) return null;
  const user = found[0];

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  if (!user.active) return null;

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    active: user.active,
  };
}

export async function seedMasterAdmin() {
  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0) return;

  const hash = await bcrypt.hash("admin123", 12);
  await db.insert(users).values({
    username: "admin",
    passwordHash: hash,
    fullName: "Master Administrator",
    role: "admin",
    active: true,
  });
}
