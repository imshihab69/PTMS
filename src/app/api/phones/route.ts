import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { phoneRecords } from "@/db/schema";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { ilike, or, eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const statusFilter = url.searchParams.get("status") || "";

  let query = db.select().from(phoneRecords);

  const conditions = [];

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(phoneRecords.phoneNumber, pattern),
        ilike(phoneRecords.department, pattern),
        ilike(phoneRecords.note, pattern),
        ilike(phoneRecords.idfPair, pattern),
        ilike(phoneRecords.idfCable, pattern),
        ilike(phoneRecords.mdfPair, pattern),
        ilike(phoneRecords.mdfBlock, pattern)
      )
    );
  }

  if (statusFilter && statusFilter !== "all") {
    conditions.push(eq(phoneRecords.status, statusFilter));
  }

  if (conditions.length > 0) {
    const rows = await db
      .select()
      .from(phoneRecords)
      .where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`)
      .orderBy(phoneRecords.phoneNumber);
    return NextResponse.json({ records: rows });
  }

  const rows = await query.orderBy(phoneRecords.phoneNumber);
  return NextResponse.json({ records: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { phoneNumber, idfPair, idfCable, mdfPair, mdfBlock, department, status, note } = body;

  if (!phoneNumber) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  // Check if phone number already exists
  const existing = await db
    .select()
    .from(phoneRecords)
    .where(eq(phoneRecords.phoneNumber, phoneNumber))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ error: "Phone number already exists" }, { status: 409 });
  }

  const newRecord = {
    phoneNumber,
    idfPair: idfPair || null,
    idfCable: idfCable || null,
    mdfPair: mdfPair || null,
    mdfBlock: mdfBlock || null,
    department: department || null,
    status: status || "active",
    note: note || null,
  };

  await db.insert(phoneRecords).values(newRecord);

  await logAudit({
    action: "CREATE",
    entityType: "phone_record",
    entityId: phoneNumber,
    userId: session.id,
    userName: session.fullName,
    before: null,
    after: newRecord,
    description: `Created phone record ${phoneNumber}`,
  });

  return NextResponse.json({ record: newRecord }, { status: 201 });
}
