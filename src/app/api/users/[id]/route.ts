import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { eq, and, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !session.active || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = parseInt(id, 10);
  const body = await req.json();

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const before = existing[0];

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (body.fullName !== undefined) updates.fullName = body.fullName;
  if (body.role !== undefined) updates.role = body.role;
  if (body.password) {
    updates.passwordHash = await bcrypt.hash(body.password, 12);
  }

  await db.update(users).set(updates).where(eq(users.id, userId));

  await logAudit({
    action: "UPDATE",
    entityType: "user",
    entityId: String(userId),
    userId: session.id,
    userName: session.fullName,
    before: { fullName: before.fullName, role: before.role },
    after: { fullName: body.fullName || before.fullName, role: body.role || before.role },
    description: `${session.fullName} updated user ${before.fullName}`,
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Activate / Deactivate
  const session = await getSession();
  if (!session || !session.active || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = parseInt(id, 10);
  const body = await req.json();
  const newActive = body.active;

  // Block self-deactivation
  if (userId === session.id && newActive === false) {
    return NextResponse.json(
      { error: "Cannot deactivate your own account" },
      { status: 403 }
    );
  }

  // Block deactivation of the last admin
  if (newActive === false) {
    const targetUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (targetUser.length > 0 && targetUser[0].role === "admin") {
      const activeAdmins = await db
        .select()
        .from(users)
        .where(and(eq(users.role, "admin"), eq(users.active, true), ne(users.id, userId)));
      if (activeAdmins.length === 0) {
        return NextResponse.json(
          { error: "Cannot deactivate the last remaining admin" },
          { status: 403 }
        );
      }
    }
  }

  const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .update(users)
    .set({ active: newActive, updatedAt: new Date() })
    .where(eq(users.id, userId));

  const action = newActive ? "ACTIVATE" : "DEACTIVATE";

  await logAudit({
    action,
    entityType: "user",
    entityId: String(userId),
    userId: session.id,
    userName: session.fullName,
    before: { active: existing[0].active },
    after: { active: newActive },
    description: `${session.fullName} ${action.toLowerCase()}d user ${existing[0].fullName}`,
  });

  return NextResponse.json({ ok: true });
}
