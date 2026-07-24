import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  serial,
  varchar,
  integer,
} from "drizzle-orm/pg-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("viewer"), // admin | viewer
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Phone Records ──────────────────────────────────────────────────────────
export const phoneRecords = pgTable("phone_records", {
  phoneNumber: varchar("phone_number", { length: 30 }).primaryKey(),
  idfPair: varchar("idf_pair", { length: 50 }),
  idfBlock: varchar("idf_block", { length: 50 }),
  mdfPair: varchar("mdf_pair", { length: 50 }),
  mdfCable: varchar("mdf_cable", { length: 50 }),
  location: varchar("location", { length: 200 }),
  department: varchar("department", { length: 150 }),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active | inactive | maintenance
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Audit Log ──────────────────────────────────────────────────────────────
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 50 }).notNull(), // CREATE | UPDATE | DELETE | EXPORT | ACTIVATE | DEACTIVATE | IMPORT
  entityType: varchar("entity_type", { length: 30 }).notNull(), // phone_record | user
  entityId: text("entity_id").notNull(),
  userId: integer("user_id").notNull(), // Changed from serial to integer - references the user who performed action
  userName: varchar("user_name", { length: 200 }),
  before: jsonb("before"),
  after: jsonb("after"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
