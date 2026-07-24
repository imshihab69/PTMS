CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" varchar(50) NOT NULL,
	"entity_type" varchar(30) NOT NULL,
	"entity_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"user_name" varchar(200),
	"before" jsonb,
	"after" jsonb,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phone_records" (
	"phone_number" varchar(30) PRIMARY KEY NOT NULL,
	"idf_pair" varchar(50),
	"idf_block" varchar(50),
	"mdf_pair" varchar(50),
	"mdf_cable" varchar(50),
	"location" varchar(200),
	"department" varchar(150),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" varchar(200) NOT NULL,
	"role" varchar(20) DEFAULT 'viewer' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
