import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// all the schema contained in the index.ts file
import * as schema from "./schema";
import { env } from "../config/env";

const sql = neon(env.DATABASE_URL);

const db = drizzle(sql, {
  schema,
  logger: true,
});

export default db;
