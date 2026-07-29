import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export function createDatabase(url = process.env.DATABASE_URL) {
  if (!url) {
    throw new Error("DATABASE_URL es obligatoria.");
  }

  const pool = new Pool({ connectionString: url });
  const db = drizzle({ client: pool, schema });

  return { db, pool };
}
