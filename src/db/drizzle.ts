import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { schema } from "./schema/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

export default db;
