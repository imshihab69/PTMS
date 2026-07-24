import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { phoneRecords } from "@/db/schema";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ phoneNumber: string }> }
) {
  const session = await getSession();
  if (!session || !session.active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phoneNumber } = await params;
  const decoded = decodeURIComponent(phoneNumber);
  const rows = await db
    .select()
    .from(phoneRecords)
    .where(eq(phoneRecords.phoneNumber, decoded))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ record: rows[0] });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ phoneNumber: string }> }
) {
  const session = await getSession();
  if (!session || !session.active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phoneNumber } = await params;
  const decoded = decodeURIComponent(phoneNumber);
  const body = await req.json();

  const existing = await db
    .select()
    .from(phoneRecords)
    .where(eq(phoneRecords.phoneNumber, decoded))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const before = existing[0];

  const updates = {
    idfPair: body.idfPair ?? before.idfPair,
    idfBlock: body.idfBlock ?? before.idfBlock,
    mdfPair: body.mdfPair ?? before.mdfPair,
    mdfCable: body.mdfCable ?? before.mdfCable,
    department: body.department ?? before.department,
    status: body.status ?? before.status,
    note: body.note ?? before.note,
    updatedAt: new Date(),
  };

  await db
    .update(phoneRecords)
    .set(updates)
    .where(eq(phoneRecords.phoneNumber, decoded));

  // Build human-readable description
  const changes: string[] = [];
  if (body.idfPair !== undefined && body.idfPair !== before.idfPair) changes.push(`IDF Pair from "${before.idfPair}" to "${body.idfPair}"`);
  if (body.idfBlock !== undefined && body.idfBlock !== before.idfBlock) changes.push(`IDF Block from "${before.idfBlock}" to "${body.idfBlock}"`);
  if (body.mdfPair !== undefined && body.mdfPair !== before.mdfPair) changes.push(`MDF Pair from "${before.mdfPair}" to "${body.mdfPair}"`);
  if (body.mdfCable !== undefined && body.mdfCable !== before.mdfCable) changes.push(`MDF Cable from "${before.mdfCable}" to "${body.mdfCable}"`);
  if (body.department !== undefined && body.department !== before.department) changes.push(`Department from "${before.department}" to "${body.department}"`);
  if (body.status !== undefined && body.status !== before.status) changes.push(`Status from "${before.status}" to "${body.status}"`);
  if (body.note !== undefined && body.note !== before.note) changes.push(`Note updated`);

  const desc = changes.length > 0
    ? `${session.fullName} changed ${changes.join(", ")}`
    : `${session.fullName} updated record ${decoded}`;

  await logAudit({
    action: "UPDATE",
    entityType: "phone_record",
    entityId: decoded,
    userId: session.id,
    userName: session.fullName,
    before: before as unknown as Record<string, unknown>,
    after: { ...before, ...updates } as unknown as Record<string, unknown>,
    description: desc,
  });

  return NextResponse.json({ record: { ...before, ...updates } });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ phoneNumber: string }> }
) {
  const session = await getSession();
  if (!session || !session.active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phoneNumber } = await params;
  const decoded = decodeURIComponent(phoneNumber);

  const existing = await db
    .select()
    .from(phoneRecords)
    .where(eq(phoneRecords.phoneNumber, decoded))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(phoneRecords).where(eq(phoneRecords.phoneNumber, decoded));

  await logAudit({
    action: "DELETE",
    entityType: "phone_record",
    entityId: decoded,
    userId: session.id,
    userName: session.fullName,
    before: existing[0] as unknown as Record<string, unknown>,
    after: null,
    description: `${session.fullName} deleted phone record ${decoded}`,
  });

  return NextResponse.json({ ok: true });
}
