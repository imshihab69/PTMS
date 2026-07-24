import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getSession();
  if (!session || !session.active || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .orderBy(users.id);

  return NextResponse.json({ users: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.active || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { username, password, fullName, role } = body;

  if (!username || !password || !fullName) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);

  try {
    const inserted = await db
      .insert(users)
      .values({
        username,
        passwordHash: hash,
        fullName,
        role: role || "viewer",
        active: true,
      })
      .returning({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        role: users.role,
        active: users.active,
      });

    await logAudit({
      action: "CREATE",
      entityType: "user",
      entityId: String(inserted[0].id),
      userId: session.id,
      userName: session.fullName,
      before: null,
      after: { username, fullName, role: role || "viewer" },
      description: `${session.fullName} created user ${fullName}`,
    });

    return NextResponse.json({ user: inserted[0] }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
