import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import { env } from "../config/env";
import { schema } from "./schema";

const db = drizzle({
  connection: env.DATABASE_URL,
  ws: ws,
  schema,
});

export default db;
