import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import { env } from "../config/env";

const sql = neon(env.DATABASE_URL);

const db = drizzle(sql, {
  schema,
});

export default db;
