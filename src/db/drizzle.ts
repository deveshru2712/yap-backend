import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { env } from "../config/env";
import { schema } from "./schema/schema";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
});

const db = drizzle(pool, {
  schema,
  // logger: true,
});

export default db;
