import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { SessionUser } from "./auth";

const SESSION_COOKIE = "ptms_session";

export async function createSession(user: SessionUser) {
  // Simple token: base64 of JSON with user id + timestamp
  const token = Buffer.from(
    JSON.stringify({ id: user.id, ts: Date.now() })
  ).toString("base64");

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24h
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());
    const found = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1);

    if (found.length === 0) return null;
    const user = found[0];

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      active: user.active,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
