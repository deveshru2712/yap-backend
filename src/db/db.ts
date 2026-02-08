import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";

import { schema } from "./schema/";
import { env } from "../config/env";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
});

const db = drizzle(pool, {
  schema,
  // logger: true,
});

export default db;
