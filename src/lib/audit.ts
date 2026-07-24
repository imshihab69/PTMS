import { db } from "@/db";
import { auditLog } from "@/db/schema";

type AuditEntry = {
  action: string;
  entityType: string;
  entityId: string;
  userId: number;
  userName: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  description?: string;
};

export async function logAudit(entry: AuditEntry) {
  await db.insert(auditLog).values({
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    userId: entry.userId,
    userName: entry.userName,
    before: entry.before ?? null,
    after: entry.after ?? null,
    description: entry.description ?? null,
  });
}
