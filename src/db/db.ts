import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "../config/env";
import { schema } from "./schema";

const sql = neon(env.DATABASE_URL!);
const db = drizzle({ client: sql, schema });

export default db;
