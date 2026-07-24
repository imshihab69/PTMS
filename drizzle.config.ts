import { config } from 'dotenv';
import { defineConfig } from "drizzle-kit";

// تحميل المتغيرات من ملف .env.local
config({ path: '.env.local' });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});