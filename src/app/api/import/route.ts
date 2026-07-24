import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { phoneRecords } from "@/db/schema";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { eq } from "drizzle-orm";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admins can import
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mode = formData.get("mode") as string || "skip"; // skip | update | replace

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ error: "No worksheet found in file" }, { status: 400 });
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);

    if (rows.length === 0) {
      return NextResponse.json({ error: "No data rows found" }, { status: 400 });
    }

    // Map column names (flexible mapping)
    const normalizeKey = (key: string) => key.toLowerCase().replace(/[\s_-]/g, "");
    
    const columnMap: Record<string, string> = {
      phonenumber: "phoneNumber",
      phone: "phoneNumber",
      number: "phoneNumber",
      idfpair: "idfPair",
      idf: "idfPair",
      idfcable: "idfCable",
      cable: "idfCable",
      mdfpair: "mdfPair",
      mdf: "mdfPair",
      mdfblock: "mdfBlock",
      block: "mdfBlock",
      department: "department",
      dept: "department",
      status: "status",
      note: "note",
      notes: "note",
    };

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const mapped: Record<string, string> = {};
      
      for (const [key, value] of Object.entries(row)) {
        const normalizedKey = normalizeKey(key);
        const mappedKey = columnMap[normalizedKey];
        if (mappedKey && value !== undefined && value !== null) {
          mapped[mappedKey] = String(value).trim();
        }
      }

      if (!mapped.phoneNumber) {
        errors.push(`Row ${i + 2}: Missing phone number`);
        continue;
      }

      const phoneNumber = mapped.phoneNumber;
      const status = ["active", "inactive", "maintenance"].includes(mapped.status?.toLowerCase() || "")
        ? mapped.status.toLowerCase()
        : "active";

      const recordData = {
        phoneNumber,
        idfPair: mapped.idfPair || null,
        idfCable: mapped.idfCable || null,
        mdfPair: mapped.mdfPair || null,
        mdfBlock: mapped.mdfBlock || null,
        department: mapped.department || null,
        status,
        note: mapped.note || null,
      };

      // Check if exists
      const existing = await db
        .select()
        .from(phoneRecords)
        .where(eq(phoneRecords.phoneNumber, phoneNumber))
        .limit(1);

      if (existing.length > 0) {
        if (mode === "skip") {
          skipped++;
          continue;
        } else if (mode === "update") {
          await db
            .update(phoneRecords)
            .set({ ...recordData, updatedAt: new Date() })
            .where(eq(phoneRecords.phoneNumber, phoneNumber));
          updated++;
        }
      } else {
        await db.insert(phoneRecords).values(recordData);
        created++;
      }
    }

    await logAudit({
      action: "IMPORT",
      entityType: "phone_record",
      entityId: "bulk",
      userId: session.id,
      userName: session.fullName,
      before: null,
      after: { created, updated, skipped, mode },
      description: `${session.fullName} imported ${created + updated} phone records (${created} new, ${updated} updated, ${skipped} skipped)`,
    });

    return NextResponse.json({
      success: true,
      created,
      updated,
      skipped,
      errors: errors.slice(0, 10), // Limit errors returned
      totalErrors: errors.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
