import { createDatabase } from "@/infrastructure/database/client";
import { seedFixture } from "@/infrastructure/database/seed";

async function main(): Promise<void> {
  const databaseUrl =
    process.env.DATABASE_URL ?? "postgres://evm:evm@127.0.0.1:5432/evm";
  const { db, pool } = createDatabase(databaseUrl);

  try {
    await seedFixture(db);
    console.log("Semilla cargada: 2 proyectos y 8 actividades.");
  } finally {
    await pool.end();
  }
}

void main();
