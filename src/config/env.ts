import "dotenv/config";
import * as z from "zod";

const envSchema = z.object({
  PORT: z.string().transform(Number),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  FRONTEND_URL: z.string(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment variables:");
  console.log(z.prettifyError(result.error));
  process.exit(1);
}

export const env = result.data;
